import { addEth, mulEthInt, percentOfEth, subEth, sumEth } from '@/lib/eth'
import type { Cart, CartLine, OrderStatus, Quote, QuoteLine } from '@/types'
import { db, findEdition, findNft, nextId, parseCartKey, serializeNft } from './db'
import { scenario } from './scenario'
import { broadcast } from './socket'

export const NETWORK_FEE = '0.016'
export const PROMO_CODES: Record<string, number> = { KURIO10: 10 }
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
  return {
    items,
    count: items.reduce((total, line) => total + line.quantity, 0),
    subtotal: sumEth(items.map((line) => line.lineTotal)),
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
  const percent = promoCode ? (PROMO_CODES[promoCode] ?? 0) : 0
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