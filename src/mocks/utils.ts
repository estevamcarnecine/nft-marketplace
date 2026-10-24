import { HttpResponse, delay, type HttpResponseResolver } from 'msw'
import { NETWORKS, WALLET_TYPES } from '@/types'
import type { NetworkId, User, WalletType } from '@/types'
import { type StoredUser } from './db'
import { schedulePersist } from './persistence'
import { TIMEOUT_DELAY_MS, isOffline, isTimedOut, latencyFor, takeFailure } from './scenario'
import { bearerToken, checkSession } from './session'

type JsonBody = Parameters<typeof HttpResponse.json>[0]
type ResolverInfo = Parameters<HttpResponseResolver>[0]
type Resolver = (info: ResolverInfo) => Response | Promise<Response>

export function json(body: JsonBody, status = 200) {
  return HttpResponse.json(body, { status })
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return HttpResponse.json({ code, message, ...extra }, { status })
}

export function validationError(errors: Record<string, string>) {
  return errorResponse(422, 'VALIDATION_ERROR', 'Revise os campos destacados', { errors })
}

const SESSIONLESS_KEYS = new Set(['auth.login', 'auth.signup', 'auth.logout'])

export function withScenario(key: string, resolver: Resolver): HttpResponseResolver {
  return async (info) => {
    await delay(latencyFor(key))
    if (isOffline(key)) return HttpResponse.error()
    if (isTimedOut(key)) await delay(TIMEOUT_DELAY_MS)
    const status = takeFailure(key)
    if (status !== null) {
      return errorResponse(
        status,
        status >= 500 ? 'SERVICE_UNAVAILABLE' : 'SCENARIO_FAILURE',
        status >= 500 ? 'O serviço está temporariamente indisponível. Tente novamente.' : `Falha simulada em ${key}`,
      )
    }
    if (!SESSIONLESS_KEYS.has(key) && bearerToken(info.request) && checkSession(info.request).status !== 'valid') {
      return unauthorized(info.request)
    }
    const response = await resolver(info)
    if (info.request.method !== 'GET') schedulePersist()
    return response
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json()
    return isRecord(body) ? body : {}
  } catch {
    return {}
  }
}

export function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function csv(value: string | null): string[] {
  return value
    ? value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : []
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isNetwork(value: string): value is NetworkId {
  return NETWORKS.some((network) => network.id === value)
}

export function isWalletType(value: string): value is WalletType {
  return WALLET_TYPES.some((type) => type.id === value)
}

export function isValidAddress(network: NetworkId, address: string): boolean {
  if (network === 'solana') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function publicUser(user: StoredUser): User {
  return { id: user.id, name: user.name, email: user.email }
}

export function authenticate(request: Request): StoredUser | null {
  const session = checkSession(request)
  return session.status === 'valid' ? session.user : null
}

export function unauthorized(request?: Request) {
  if (request && checkSession(request).status === 'expired') {
    return errorResponse(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
  }
  return errorResponse(401, 'UNAUTHORIZED', 'Faça login para continuar')
}