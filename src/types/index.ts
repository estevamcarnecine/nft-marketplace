export const NETWORKS = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'solana', label: 'Solana' },
] as const

export const COLLECTIONS = [
  { id: 'arte-digital', label: 'Arte digital' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'arte-3d', label: 'Arte 3D' },
  { id: 'colecionaveis', label: 'Colecionáveis' },
  { id: 'generativa', label: 'Generativa' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'utilidade', label: 'Utilidade' },
] as const

export const WALLET_TYPES = [
  { id: 'metamask', label: 'MetaMask' },
  { id: 'walletconnect', label: 'WalletConnect' },
  { id: 'coinbase', label: 'Coinbase Wallet' },
] as const

export const CATALOG_TABS = ['all', 'new', 'trending'] as const
export const CATALOG_SORTS = ['recent', 'trending', 'price-asc', 'price-desc', 'name'] as const

export type NetworkId = (typeof NETWORKS)[number]['id']
export type CollectionId = (typeof COLLECTIONS)[number]['id']
export type WalletType = (typeof WALLET_TYPES)[number]['id']
export type CatalogTab = (typeof CATALOG_TABS)[number]
export type CatalogSort = (typeof CATALOG_SORTS)[number]
export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

export interface Nft {
  id: string
  tokenId: string
  name: string
  description: string
  image: string
  collection: CollectionId
  network: NetworkId
  price: string
  compareAtPrice: string | null
  supply: number
  available: number
  creator: string
  listedAt: string
  favorites: number
  views: number
  favorited: boolean
  version: number
}

export const EDITION_IDS = ['1-1', '1-10', '1-50', 'open'] as const
export type EditionId = (typeof EDITION_IDS)[number]

export interface NftEdition {
  id: EditionId
  label: string
  supply: number
  available: number
}

export interface NftDetail extends Nft {
  images: string[]
  collectionName: string
  attributes: string[]
  rating: number
  reviewCount: number
  story: string[]
  contractAddress: string
  tokenStandard: 'ERC-721' | 'ERC-1155'
  royaltyPercent: number
  editions: NftEdition[]
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface FacetItem<T extends string> {
  id: T
  label: string
  count: number
}

export interface Facets {
  collections: FacetItem<CollectionId>[]
  networks: FacetItem<NetworkId>[]
  price: { min: string; max: string }
}

export interface CartLine {
  id: string
  nft: Nft
  edition: NftEdition
  quantity: number
  lineTotal: string
}

export interface AppliedCoupon {
  code: string
  percent: number
}

export interface Cart {
  items: CartLine[]
  count: number
  subtotal: string
  coupon: AppliedCoupon | null
  discount: string
  networkFee: string
  total: string
}

export interface QuoteLine {
  nftId: string
  editionId: EditionId
  editionLabel: string
  name: string
  tokenId: string
  image: string
  quantity: number
  unitPrice: string
  lineTotal: string
}

export interface Quote {
  id: string
  promoCode: string | null
  lines: QuoteLine[]
  subtotal: string
  discount: string
  networkFee: string
  total: string
  currency: 'ETH'
  createdAt: string
  expiresAt: string
}

export interface OrderWallet {
  network: NetworkId
  type: WalletType
  address: string
}

export interface CollectorInput {
  displayName: string
  username: string
  profileName: string
  email: string
  network: NetworkId
  walletType: WalletType
  walletAddress: string
  useAnotherWallet: boolean
  secondaryWallet: string
  ensSuffix: '.eth'
  referralCode: string
  note: string
}

export interface WalletSession {
  id: string
  type: WalletType
  network: NetworkId
  address: string
  connectedAt: string
}

export interface CreateOrderInput {
  quoteId: string
  walletSessionId: string
  collector: CollectorInput
}

export interface Order {
  id: string
  status: OrderStatus
  version: number
  quoteId: string
  lines: QuoteLine[]
  subtotal: string
  discount: string
  networkFee: string
  total: string
  wallet: OrderWallet
  recipient: string
  email: string
  note: string
  txHash: string | null
  explorerUrl: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface ExplorerTransaction {
  hash: string
  network: NetworkId
  status: 'confirmed'
  from: string
  to: string
  value: string
  itemCount: number
  blockNumber: number
  timestamp: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

export interface SessionInfo {
  user: User
  expiresAt: string
}

export interface Profile {
  displayName: string
  username: string
  profileName: string
  email: string
  network: NetworkId | ''
  walletType: WalletType | ''
  walletAddress: string
  useAnotherWallet: boolean
  secondaryWallet: string
  ensName: string
  ensSuffix: '.eth'
  referralCode: string
  note: string
  walletNickname: string
  avatarUrl: string | null
}

export interface Wallet {
  id: string
  label: string
  type: WalletType
  network: NetworkId
  address: string
  isDefault: boolean
  createdAt: string
}

export interface ApiErrorBody {
  code: string
  message: string
  errors?: Record<string, string>
  quote?: Quote
}

export interface RealtimeEvent<TType extends string, TKind extends string, TData> {
  eventId: string
  type: TType
  resource: { kind: TKind; id: string }
  version: number
  occurredAt: string
  data: TData
}

export type NftUpdatedEvent = RealtimeEvent<
  'nft.updated',
  'nft',
  { price: string; available: number; editions: { id: EditionId; available: number }[] }
>

export type OrderUpdatedEvent = RealtimeEvent<
  'order.updated',
  'order',
  { status: OrderStatus; txHash: string | null; rejectionReason: string | null }
>
