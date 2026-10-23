import { addEth, mulEthInt, percentOfEth, subEth, sumEth } from '@/lib/eth'
import type { AppliedCoupon, Cart, CartLine, OrderStatus, Quote, QuoteLine } from '@/types'
import { FIXTURE_EPOCH, db, findEdition, findNft, nextId, parseCartKey, serializeNft } from './db'
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
function activeCoupon(): AppliedCoupon | null {
  if (!db.cartCoupon) return null
  const check = checkCoupon(db.cartCoupon)
  return check.ok ? check.coupon : null
}
const QUOTE_TTL_MS = 5 * 60 * 1000

export function buildCart(userId?: string): Cart {
  const items: CartLine[] = []
  for (const [key, quantity] of db.cart) {
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
  const coupon = items.length > 0 ? activeCoupon() : null
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
  const cart = buildCart()
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

export function scheduleOrderProgress(orderId: string): void {
  const steps: [number, OrderStatus][] = [
    [1500, 'processing'],
    [4000, scenario.orderOutcome],
  ]
  for (const [delayMs, status] of steps) {
    setTimeout(() => {
      const stored = db.orders.find((entry) => entry.order.id === orderId)
      if (!stored) return
      stored.order.status = status
      stored.order.updatedAt = new Date().toISOString()
      broadcast('order.updated', {
        id: stored.order.id,
        status,
        updatedAt: stored.order.updatedAt,
      })
    }, delayMs)
  }
}