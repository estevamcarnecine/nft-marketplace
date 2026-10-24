import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { cartKey } from '@/features/cart/api'
import { api } from '@/lib/api'
import type { Cart, EditionId, Nft, NftDetail, Paginated } from '@/types'

export const nftKeys = {
  all: ['nfts'] as const,
  detail: (id: string) => ['nfts', 'detail', id] as const,
  related: (id: string) => ['nfts', 'related', id] as const,
}

export function nftDetailQuery(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => api.get<NftDetail>(`/nfts/${encodeURIComponent(id)}`, { signal }),
  })
}

export function relatedNftsQuery(id: string) {
  return queryOptions({
    queryKey: nftKeys.related(id),
    queryFn: ({ signal }) => api.get<{ items: Nft[] }>(`/nfts/${encodeURIComponent(id)}/related`, { signal }),
    select: (data) => data.items,
  })
}

export function trendingNftsQuery(limit = 15) {
  return queryOptions({
    queryKey: ['nfts', 'list', { tab: 'trending', pageSize: limit }] as const,
    queryFn: ({ signal }) => api.get<Paginated<Nft>>('/nfts', { params: { tab: 'trending', pageSize: limit }, signal }),
    select: (data) => data.items,
  })
}

interface FavoriteResponse {
  id: string
  favorited: boolean
  favorites: number
}

export function useToggleFavorite(id: string) {
  const queryClient = useQueryClient()
  const key = nftKeys.detail(id)

  return useMutation({
    mutationFn: (favorited: boolean) =>
      api.put<FavoriteResponse>(`/nfts/${encodeURIComponent(id)}/favorite`, { favorited }),
    onMutate: async (favorited) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<NftDetail>(key)
      if (previous) {
        queryClient.setQueryData<NftDetail>(key, {
          ...previous,
          favorited,
          favorites: previous.favorites + (favorited === previous.favorited ? 0 : favorited ? 1 : -1),
        })
      }
      return { previous }
    },
    onError: (_error, _favorited, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: (result) => {
      queryClient.setQueryData<NftDetail>(key, (current) =>
        current ? { ...current, favorited: result.favorited, favorites: result.favorites } : current,
      )
    },
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { nftId: string; editionId: EditionId; quantity: number }) =>
      api.post<Cart>('/cart/items', input),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKey, cart)
    },
    onSettled: (_cart, _error, input) => {
      void queryClient.invalidateQueries({ queryKey: nftKeys.detail(input.nftId) })
    },
  })
}
