import { queryOptions, useMutation } from '@tanstack/react-query'

import { api, isApiError, newIdempotencyKey } from '@/lib/api'
import type {
  CreateOrderInput,
  ExplorerTransaction,
  NetworkId,
  Order,
  Profile,
  Quote,
  WalletSession,
  WalletType,
} from '@/types'

export const profileQuery = queryOptions({
  queryKey: ['profile'] as const,
  queryFn: ({ signal }) => api.get<Profile>('/profile', { signal }),
})

export function orderQuery(id: string) {
  return queryOptions({
    queryKey: ['orders', id] as const,
    queryFn: ({ signal }) => api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal }),
  })
}

export function explorerTxQuery(hash: string) {
  return queryOptions({
    queryKey: ['explorer', 'tx', hash] as const,
    queryFn: ({ signal }) => api.get<ExplorerTransaction>(`/explorer/tx/${encodeURIComponent(hash)}`, { signal }),
  })
}

export function useConnectWallet() {
  return useMutation({
    mutationFn: (input: { type: WalletType; network: NetworkId; address: string }) =>
      api.post<WalletSession>('/wallet-sessions', input),
  })
}

export function useDisconnectWallet() {
  return useMutation({
    mutationFn: (sessionId: string) => api.delete<void>(`/wallet-sessions/${encodeURIComponent(sessionId)}`),
  })
}

export function useCreateQuote() {
  return useMutation({
    mutationFn: () => api.post<Quote>('/quotes', {}),
  })
}

const ATTEMPT_KEY = 'kurio.checkout.attempt'
const ORDER_TIMEOUT_MS = 10_000

interface Attempt {
  key: string
  fingerprint: string
}

function readAttempt(): Attempt | null {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_KEY)
    return raw ? (JSON.parse(raw) as Attempt) : null
  } catch {
    return null
  }
}

function writeAttempt(attempt: Attempt | null): void {
  try {
    if (attempt) sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt))
    else sessionStorage.removeItem(ATTEMPT_KEY)
  } catch {}
}

function keyFor(input: CreateOrderInput): string {
  const fingerprint = JSON.stringify(input)
  const current = readAttempt()
  if (current?.fingerprint === fingerprint) return current.key
  const next = { key: newIdempotencyKey(), fingerprint }
  writeAttempt(next)
  return next.key
}

function clearOrderAttempt(): void {
  writeAttempt(null)
}

function isTransient(error: unknown): boolean {
  return isApiError(error) && (error.status === 0 || error.status >= 500)
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      api.post<Order>('/orders', input, {
        headers: { 'Idempotency-Key': keyFor(input) },
        timeout: ORDER_TIMEOUT_MS,
      }),
    retry: (failureCount, error) => failureCount < 2 && isTransient(error),
    onSuccess: () => clearOrderAttempt(),
    onError: (error) => {
      if (isApiError(error) && error.code === 'IDEMPOTENCY_CONFLICT') clearOrderAttempt()
    },
  })
}
