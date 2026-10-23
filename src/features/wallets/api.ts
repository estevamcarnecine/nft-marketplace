import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { profileQuery } from '@/features/checkout/api'
import { api } from '@/lib/api'
import type { NetworkId, Profile, Wallet, WalletType } from '@/types'

export const walletsQuery = queryOptions({
  queryKey: ['wallets'] as const,
  queryFn: ({ signal }) => api.get<{ items: Wallet[] }>('/wallets', { signal }),
  select: (data) => data.items,
})

export interface WalletInput {
  label: string
  type: WalletType
  network: NetworkId
  address: string
}

/** Wallet changes answer with the full list; the profile mirrors the primary wallet, so refresh it too. */
function useWalletMutation<TInput>(request: (input: TInput) => Promise<{ items: Wallet[] }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (data) => {
      queryClient.setQueryData(walletsQuery.queryKey, data)
      void queryClient.invalidateQueries({ queryKey: profileQuery.queryKey })
    },
  })
}

export function useCreateWallet() {
  return useWalletMutation((input: WalletInput & { isDefault: boolean }) => api.post<{ items: Wallet[] }>('/wallets', input))
}

export function useUpdateWallet() {
  return useWalletMutation(({ id, ...input }: WalletInput & { id: string }) =>
    api.patch<{ items: Wallet[] }>(`/wallets/${encodeURIComponent(id)}`, input),
  )
}

export function useMakeDefaultWallet() {
  return useWalletMutation((id: string) => api.post<{ items: Wallet[] }>(`/wallets/${encodeURIComponent(id)}/default`))
}

export function useDeleteWallet() {
  return useWalletMutation((id: string) => api.delete<{ items: Wallet[] }>(`/wallets/${encodeURIComponent(id)}`))
}

/** "Carteira principal" form: the profile fields of this screen plus the primary wallet. */
export function useSavePrimary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (profile: Profile) => api.put<Profile>('/profile', profile),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQuery.queryKey, profile)
      void queryClient.invalidateQueries({ queryKey: walletsQuery.queryKey })
    },
  })
}

/** Where purchased NFTs are delivered: the primary wallet (null) or a secondary one. */
export function useSetDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (walletId: string | null) => api.put<Profile>('/profile/delivery', { walletId }),
    onSuccess: (profile) => queryClient.setQueryData(profileQuery.queryKey, profile),
  })
}
