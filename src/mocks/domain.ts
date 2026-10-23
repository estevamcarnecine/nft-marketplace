import { addEth, mulEthInt, percentOfEth, subEth, sumEth } from '@/lib/eth'
import type { AppliedCoupon, Cart, CartLine, OrderStatus, Quote, QuoteLine } from '@/types'
import {
  FIXTURE_EPOCH,
  cartKey,
  db,
  findEdition,
  findNft,
  nextId,
  parseCartKey,
  serializeNft,
  syncAvailability,
  toNftUpdated,
  userCartKey,
  type StoredCart,
} from './db'
import { getCart, peekCart, type CartOwner } from './carts'
import { schedulePersist } from './persistence'
import { scenario } from './scenario'
import { broadcast } from './socket'

export const NETWORK_FEE = '0.016'
interface CouponRule {
  percent: number
  expiresAt: number
}

const DAY_MS = 86_400_000

// Deterministic fixtures: two valid codes and one that expired before the fixture epoch.
export const COUPONS: Record<string, CouponRule> = {
  KURIO10: { percent: 10, expiresAt: FIXTURE_EPOCH + 3650 * DAY_MS },
  BEMVINDO5: { percent: 5, expiresAt: FIXTURE_EPOCH + 3650 * DAY_MS },
  NATAL2025: { percent: 15, expiresAt: FIXTURE_EPOCH - 290 * DAY_MS },
}

export type CouponCheck =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; code: 'COUPON_INVALID' | 'COUPON_EXPIRED'; message: string }

export function checkCoupon(raw: string, now = Date.now()): CouponCheck {
  const code = raw.trim().toUpperCase()
  const rule = Object.hasOwn(COUPONS, code) ? COUPONS[code] : undefined
  if (!rule) return { ok: false, code: 'COUPON_INVALID', message: 'Código promocional inválido' }
  if (rule.expiresAt < now) return { ok: false, code: 'COUPON_EXPIRED', message: 'Este código promocional expirou' }
  return { ok: true, coupon: { code, percent: rule.percent } }
}

/** The cart coupon, dropped when it is no longer valid. */
function activeCoupon(cart: StoredCart): AppliedCoupon | null {
  if (!cart.coupon) return null
  const check = checkCoupon(cart.coupon)
  return check.ok ? check.coupon : null
}
const QUOTE_TTL_MS = 5 * 60 * 1000

export function buildCart(owner: CartOwner): Cart {
  const stored = peekCart(owner.key)
  const userId = owner.userId
  const items: CartLine[] = []
  for (const [key, quantity] of stored.lines) {
    const parsed = parseCartKey(key)
    const nft = parsed && findNft(parsed.nftId)
    const edition = parsed && nft && findEdition(nft, parsed.editionId)
    if (!nft || !edition) continue
    items.push({
      id: key,
      nft: serializeNft(nft, userId),
      edition: { ...edition },
      quantity,
      lineTotal: mulEthInt(nft.price, quantity),
    })
  }
  const subtotal = sumEth(items.map((line) => line.lineTotal))
  const coupon = items.length > 0 ? activeCoupon(stored) : null
  const discount = percentOfEth(subtotal, coupon?.percent ?? 0)
  const networkFee = items.length > 0 ? NETWORK_FEE : '0'
  return {
    items,
    count: items.reduce((total, line) => total + line.quantity, 0),
    subtotal,
    coupon,
    discount,
    networkFee,
    total: addEth(subEth(subtotal, discount), networkFee),
  }
}

