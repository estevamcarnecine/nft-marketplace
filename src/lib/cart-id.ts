const CART_ID_KEY = 'kurio.cartId'

let fallback: string | null = null

export function getGuestCartId(): string {
  try {
    const existing = localStorage.getItem(CART_ID_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    localStorage.setItem(CART_ID_KEY, created)
    return created
  } catch {
    fallback ??= crypto.randomUUID()
    return fallback
  }
}

export function rotateGuestCartId(): void {
  try {
    localStorage.removeItem(CART_ID_KEY)
  } catch {}
  fallback = null
}
