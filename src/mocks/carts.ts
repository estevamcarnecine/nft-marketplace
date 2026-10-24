import { db, findEdition, findNft, guestCartKey, parseCartKey, userCartKey, type StoredCart } from './db'
import { authenticate } from './utils'

export const MAX_PER_LINE = 99
const CART_HEADER = 'x-cart-id'
const CART_ID = /^[a-zA-Z0-9-]{8,64}$/

export interface CartOwner {
  key: string
  userId?: string
}

export function cartOwner(request: Request): CartOwner | null {
  const user = authenticate(request)
  if (user) return { key: userCartKey(user.id), userId: user.id }
  const id = request.headers.get(CART_HEADER) ?? ''
  return CART_ID.test(id) ? { key: guestCartKey(id) } : null
}

export function getCart(key: string): StoredCart {
  let cart = db.carts.get(key)
  if (!cart) {
    cart = { lines: new Map(), coupon: null }
    db.carts.set(key, cart)
  }
  return cart
}

export function peekCart(key: string): StoredCart {
  return db.carts.get(key) ?? { lines: new Map(), coupon: null }
}

export function mergeGuestCart(guestId: string | undefined, userId: string): void {
  if (!guestId || !CART_ID.test(guestId)) return
  const guest = db.carts.get(guestCartKey(guestId))
  if (!guest) return
  const target = getCart(userCartKey(userId))
  for (const [key, quantity] of guest.lines) {
    const parsed = parseCartKey(key)
    const nft = parsed && findNft(parsed.nftId)
    const edition = parsed && nft && findEdition(nft, parsed.editionId)
    if (!edition) continue
    const merged = Math.min((target.lines.get(key) ?? 0) + quantity, edition.available, MAX_PER_LINE)
    if (merged > 0) target.lines.set(key, merged)
  }
  target.coupon = target.coupon ?? guest.coupon
  db.carts.delete(guestCartKey(guestId))
}
