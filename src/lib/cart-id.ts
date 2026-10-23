const CART_ID_KEY = 'kurio.cartId'

let fallback: string | null = null

/**
 * Visitors get a random cart id, sent as `X-Cart-Id`, so their cart survives refreshes and can be
 * merged into the account at login. Signed-in requests use the account cart instead.
 */
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

/** After a merge (login) or logout, the next visitor cart starts empty under a new id. */
export function rotateGuestCartId(): void {
  try {
    localStorage.removeItem(CART_ID_KEY)
  } catch {
    // sem armazenamento: a próxima chamada gera um id em memória
  }
  fallback = null
}
