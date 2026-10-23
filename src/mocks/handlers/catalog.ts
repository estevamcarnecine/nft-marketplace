import { http } from 'msw'
import { compareEth, isValidEth } from '@/lib/eth'
import { CATALOG_SORTS, CATALOG_TABS, COLLECTIONS, NETWORKS } from '@/types'
import type { CatalogSort, CatalogTab, Facets, Nft, Paginated } from '@/types'
import { FIXTURE_EPOCH, db, findNft, serializeNft, serializeNftDetail, type NftRecord } from '../db'
import { scenario } from '../scenario'
import {
  authenticate,
  csv,
  errorResponse,
  json,
  readJson,
  unauthorized,
  validationError,
  withScenario,
} from '../utils'

const NEW_WINDOW_MS = 72 * 3_600_000
const TRENDING_LIMIT = 60
const RELATED_LIMIT = 15

const comparators: Record<CatalogSort, (a: NftRecord, b: NftRecord) => number> = {
  recent: (a, b) => b.listedAt.localeCompare(a.listedAt),
  trending: (a, b) => b.views - a.views,
  'price-asc': (a, b) => compareEth(a.price, b.price),
  'price-desc': (a, b) => compareEth(b.price, a.price),
  name: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
}

function parseTab(value: string | null): CatalogTab {
  return CATALOG_TABS.find((tab) => tab === value) ?? 'all'
}

function parseSort(value: string | null, tab: CatalogTab): CatalogSort {
  const found = CATALOG_SORTS.find((sort) => sort === value)
  if (found) return found
  return tab === 'trending' ? 'trending' : 'recent'
}

export const catalogHandlers = [
  http.get(
    '/api/catalog/facets',
    withScenario('catalog.facets', () => {
      const prices = db.nfts.map((nft) => nft.price)
      const sorted = [...prices].sort(compareEth)

      const facets: Facets = {
        collections: COLLECTIONS.map((collection) => ({
          id: collection.id,
          label: collection.label,
          count: db.nfts.filter((nft) => nft.collection === collection.id).length,
        })),
        networks: NETWORKS.map((network) => ({
          id: network.id,
          label: network.label,
          count: db.nfts.filter((nft) => nft.network === network.id).length,
        })),
        price: { min: sorted[0], max: sorted[sorted.length - 1] },
      }
      return json({ ...facets })
    }),
  ),

  http.get(
    '/api/nfts',
    withScenario('catalog.list', ({ request }) => {
      const params = new URL(request.url).searchParams
      const user = authenticate(request)

      const q = (params.get('q') ?? '').trim().toLowerCase()
      const collections = csv(params.get('collections'))
      const networks = csv(params.get('networks'))
      const minPrice = params.get('minPrice')
      const maxPrice = params.get('maxPrice')
      const tab = parseTab(params.get('tab'))
      const sort = parseSort(params.get('sort'), tab)
      const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)
      const pageSize = Math.min(
        48,
        Math.max(1, Number.parseInt(params.get('pageSize') ?? '9', 10) || 9),
      )

      const errors: Record<string, string> = {}
      if (minPrice && !isValidEth(minPrice)) errors.minPrice = 'Valor inválido'
      if (maxPrice && !isValidEth(maxPrice)) errors.maxPrice = 'Valor inválido'
      if (Object.keys(errors).length > 0) return validationError(errors)

      const trendingIds = new Set(
        [...db.nfts]
          .sort(comparators.trending)
          .slice(0, TRENDING_LIMIT)
          .map((nft) => nft.id),
      )
      const newSince = new Date(FIXTURE_EPOCH - NEW_WINDOW_MS).toISOString()

      // Scenario "empty": a catalog with no listings, to exercise the empty state.
      const filtered = (scenario.emptyCatalog ? [] : db.nfts).filter((nft) => {
        if (tab === 'new' && nft.listedAt < newSince) return false
        if (tab === 'trending' && !trendingIds.has(nft.id)) return false
        if (q && !`${nft.name} ${nft.tokenId} ${nft.creator}`.toLowerCase().includes(q)) return false
        if (collections.length > 0 && !collections.includes(nft.collection)) return false
        if (networks.length > 0 && !networks.includes(nft.network)) return false
        if (minPrice && compareEth(nft.price, minPrice) < 0) return false
        if (maxPrice && compareEth(nft.price, maxPrice) > 0) return false
        return true
      })

      filtered.sort(comparators[sort])

      const total = filtered.length
      const start = (page - 1) * pageSize
      const result: Paginated<Nft> = {
        items: filtered.slice(start, start + pageSize).map((nft) => serializeNft(nft, user?.id)),
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
      return json({ ...result })
    }),
  ),

  http.get(
    '/api/nfts/:id',
    withScenario('catalog.detail', ({ request, params }) => {
      const nft = findNft(String(params.id))
      if (!nft) return errorResponse(404, 'NFT_NOT_FOUND', 'NFT não encontrado')
      return json({ ...serializeNftDetail(nft, authenticate(request)?.id) })
    }),
  ),

  http.get(
    '/api/nfts/:id/related',
    withScenario('catalog.related', ({ request, params }) => {
      const nft = findNft(String(params.id))
      if (!nft) return errorResponse(404, 'NFT_NOT_FOUND', 'NFT não encontrado')

      const others = db.nfts.filter((other) => other.id !== nft.id)
      const sameSeries = others.filter((other) => other.collectionName === nft.collectionName)
      const sameCategory = others.filter(
        (other) => other.collectionName !== nft.collectionName && other.collection === nft.collection,
      )
      const userId = authenticate(request)?.id
      const items = [...sameSeries, ...sameCategory]
        .slice(0, RELATED_LIMIT)
        .map((other) => serializeNft(other, userId))
      return json({ items })
    }),
  ),

  http.put(
    '/api/nfts/:id/favorite',
    withScenario('favorite.set', async ({ request, params }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)

      const nft = findNft(String(params.id))
      if (!nft) return errorResponse(404, 'NFT_NOT_FOUND', 'NFT não encontrado')

      const body = await readJson(request)
      if (typeof body.favorited !== 'boolean') {
        return validationError({ favorited: 'Informe true ou false' })
      }

      const favorites = db.favorites.get(user.id) ?? new Set<string>()
      const already = favorites.has(nft.id)
      if (body.favorited && !already) {
        favorites.add(nft.id)
        nft.favorites += 1
      } else if (!body.favorited && already) {
        favorites.delete(nft.id)
        nft.favorites -= 1
      }
      db.favorites.set(user.id, favorites)

      return json({ id: nft.id, favorited: body.favorited, favorites: nft.favorites })
    }),
  ),
]