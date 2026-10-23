import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type { Cart } from '@/types'

export const cartKey = ['cart'] as const

export const cartQuery = queryOptions({
  queryKey: cartKey,
  queryFn: ({ signal }) => api.get<Cart>('/cart', { signal }),
})

/** Every cart mutation answers with the full cart, which replaces the cached one. */
function useCartMutation<TInput>(request: (input: TInput) => Promise<Cart>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (cart) => queryClient.setQueryData(cartKey, cart),
    // A rejected change (e.g. stock moved) means the cached cart may be stale.
    onError: () => void queryClient.invalidateQueries({ queryKey: cartKey }),
  })
}

export function useUpdateCartLine() {
  return useCartMutation((input: { lineId: string; quantity: number }) =>
    api.patch<Cart>(`/cart/items/${encodeURIComponent(input.lineId)}`, { quantity: input.quantity }),
  )
}

export function useRemoveCartLine() {
  return useCartMutation((lineId: string) => api.delete<Cart>(`/cart/items/${encodeURIComponent(lineId)}`))
}

export function useApplyCoupon() {
  return useCartMutation((code: string) => api.put<Cart>('/cart/coupon', { code }))
}

export function useRemoveCoupon() {
  return useCartMutation(() => api.delete<Cart>('/cart/coupon'))
}