export function createQuote(userId: string, promoCode: string | null): Quote {
  const cart = buildCart({ key: userCartKey(userId), userId })
  const lines: QuoteLine[] = cart.items.map(({ nft, edition, quantity, lineTotal }) => ({
    nftId: nft.id,
    editionId: edition.id,
    editionLabel: edition.label,
    name: nft.name,
    tokenId: nft.tokenId,
    image: nft.image,
    quantity,
    unitPrice: nft.price,
    lineTotal,
  }))
  const check = promoCode ? checkCoupon(promoCode) : null
  const percent = check?.ok ? check.coupon.percent : 0
  const discount = percentOfEth(cart.subtotal, percent)
  const now = Date.now()

  const quote: Quote = {
    id: nextId('quote'),
    promoCode,
    lines,
    subtotal: cart.subtotal,
    discount,
    networkFee: NETWORK_FEE,
    total: addEth(subEth(cart.subtotal, discount), NETWORK_FEE),
    currency: 'ETH',
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }
  db.quotes.set(quote.id, { userId, quote })
  return quote
}

/** Everything the buyer agreed to; ids and timestamps are left out on purpose. */
export function quoteFingerprint(quote: Quote): string {
  return JSON.stringify([
    quote.promoCode,
    quote.lines.map((line) => [line.nftId, line.editionId, line.quantity, line.unitPrice]),
    quote.subtotal,
    quote.discount,
    quote.networkFee,
    quote.total,
  ])
}

/** Deterministic fake transaction hash, so a receipt always shows the same reference. */
function simulatedTxHash(seed: string): string {
  let state = 2166136261
  let hex = ''
  while (hex.length < 64) {
    for (const char of seed + hex.length) state = Math.imul(state ^ char.charCodeAt(0), 16777619)
    hex += (state >>> 0).toString(16).padStart(8, '0')
  }
  return `0x${hex.slice(0, 64)}`
}

/** Removes exactly the purchased quantities from the buyer's cart, keeping anything added since. */
function removePurchasedFromCart(userId: string, lines: QuoteLine[]): void {
  const cart = getCart(userCartKey(userId))
  for (const line of lines) {
    const key = cartKey(line.nftId, line.editionId)
    const remaining = (cart.lines.get(key) ?? 0) - line.quantity
    if (remaining > 0) cart.lines.set(key, remaining)
    else cart.lines.delete(key)
  }
  if (cart.lines.size === 0) cart.coupon = null
}

function settleOrder(orderId: string): void {
  const stored = db.orders.find((entry) => entry.order.id === orderId)
  if (!stored || stored.order.status !== 'pending') return
  const order = stored.order

  let status: OrderStatus = scenario.orderOutcome
  let reason: string | null = status === 'rejected' ? 'O pagamento foi recusado pela carteira.' : null

  if (status === 'confirmed') {
    const shortLine = order.lines.find((line) => {
      const nft = findNft(line.nftId)
      const edition = nft && findEdition(nft, line.editionId)
      return !edition || edition.available < line.quantity
    })
    if (shortLine) {
      status = 'rejected'
      reason = `A edição ${shortLine.editionLabel} de ${shortLine.name} esgotou antes da confirmação.`
    }
  }

  if (status === 'confirmed') {
    for (const line of order.lines) {
      const nft = findNft(line.nftId)
      const edition = nft && findEdition(nft, line.editionId)
      if (!nft || !edition) continue
      edition.available -= line.quantity
      syncAvailability(nft)
      broadcast('nft.updated', toNftUpdated(nft))
    }
    removePurchasedFromCart(stored.userId, order.lines)
    order.txHash = simulatedTxHash(order.id)
    // In-app simulated explorer: no real chain is involved.
    order.explorerUrl = `/explorer/tx/${order.txHash}`
  }

  order.status = status
  order.rejectionReason = reason
  order.updatedAt = new Date().toISOString()
  broadcast('order.updated', { id: order.id, status, updatedAt: order.updatedAt })
  schedulePersist()
}

export function resumePendingOrders(): void {
  for (const { order } of db.orders) {
    if (order.status === 'pending') scheduleOrderProgress(order.id)
  }
}

/** Payment settles asynchronously, like a transaction waiting for confirmation. */
export function scheduleOrderProgress(orderId: string): void {
  setTimeout(() => settleOrder(orderId), scenario.orderSettleMs)
}