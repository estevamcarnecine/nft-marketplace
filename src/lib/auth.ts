import { useSyncExternalStore } from 'react'

const TOKEN_KEY = 'nft.token'

/** Why the session token changed; `external` is another tab logging in or out. */
export type TokenChangeReason = 'login' | 'logout' | 'expired' | 'external'

type TokenListener = (token: string | null, reason: TokenChangeReason) => void
const listeners = new Set<TokenListener>()

function notify(token: string | null, reason: TokenChangeReason): void {
  for (const listener of listeners) listener(token, reason)
}

/** Login, logout, an expired session or another tab changing it; returns the unsubscribe function. */
export function onTokenChange(listener: TokenListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY) notify(event.newValue, 'external')
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
  notify(token, 'login')
}

export function clearToken(reason: 'logout' | 'expired' = 'logout'): void {
  const had = getToken() !== null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage indisponível, ignora
  }
  if (had) notify(null, reason)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

function subscribe(listener: () => void): () => void {
  return onTokenChange(listener)
}

/** The current token, re-rendering on login, logout, expiry and changes from other tabs. */
export function useToken(): string | null {
  return useSyncExternalStore(subscribe, getToken)
}
