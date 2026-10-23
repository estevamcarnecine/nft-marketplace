import { fromWei, toWei } from '@/lib/eth'
import { COLLECTIONS, NETWORKS } from '@/types'
import type {
  CollectionId,
  EditionId,
  Nft,
  NftDetail,
  NftEdition,
  NftUpdatedEvent,
  NetworkId,
  Order,
  Profile,
  Quote,
  User,
  Wallet,
  WalletSession,
} from '@/types'

/** Passwords are kept as salted SHA-256 hashes (see `src/mocks/session.ts`), never in plain text. */
export interface StoredUser extends User {
  salt: string
  passwordHash: string
}
/** A cart belongs to a signed-in user (`user:<id>`) or to a visitor (`guest:<cart id>`). */
export interface StoredCart {
  lines: Map<string, number>
  coupon: string | null
}
export interface StoredSession {
  userId: string
  createdAt: number
  expiresAt: number
}
export interface StoredQuote {
  userId: string
  quote: Quote
}
export interface StoredOrder {
  userId: string
  order: Order
}
export interface StoredWalletSession extends WalletSession {
  userId: string
}
export type NftRecord = Omit<NftDetail, 'favorited'>

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

interface SpecialNft {
  adjective: string
  noun: string
  number: number
  price: string
  image: string
  collection: CollectionId
  collectionName: string
  creator: string
  attributes: string[]
  rating: number
  reviewCount: number
  contractAddress: string
  description?: string
  story?: string[]
}

const KURIO_APES = {
  collection: 'colecionaveis',
  collectionName: 'Kurio Apes',
  creator: 'Nova Sato',
  contractAddress: '0x7A42c3F1d9B0e85A6d4f2C1b3E9a07D5c8f219E8',
} as const

