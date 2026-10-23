import type { QueryClient } from '@tanstack/react-query'

import { cartKey } from '@/features/cart/api'
import { nftKeys } from '@/features/nft/api'
import { formatEthLabel } from '@/lib/format'
import type { Cart, Nft, NftDetail, NftUpdatedEvent, Order, OrderUpdatedEvent, Paginated } from '@/types'
import { pushCartNotice } from './notices'

type NftListener = (event: NftUpdatedEvent) => void
const nftListeners = new Set<NftListener>()

/** Screens holding their own snapshot (the checkout quote) watch accepted NFT changes here. */
export function onNftUpdated(listener: NftListener): () => void {
  nftListeners.add(listener)
  return () => nftListeners.delete(listener)
}

/** Applies the event only to a copy older than it, so REST data fetched later is never rolled back. */
function patchNft<T extends Nft>(nft: T, event: NftUpdatedEvent): T {
  if (nft.id !== event.resource.id || nft.version >= event.version) return nft
  return { ...nft, price: event.data.price, available: event.data.available, version: event.version }
}

function patchDetail(detail: NftDetail, event: NftUpdatedEvent): NftDetail {
  const patched = patchNft(detail, event)
  if (patched === detail) return detail
  return {
    ...patched,
    editions: detail.editions.map((edition) => {
      const next = event.data.editions.find((item) => item.id === edition.id)
      return next ? { ...edition, available: next.available } : edition
    }),
  }
}

/** Tells the buyer what changed in their cart before the refetched totals replace the old ones. */
function noticeCartChanges(cart: Cart, event: NftUpdatedEvent): boolean {
  const lines = cart.items.filter((line) => line.nft.id === event.resource.id && line.nft.version < event.version)
  for (const line of lines) {
    if (line.nft.price !== event.data.price) {
      pushCartNotice({
        id: `${line.nft.id}:price`,
        message: `O preço de ${line.nft.name} mudou de ${formatEthLabel(line.nft.price)} para ${formatEthLabel(event.data.price)}. O total foi atualizado.`,
      })
    }
    const available = event.data.editions.find((edition) => edition.id === line.edition.id)?.available
    if (available !== undefined && available < line.quantity) {
      pushCartNotice({
        id: `${line.id}:stock`,
        message:
          available === 0
            ? `A edição ${line.edition.label} de ${line.nft.name} esgotou. Remova o item para continuar.`
            : `Restam apenas ${available} unidades de ${line.nft.name} (edição ${line.edition.label}). Ajuste a quantidade para continuar.`,
      })
    }
  }
  return lines.length > 0
}

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent): void {
  const id = event.resource.id
  queryClient.setQueriesData<Paginated<Nft>>({ queryKey: ['nfts', 'list'] }, (page) =>
    page ? { ...page, items: page.items.map((nft) => patchNft(nft, event)) } : page,
  )
  queryClient.setQueryData<Nft>(['nfts', 'featured'], (nft) => (nft ? patchNft(nft, event) : nft))
  queryClient.setQueryData<NftDetail>(nftKeys.detail(id), (detail) => (detail ? patchDetail(detail, event) : detail))
  queryClient.setQueriesData<{ items: Nft[] }>({ queryKey: ['nfts', 'related'] }, (data) =>
    data ? { ...data, items: data.items.map((nft) => patchNft(nft, event)) } : data,
  )

  // A request in flight may have been answered before this change and would land older data than
  // the event, so it is restarted. Cancelling is explicit: a refetch of a query still loading for
  // the first time would just reuse the in-flight request.
  const inFlight = queryClient
    .getQueryCache()
    .findAll({
      predicate: (query) =>
        query.state.fetchStatus === 'fetching' && (query.queryKey[0] === 'nfts' || query.queryKey[0] === cartKey[0]),
    })
    .map((query) => query.queryKey)
  for (const queryKey of inFlight) {
    void queryClient
      .cancelQueries({ queryKey, exact: true })
      .then(() => queryClient.refetchQueries({ queryKey, exact: true, type: 'all' }))
  }

  const cart = queryClient.getQueryData<Cart>(cartKey)
  // Totals, discount and line limits come from the server, so the cart is re-read instead of patched.
  if (cart && noticeCartChanges(cart, event)) void queryClient.invalidateQueries({ queryKey: cartKey })

  for (const listener of nftListeners) listener(event)
}

export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent): void {
  const key = ['orders', event.resource.id]
  const current = queryClient.getQueryData<Order>(key)
  if (!current) {
    // Not on screen: the next read of this order goes to REST.
    void queryClient.invalidateQueries({ queryKey: key })
  } else if (current.version < event.version && current.status === 'pending') {
    // Confirmed and rejected are terminal: nothing overwrites them.
    queryClient.setQueryData<Order>(key, {
      ...current,
      ...event.data,
      version: event.version,
      updatedAt: event.occurredAt,
    })
    // explorerUrl and other settled fields come from the REST snapshot.
    void queryClient.invalidateQueries({ queryKey: key })
  }
  // A confirmed order took the purchased quantities out of the server cart.
  if (event.data.status === 'confirmed') void queryClient.invalidateQueries({ queryKey: cartKey })
}
