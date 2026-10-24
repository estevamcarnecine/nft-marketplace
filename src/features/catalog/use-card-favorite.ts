import { useLocation, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { isApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import type { Nft } from '@/types'
import { useToggleListFavorite } from './api'

export function useCardFavorite(nft: Nft) {
  const navigate = useNavigate()
  const location = useLocation()
  const favorite = useToggleListFavorite()

  function toggle() {
    if (!isAuthenticated()) {
      void navigate({ to: '/login', search: { redirect: location.href } })
      return
    }
    favorite.mutate(
      { id: nft.id, favorited: !nft.favorited },
      {
        onSuccess: (result) =>
          toast.success(result.favorited ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.'),
        onError: (error) => {
          if (isApiError(error) && error.status === 401) {
            void navigate({ to: '/login', search: { redirect: location.href } })
            return
          }
          toast.error('Não foi possível atualizar seus favoritos. Tente novamente.')
        },
      },
    )
  }

  return { toggle, pending: favorite.isPending }
}
