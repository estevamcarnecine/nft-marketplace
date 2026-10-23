import { db, type StoredUser } from './db'
import { scenario } from './scenario'

/** Sliding session: every authenticated request extends it by this much. */
export const SESSION_TTL_MS = 30 * 60 * 1000

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Salted SHA-256. Enough for a simulation: no password is ever stored or logged in plain text. */
export async function hashPassword(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

export function newSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(user: StoredUser, password: string): Promise<boolean> {
  return (await hashPassword(user.salt, password)) === user.passwordHash
}

export function createSession(userId: string): { token: string; expiresAt: number } {
  const token = `kurio_${crypto.randomUUID().replaceAll('-', '')}`
  const now = Date.now()
  const expiresAt = now + SESSION_TTL_MS
  db.sessions.set(token, { userId, createdAt: now, expiresAt })
  return { token, expiresAt }
}

export function revokeSession(token: string): void {
  db.sessions.delete(token)
}

export function bearerToken(request: Request): string {
  const header = request.headers.get('authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

type SessionCheck =
  | { status: 'valid'; user: StoredUser; token: string; expiresAt: number }
  | { status: 'expired' | 'missing' }

/** The `session:expire` scenario ends every session opened before its deadline. */
function isExpired(createdAt: number, expiresAt: number, now: number): boolean {
  if (expiresAt <= now) return true
  return scenario.sessionDeadline !== null && now >= scenario.sessionDeadline && createdAt < scenario.sessionDeadline
}

export function checkSession(request: Request): SessionCheck {
  const token = bearerToken(request)
  if (!token) return { status: 'missing' }
  const session = db.sessions.get(token)
  if (!session) return { status: 'missing' }
  const now = Date.now()
  if (isExpired(session.createdAt, session.expiresAt, now)) return { status: 'expired' }
  const user = db.users.find((candidate) => candidate.id === session.userId)
  if (!user) return { status: 'missing' }
  session.expiresAt = now + SESSION_TTL_MS
  return { status: 'valid', user, token, expiresAt: session.expiresAt }
}
