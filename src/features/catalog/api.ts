import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { cartKey } from '@/features/cart/api'
import { nftKeys } from '@/features/nft/api'
import { api } from '@/lib/api'
import type { Cart, Facets, Nft, NftDetail, Paginated } from '@/types'
import type { CatalogSearch } from './search'

export const PAGE_SIZE = 9

/** Exactly what is sent to GET /nfts; also the cache key, so each combination is cached apart. */
export function toCatalogParams(search: CatalogSearch) {
  return {
    q: search.q,
    tab: search.tab,
    collections: search.collections?.join(','),
    networks: search.networks?.join(','),
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sort: search.sort,
    page: search.page ?? 1,
    pageSize: PAGE_SIZE,
  }
}

export type CatalogParams = ReturnType<typeof toCatalogParams>

export function catalogQuery(params: CatalogParams) {
  return queryOptions({
    queryKey: ['nfts', 'list', params] as const,
    // The signal cancels the request when the filters change before it answers; a late answer for
    // old filters lands in its own cache entry and never replaces the current one.
    queryFn: ({ signal }) => api.get<Paginated<Nft>>('/nfts', { params, signal }),
    placeholderData: keepPreviousData,
  })
}

export const facetsQuery = queryOptions({
  queryKey: ['nfts', 'facets'] as const,
  queryFn: ({ signal }) => api.get<Facets>('/catalog/facets', { signal }),
  staleTime: 5 * 60_000,
})

export const featuredQuery = queryOptions({
  queryKey: ['nfts', 'featured'] as const,
  queryFn: ({ signal }) => api.get<Nft>('/nfts/featured', { signal }),
})

/** Quick add from a catalog card: the API picks the default edition. */
export function useQuickAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nftId: string) => api.post<Cart>('/cart/items', { nftId, quantity: 1 }),
    onSuccess: (cart) => queryClient.setQueryData(cartKey, cart),
  })
}

type ListSnapshot = [readonly unknown[], Paginated<Nft> | undefined][]

/** Optimistic favorite on every cached catalog page (and the detail, if cached), rolled back on failure. */
export function useToggleListFavorite() {
  const queryClient = useQueryClient()
  const listKey = ['nfts', 'list'] as const

  function patch(id: string, favorited: boolean) {
    queryClient.setQueriesData<Paginated<Nft>>({ queryKey: listKey }, (page) =>
      page
        ? {
            ...page,
            items: page.items.map((nft) =>
              nft.id === id && nft.favorited !== favorited
                ? { ...nft, favorited, favorites: nft.favorites + (favorited ? 1 : -1) }
                : nft,
            ),
          }
        : page,
    )
    queryClient.setQueryData<NftDetail>(nftKeys.detail(id), (detail) => (detail ? { ...detail, favorited } : detail))
  }

  return useMutation({
    mutationFn: ({ id, favorited }: { id: string; favorited: boolean }) =>
      api.put<{ id: string; favorited: boolean; favorites: number }>(`/nfts/${encodeURIComponent(id)}/favorite`, { favorited }),
    onMutate: async ({ id, favorited }) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const snapshot: ListSnapshot = queryClient.getQueriesData<Paginated<Nft>>({ queryKey: listKey })
      patch(id, favorited)
      return { snapshot, id, previous: !favorited }
    },
    onError: (_error, _input, context) => {
      if (!context) return
      for (const [key, data] of context.snapshot) queryClient.setQueryData(key, data)
      queryClient.setQueryData<NftDetail>(nftKeys.detail(context.id), (detail) =>
        detail ? { ...detail, favorited: context.previous } : detail,
      )
    },
  })
}
