import type { EditionId, Profile, Wallet } from '@/types'
import {
  db,
  resetDb,
  type StoredCart,
  type StoredOrder,
  type StoredQuote,
  type StoredSession,
  type StoredUser,
  type StoredWalletSession,
} from './db'

const STORAGE_KEY = 'kurio.mockdb'
const VERSION = 5

interface Snapshot {
  version: number
  sequence: number
  users: StoredUser[]
  sessions: [string, StoredSession][]
  carts: [string, { lines: [string, number][]; coupon: string | null }][]
  profiles: [string, Profile][]
  wallets: [string, Wallet[]][]
  favorites: [string, string[]][]
  quotes: [string, StoredQuote][]
  orders: StoredOrder[]
  idempotency: [string, { fingerprint: string; orderId: string }][]
  walletSessions: [string, StoredWalletSession][]
  nfts: { id: string; price: string; favorites: number; version: number; editions: [EditionId, number][] }[]
}

function snapshot(): Snapshot {
  return {
    version: VERSION,
    sequence: db.sequence,
    users: db.users,
    sessions: [...db.sessions],
    carts: [...db.carts].map(([key, cart]) => [key, { lines: [...cart.lines], coupon: cart.coupon }]),
    profiles: [...db.profiles],
    wallets: [...db.wallets],
    favorites: [...db.favorites].map(([userId, ids]) => [userId, [...ids]]),
    quotes: [...db.quotes],
    orders: db.orders,
    idempotency: [...db.idempotency],
    walletSessions: [...db.walletSessions],
    nfts: db.nfts.map((nft) => ({
      id: nft.id,
      price: nft.price,
      favorites: nft.favorites,
      version: nft.version,
      editions: nft.editions.map((edition) => [edition.id, edition.available]),
    })),
  }
}

let pending = false

export function schedulePersist(): void {
  if (pending) return
  pending = true
  queueMicrotask(() => {
    pending = false
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()))
    } catch (error) {
      console.warn('[mocks] could not persist the mock database', error)
    }
  })
}

function isSnapshot(value: unknown): value is Snapshot {
  return typeof value === 'object' && value !== null && (value as { version?: unknown }).version === VERSION
}

export function loadPersisted(): boolean {
  let parsed: unknown
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    parsed = JSON.parse(raw)
  } catch {
    return false
  }
  if (!isSnapshot(parsed)) return false

  db.sequence = parsed.sequence
  db.users = parsed.users
  db.sessions = new Map(parsed.sessions)
  db.carts = new Map(
    parsed.carts.map(([key, cart]): [string, StoredCart] => [key, { lines: new Map(cart.lines), coupon: cart.coupon }]),
  )
  db.profiles = new Map(parsed.profiles)
  db.wallets = new Map(parsed.wallets)
  db.favorites = new Map(parsed.favorites.map(([userId, ids]) => [userId, new Set(ids)]))
  db.quotes = new Map(parsed.quotes)
  db.orders = parsed.orders
  db.idempotency = new Map(parsed.idempotency)
  db.walletSessions = new Map(parsed.walletSessions)

  const saved = new Map(parsed.nfts.map((nft) => [nft.id, nft]))
  for (const nft of db.nfts) {
    const patch = saved.get(nft.id)
    if (!patch) continue
    nft.price = patch.price
    nft.favorites = patch.favorites
    nft.version = patch.version
    const stock = new Map(patch.editions)
    for (const edition of nft.editions) edition.available = stock.get(edition.id) ?? edition.available
    nft.available = nft.editions.reduce((total, edition) => total + edition.available, 0)
  }
  return true
}

export function resetMockData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
  resetDb()
}
