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
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Nft {
  id: string
  tokenId: string
  name: string
  description: string
  image: string
  collection: CollectionId
  network: NetworkId
  price: string
  supply: number
  available: number
  creator: string
  listedAt: string
  favorites: number
  views: number
  favorited: boolean
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

export interface Cart {
  items: CartLine[]
  count: number
  subtotal: string
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

export interface Order {
  id: string
  status: OrderStatus
  lines: QuoteLine[]
  subtotal: string
  discount: string
  networkFee: string
  total: string
  wallet: OrderWallet
  email: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
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

export interface NftUpdatedEvent {
  id: string
  price: string
  available: number
  updatedAt: string
}

export interface OrderUpdatedEvent {
  id: string
  status: OrderStatus
  updatedAt: string
}