// Content of the NFTs shown in the Figma file (Detalhes do NFT and "Mais desta coleção").
const SPECIAL_NFTS: SpecialNft[] = [
  {
    ...KURIO_APES,
    adjective: 'Emerald',
    noun: 'Ape',
    number: 42,
    price: '1.19',
    image: '/nft/emerald-ape.png',
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
    rating: 4.2,
    reviewCount: 19,
    description:
      'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
    story: [
      'Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.',
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
  },
  { ...KURIO_APES, adjective: 'Cosmic', noun: 'Bloom', number: 118, price: '1.29', image: '/nft/cosmic-bloom.png', attributes: ['Chapéu', 'Moletom', 'Comum'], rating: 4.6, reviewCount: 12 },
  { ...KURIO_APES, adjective: 'Violet', noun: 'Nomad', number: 314, price: '1.39', image: '/nft/cosmic-bloom.png', attributes: ['Chapéu', 'Violeta', 'Incomum'], rating: 4.1, reviewCount: 8 },
  { ...KURIO_APES, adjective: 'Ivory', noun: 'Baron', number: 88, price: '1.79', image: '/nft/ivory-baron.png', attributes: ['Gola alta', 'Marfim', 'Raro'], rating: 4.8, reviewCount: 27 },
  { ...KURIO_APES, adjective: 'Golden', noun: 'Beat', number: 207, price: '0.99', image: '/nft/golden-beat.png', attributes: ['Fones', 'Dourado', 'Comum'], rating: 3.9, reviewCount: 6 },
  { ...KURIO_APES, adjective: 'Golden', noun: 'Signal', number: 160, price: '0.39', image: '/nft/golden-beat.png', attributes: ['Fones', 'Dourado', 'Incomum'], rating: 4.0, reviewCount: 4 },
]

const PRICE_OVERRIDES: Record<number, string> = { 6: '0.02', 7: '12.30' }

const ADJECTIVES = ['Amber', 'Crimson', 'Cobalt', 'Onyx', 'Golden', 'Silver', 'Rustic', 'Neon', 'Velvet', 'Copper']
const NOUNS = ['Fox', 'Oracle', 'Totem', 'Drifter', 'Specter', 'Pilgrim', 'Warden', 'Mirage', 'Cipher', 'Sentinel']
const CREATORS = ['Lia Monteiro', 'Caio Andrade', 'Studio Ônix', 'Maya Ferraz', 'Rafa Linhares', 'Nina Duarte']
const ATTRIBUTES = ['Holográfico', 'Neon', 'Dourado', 'Animado', 'Minimalista', 'Raro', 'Comum', 'Lendário', 'Texturizado']
const PALETTE = ['#D28A4C', '#E89B55', '#B39463', '#F0805F', '#55321F', '#38220F', '#CFB28C']

const EDITION_SPECS: { id: EditionId; label: string; supply: number }[] = [
  { id: '1-1', label: '1/1', supply: 1 },
  { id: '1-10', label: '1/10', supply: 10 },
  { id: '1-50', label: '1/50', supply: 50 },
  { id: 'open', label: 'ABERTA', supply: 500 },
]

const DEMO_ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
const COLLECTOR_ADDRESS = '0x8Ba1f109551bD432803012645Ac136ddd64DBA72'

// Fixed reference time so listing dates, and the visual baselines built on them, are stable.
export const FIXTURE_EPOCH = Date.parse('2026-10-20T12:00:00.000Z')

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

function hexAddress(rng: () => number): string {
  return `0x${Array.from({ length: 40 }, () => Math.floor(rng() * 16).toString(16)).join('')}`
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

function createEditions(special: boolean, rng: () => number): NftEdition[] {
  if (special) {
    return EDITION_SPECS.map((spec) => ({
      ...spec,
      available: spec.id === '1-50' ? 30 : spec.id === '1-10' ? 7 : spec.supply,
    }))
  }
  // Every NFT offers at least one limited edition; some editions are sold out.
  const offered = EDITION_SPECS.filter((_spec, index) => index === 2 || rng() < 0.55)
  return offered.map((spec) => ({
    ...spec,
    available: rng() < 0.15 ? 0 : 1 + Math.floor(rng() * spec.supply),
  }))
}

function story(name: string, collectionName: string, creator: string, network: string, royalty: number): string[] {
  return [
    `${name} é uma obra digital da coleção ${collectionName}. Cada atributo fica armazenado nos metadados do token e verificado na ${network}.`,
    `A propriedade inclui a arte em alta resolução e um registro permanente de procedência registrada na rede. ${creator} recebe ${royalty}% de direitos autorais nas vendas secundárias.`,
  ]
}

function createNfts(): NftRecord[] {
  const rng = mulberry32(20261022)
  const slots: CollectionId[] = []
  for (const [id, count] of Object.entries(COLLECTION_COUNTS) as [CollectionId, number][]) {
    for (let i = 0; i < count; i += 1) slots.push(id)
  }
  shuffle(slots, rng)

  return slots.map((slot, index) => {
    const special = SPECIAL_NFTS[index]
    const collection = special?.collection ?? slot
    const number = special ? special.number : 1000 + index
    const adjective = special ? special.adjective : pick(ADJECTIVES, rng)
    const noun = special ? special.noun : pick(NOUNS, rng)
    const network = special ? 'ethereum' : pick(['ethereum', 'ethereum', 'polygon', 'solana', 'solana'] as const, rng)
    const editions = createEditions(Boolean(special), rng)
    const price =
      special?.price ?? PRICE_OVERRIDES[index] ?? formatHundredths(2 + Math.floor(rng() * 1229))
    const collectionLabel = COLLECTIONS.find((c) => c.id === collection)?.label ?? collection
    const networkLabel = NETWORKS.find((n) => n.id === network)?.label ?? network
    const name = `${adjective} ${noun} #${String(number % 1000).padStart(3, '0')}`
    const image = special?.image ?? artwork(number)
    const collectionName = special?.collectionName ?? `Kurio ${collectionLabel}`
    const creator = special?.creator ?? pick(CREATORS, rng)
    const royaltyPercent = special ? 5 : pick([5, 5, 7, 10], rng)

    return {
      id: `nft-${String(number).padStart(4, '0')}`,
      tokenId: `#${String(number).padStart(4, '0')}`,
      name,
      description:
        special?.description ??
        `Edição da coleção ${collectionLabel}, com certificado de autenticidade registrado na rede ${networkLabel}.`,
      image,
      images: [image, image, image, image],
      collection,
      collectionName,
      network,
      price,
      supply: editions.reduce((total, edition) => total + edition.supply, 0),
      available: editions.reduce((total, edition) => total + edition.available, 0),
      editions,
      creator,
      attributes: special?.attributes ?? shuffle([...ATTRIBUTES], rng).slice(0, 3),
      rating: special?.rating ?? Math.round((3.5 + rng() * 1.5) * 10) / 10,
      reviewCount: special?.reviewCount ?? Math.floor(rng() * 40),
      story: special?.story ?? story(name, collectionName, creator, networkLabel, royaltyPercent),
      contractAddress: special?.contractAddress ?? hexAddress(rng),
      tokenStandard: 'ERC-721',
      royaltyPercent,
      listedAt: new Date(FIXTURE_EPOCH - index * 2 * 3_600_000 - Math.floor(rng() * 3_600_000)).toISOString(),
      favorites: Math.floor(rng() * 500),
      views: 200 + Math.floor(rng() * 9800),
    }
  })
}

export function userCartKey(userId: string): string {
  return `user:${userId}`
}

export function guestCartKey(cartId: string): string {
  return `guest:${cartId}`
}

export function cartKey(nftId: string, editionId: EditionId): string {
  return `${nftId}~${editionId}`
}

export function parseCartKey(key: string): { nftId: string; editionId: EditionId } | null {
  const [nftId, editionId] = key.split('~')
  const edition = EDITION_SPECS.find((spec) => spec.id === editionId)
  return nftId && edition ? { nftId, editionId: edition.id } : null
}

function createState() {
  const demo: StoredUser = {
    id: 'user_demo',
    name: 'Demo Collector',
    email: 'demo@kurio.io',
    // Kurio@2026
    salt: 'b7c1e2a94f0d3e58',
    passwordHash: '169e9d5c144737fc4106c7d440ae57979b3359f94803a6d6f0173a8e86f1f70d',
  }
  const collector: StoredUser = {
    id: 'user_ana',
    name: 'Ana Colecionadora',
    email: 'colecionador@kurio.io',
    // Kurio@2026
    salt: '4e9a0c7d21f6b83a',
    passwordHash: '87f3b9cb12dd49945dde729417e69ada70adce9f8573477ec6af40bbf5bc7bd6',
  }
  const collectorProfile: Profile = {
    displayName: 'Ana Colecionadora',
    username: 'ana_coleciona',
    profileName: 'Ana Colecionadora',
    email: collector.email,
    network: 'polygon',
    walletType: 'coinbase',
    walletAddress: COLLECTOR_ADDRESS,
    useAnotherWallet: false,
    secondaryWallet: '',
    ensName: 'anacoleciona',
    ensSuffix: '.eth',
    referralCode: 'ANA2026',
    note: '',
    walletNickname: 'Coinbase da Ana',
    avatarUrl: null,
  }
  const collectorWallet: Wallet = {
    id: 'wallet_ana',
    label: 'Coinbase da Ana',
    type: 'coinbase',
    network: 'polygon',
    address: COLLECTOR_ADDRESS,
    isDefault: true,
    createdAt: new Date(FIXTURE_EPOCH).toISOString(),
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
    walletNickname: 'MetaMask principal',
    avatarUrl: null,
  }
  const demoWallet: Wallet = {
    id: 'wallet_demo',
    label: 'MetaMask principal',
    type: 'metamask',
    network: 'ethereum',
    address: DEMO_ADDRESS,
    isDefault: true,
    createdAt: new Date(FIXTURE_EPOCH).toISOString(),
  }

  return {
    nfts: createNfts(),
    // The demo collector starts with the cart of the Figma frame; everyone else starts empty.
    carts: new Map<string, StoredCart>([
      [
        userCartKey(demo.id),
        {
          lines: new Map<string, number>([
            [cartKey('nft-0042', '1-50'), 2],
            [cartKey('nft-0314', '1-50'), 6],
            [cartKey('nft-0088', '1-50'), 9],
          ]),
          coupon: null,
        },
      ],
    ]),
    sessions: new Map<string, StoredSession>(),
    users: [demo, collector],
    profiles: new Map<string, Profile>([
      [demo.id, demoProfile],
      [collector.id, collectorProfile],
    ]),
    wallets: new Map<string, Wallet[]>([
      [demo.id, [demoWallet]],
      [collector.id, [collectorWallet]],
    ]),
    favorites: new Map<string, Set<string>>([[collector.id, new Set(['nft-0042', 'nft-0088'])]]),
    quotes: new Map<string, StoredQuote>(),
    orders: [] as StoredOrder[],
    /** `${userId}:${key}` → fingerprint of the request body and the order it created. */
    idempotency: new Map<string, { fingerprint: string; orderId: string }>(),
    walletSessions: new Map<string, StoredWalletSession>(),
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

export function findNft(id: string): NftRecord | undefined {
  return db.nfts.find((nft) => nft.id === id)
}

export function findEdition(nft: NftRecord, editionId: EditionId): NftEdition | undefined {
  return nft.editions.find((edition) => edition.id === editionId)
}

/** Keeps the NFT-level stock equal to the sum of its editions after a change. */
export function syncAvailability(nft: NftRecord): void {
  nft.available = nft.editions.reduce((total, edition) => total + edition.available, 0)
}

function isFavorited(nft: NftRecord, userId?: string): boolean {
  return userId ? (db.favorites.get(userId)?.has(nft.id) ?? false) : false
}

export function serializeNft(nft: NftRecord, userId?: string): Nft {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    description: nft.description,
    image: nft.image,
    collection: nft.collection,
    network: nft.network,
    price: nft.price,
    supply: nft.supply,
    available: nft.available,
    creator: nft.creator,
    listedAt: nft.listedAt,
    favorites: nft.favorites,
    views: nft.views,
    favorited: isFavorited(nft, userId),
  }
}

export function serializeNftDetail(nft: NftRecord, userId?: string): NftDetail {
  return {
    ...nft,
    images: [...nft.images],
    attributes: [...nft.attributes],
    story: [...nft.story],
    editions: nft.editions.map((edition) => ({ ...edition })),
    favorited: isFavorited(nft, userId),
  }
}

export function toNftUpdated(nft: NftRecord): NftUpdatedEvent {
  return { id: nft.id, price: nft.price, available: nft.available, updatedAt: new Date().toISOString() }
}

export function adjustNftPrice(id: string, percent: number): NftRecord | undefined {
  const nft = findNft(id)
  if (!nft) return undefined
  const next = (toWei(nft.price) * BigInt(100 + percent)) / 100n
  nft.price = fromWei(next)
  return nft
}

export function isNetworkId(value: string): value is NetworkId {
  return NETWORKS.some((network) => network.id === value)
}
