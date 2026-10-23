import { fromWei, toWei } from '@/lib/eth'
import { COLLECTIONS, NETWORKS } from '@/types'
import type {
  CollectionId,
  Nft,
  NftUpdatedEvent,
  NetworkId,
  Order,
  Profile,
  Quote,
  User,
  Wallet,
} from '@/types'

export interface StoredUser extends User {
  password: string
}
export interface StoredQuote {
  userId: string
  quote: Quote
}
export interface StoredOrder {
  userId: string
  order: Order
}

const COLLECTION_COUNTS: Record<CollectionId, number> = {
  'arte-digital': 33,
  fotografia: 12,
  musica: 65,
  'arte-3d': 39,
  colecionaveis: 23,
  generativa: 17,
  jogos: 19,
  assinaturas: 13,
  utilidade: 18,
}

const SPECIAL_NFTS = [
  { adjective: 'Emerald', noun: 'Ape', number: 42, price: '1.19' },
  { adjective: 'Violet', noun: 'Nomad', number: 314, price: '1.39' },
  { adjective: 'Ivory', noun: 'Baron', number: 88, price: '1.79' },
]

const PRICE_OVERRIDES: Record<number, string> = { 3: '0.02', 4: '12.30' }

const ADJECTIVES = ['Amber', 'Crimson', 'Cobalt', 'Onyx', 'Golden', 'Silver', 'Rustic', 'Neon', 'Velvet', 'Copper']
const NOUNS = ['Fox', 'Oracle', 'Totem', 'Drifter', 'Specter', 'Pilgrim', 'Warden', 'Mirage', 'Cipher', 'Sentinel']
const CREATORS = ['Lia Monteiro', 'Caio Andrade', 'Studio Ônix', 'Maya Ferraz', 'Rafa Linhares', 'Nina Duarte']
const PALETTE = ['#D28A4C', '#E89B55', '#B39463', '#F0805F', '#55321F', '#38220F', '#CFB28C']

const DEMO_ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function formatHundredths(value: number): string {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`
}

function artwork(seed: number): string {
  const rng = mulberry32(seed)
  const c1 = pick(PALETTE, rng)
  const c2 = pick(PALETTE, rng)
  const c3 = pick(PALETTE, rng)
  const shapes = Array.from({ length: 5 }, () => {
    const cx = Math.round(rng() * 600)
    const cy = Math.round(rng() * 600)
    const r = 40 + Math.round(rng() * 160)
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${pick(PALETTE, rng)}" fill-opacity="0.55"/>`
  }).join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>` +
    `<rect width="600" height="600" fill="url(#g)"/>${shapes}` +
    `<rect x="150" y="150" width="300" height="300" rx="15" fill="${c3}" fill-opacity="0.35"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function createNfts(): Nft[] {
  const rng = mulberry32(20261022)
  const slots: CollectionId[] = []
  for (const [id, count] of Object.entries(COLLECTION_COUNTS) as [CollectionId, number][]) {
    for (let i = 0; i < count; i += 1) slots.push(id)
  }
  shuffle(slots, rng)

  const now = Date.now()
  return slots.map((collection, index) => {
    const special = SPECIAL_NFTS[index]
    const number = special ? special.number : 1000 + index
    const adjective = special ? special.adjective : pick(ADJECTIVES, rng)
    const noun = special ? special.noun : pick(NOUNS, rng)
    const network = pick(['ethereum', 'ethereum', 'polygon', 'solana', 'solana'] as const, rng)
    const supply = special ? 40 : 5 + Math.floor(rng() * 45)
    const available = special ? 30 : 1 + Math.floor(rng() * supply)
    const price =
      special?.price ?? PRICE_OVERRIDES[index] ?? formatHundredths(2 + Math.floor(rng() * 1229))
    const collectionLabel = COLLECTIONS.find((c) => c.id === collection)?.label ?? collection
    const networkLabel = NETWORKS.find((n) => n.id === network)?.label ?? network

    return {
      id: `nft-${String(number).padStart(4, '0')}`,
      tokenId: `#${String(number).padStart(4, '0')}`,
      name: `${adjective} ${noun} #${String(number % 1000).padStart(3, '0')}`,
      description: `Edição de ${supply} unidades da coleção ${collectionLabel}, com certificado de autenticidade registrado na rede ${networkLabel}.`,
      image: artwork(number),
      collection,
      network,
      price,
      supply,
      available,
      creator: pick(CREATORS, rng),
      listedAt: new Date(now - index * 2 * 3_600_000 - Math.floor(rng() * 3_600_000)).toISOString(),
      favorites: Math.floor(rng() * 500),
      views: 200 + Math.floor(rng() * 9800),
      favorited: false,
    }
  })
}

function createState() {
  const demo: StoredUser = {
    id: 'user_demo',
    name: 'Demo Collector',
    email: 'demo@kurio.io',
    password: '123456',
  }
  const demoProfile: Profile = {
    displayName: 'Demo Collector',
    username: 'demo_collector',
    profileName: 'Demo Collector',
    email: demo.email,
    network: 'ethereum',
    walletType: 'metamask',
    walletAddress: DEMO_ADDRESS,
    useAnotherWallet: false,
    secondaryWallet: '',
    ensName: 'democollector',
    ensSuffix: '.eth',
    referralCode: 'KURIO2026',
    note: '',
  }
  const demoWallet: Wallet = {
    id: 'wallet_demo',
    label: 'MetaMask principal',
    type: 'metamask',
    network: 'ethereum',
    address: DEMO_ADDRESS,
    isDefault: true,
    createdAt: new Date().toISOString(),
  }

  return {
    nfts: createNfts(),
    cart: new Map<string, number>([
      ['nft-0042', 2],
      ['nft-0314', 6],
      ['nft-0088', 9],
    ]),
    users: [demo],
    profiles: new Map<string, Profile>([[demo.id, demoProfile]]),
    wallets: new Map<string, Wallet[]>([[demo.id, [demoWallet]]]),
    favorites: new Map<string, Set<string>>(),
    quotes: new Map<string, StoredQuote>(),
    orders: [] as StoredOrder[],
    idempotency: new Map<string, Order>(),
    sequence: 1,
  }
}

export type Db = ReturnType<typeof createState>

export const db: Db = createState()

export function resetDb(): void {
  Object.assign(db, createState())
}

export function nextId(prefix: string): string {
  const id = `${prefix}_${String(db.sequence).padStart(4, '0')}`
  db.sequence += 1
  return id
}

export function findNft(id: string): Nft | undefined {
  return db.nfts.find((nft) => nft.id === id)
}

export function serializeNft(nft: Nft, userId?: string): Nft {
  const favorited = userId ? (db.favorites.get(userId)?.has(nft.id) ?? false) : false
  return { ...nft, favorited }
}

export function toNftUpdated(nft: Nft): NftUpdatedEvent {
  return { id: nft.id, price: nft.price, available: nft.available, updatedAt: new Date().toISOString() }
}

export function adjustNftPrice(id: string, percent: number): Nft | undefined {
  const nft = findNft(id)
  if (!nft) return undefined
  const next = (toWei(nft.price) * BigInt(100 + percent)) / 100n
  nft.price = fromWei(next)
  return nft
}

export function isNetworkId(value: string): value is NetworkId {
  return NETWORKS.some((network) => network.id === value)
}