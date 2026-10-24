import { useSyncExternalStore } from 'react'

const TOKEN_KEY = 'nft.token'

type TokenChangeReason = 'login' | 'logout' | 'expired' | 'external'

type TokenListener = (token: string | null, reason: TokenChangeReason) => void
const listeners = new Set<TokenListener>()

function notify(token: string | null, reason: TokenChangeReason): void {
  for (const listener of listeners) listener(token, reason)
}

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
  } catch {}
  notify(token, 'login')
}

export function clearToken(reason: 'logout' | 'expired' = 'logout'): void {
  const had = getToken() !== null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {}
  if (had) notify(null, reason)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

function subscribe(listener: () => void): () => void {
  return onTokenChange(listener)
}

export function useToken(): string | null {
  return useSyncExternalStore(subscribe, getToken)
}
