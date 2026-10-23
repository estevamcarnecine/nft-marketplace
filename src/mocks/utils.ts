import { HttpResponse, delay, type HttpResponseResolver } from 'msw'
import { NETWORKS, WALLET_TYPES } from '@/types'
import type { NetworkId, User, WalletType } from '@/types'
import { db, type StoredUser } from './db'
import { scenario, takeFailure } from './scenario'

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

export function withScenario(key: string, resolver: Resolver): HttpResponseResolver {
  return async (info) => {
    await delay(scenario.latencyMs)
    const status = takeFailure(key)
    if (status !== null) {
      return errorResponse(status, 'SCENARIO_FAILURE', `Falha simulada em ${key}`)
    }
    return resolver(info)
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

const TOKEN_PREFIX = 'mock-token-'

export function tokenFor(user: StoredUser): string {
  return `${TOKEN_PREFIX}${user.id}`
}

export function publicUser(user: StoredUser): User {
  return { id: user.id, name: user.name, email: user.email }
}

export function authenticate(request: Request): StoredUser | null {
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token.startsWith(TOKEN_PREFIX)) return null
  const id = token.slice(TOKEN_PREFIX.length)
  return db.users.find((user) => user.id === id) ?? null
}

export function unauthorized() {
  return errorResponse(401, 'UNAUTHORIZED', 'Faça login para continuar')
}