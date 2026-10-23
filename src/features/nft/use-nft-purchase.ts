import { useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { isApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import type { EditionId, NftDetail, NftEdition } from '@/types'
import { useAddToCart, useToggleFavorite } from './api'

const MAX_PER_LINE = 99

/** Limited editions first, largest supply first: the Figma opens on 1/50. */
function defaultEdition(editions: NftEdition[]): NftEdition | undefined {
  const available = editions.filter((edition) => edition.available > 0)
  const limited = available.filter((edition) => edition.id !== 'open')
  return [...limited].sort((a, b) => b.supply - a.supply)[0] ?? available[0]
}

/** Edition, quantity limits, add to cart and favorite for the detail screen (desktop and mobile). */
export function useNftPurchase(nft: NftDetail) {
  const navigate = useNavigate()
  const location = useLocation()
  const [editionId, setEditionId] = useState<EditionId | undefined>(() => defaultEdition(nft.editions)?.id)
  const [quantity, setQuantity] = useState(1)
  const addToCart = useAddToCart()
  const toggleFavorite = useToggleFavorite(nft.id)

  const edition = nft.editions.find((item) => item.id === editionId)
  const maxQuantity = Math.min(edition?.available ?? 0, MAX_PER_LINE)
  const canBuy = Boolean(edition) && maxQuantity > 0 && quantity <= maxQuantity

  function goToLogin() {
    void navigate({ to: '/login', search: { redirect: location.href } })
  }

  function changeEdition(id: EditionId) {
    setEditionId(id)
    const next = nft.editions.find((item) => item.id === id)
    setQuantity((current) => Math.max(1, Math.min(current, next?.available ?? 1)))
  }

  /** `goToCart` is the "COMPRAR" behavior; without it the item is added and the user stays. */
  function add({ goToCart }: { goToCart: boolean }) {
    if (!edition || !canBuy) return
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () => {
          if (goToCart) void navigate({ to: '/cart' })
          else toast.success(`${nft.name} adicionado ao carrinho.`)
        },
        onError: (error) =>
          toast.error(isApiError(error) ? error.message : 'Não foi possível adicionar ao carrinho.'),
      },
    )
  }

  function favorite() {
    if (!isAuthenticated()) return goToLogin()
    toggleFavorite.mutate(!nft.favorited, {
      onError: (error) => {
        if (isApiError(error) && error.status === 401) return goToLogin()
        toast.error('Não foi possível atualizar seus favoritos. Tente novamente.')
      },
      onSuccess: (result) => toast.success(result.favorited ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.'),
    })
  }

  return {
    editionId,
    edition,
    changeEdition,
    quantity,
    decrement: () => setQuantity((current) => Math.max(1, current - 1)),
    increment: () => setQuantity((current) => Math.min(maxQuantity, current + 1)),
    maxQuantity,
    canBuy,
    add,
    adding: addToCart.isPending,
    favorite,
    favoritePending: toggleFavorite.isPending,
  }
}
