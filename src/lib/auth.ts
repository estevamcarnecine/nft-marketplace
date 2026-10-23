const TOKEN_KEY = 'nft.token'

type TokenListener = (token: string | null) => void
const listeners = new Set<TokenListener>()

function notify(token: string | null): void {
  for (const listener of listeners) listener(token)
}

/** Login, logout, a 401 or another tab changing the session; returns the unsubscribe function. */
export function onTokenChange(listener: TokenListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY) notify(event.newValue)
  })
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage indisponível, ignora
  }
  notify(token)
}

export function clearToken(): void {
  const had = getToken() !== null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage indisponível, ignora
  }
  if (had) notify(null)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
