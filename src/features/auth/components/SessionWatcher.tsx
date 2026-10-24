import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { onTokenChange } from '@/lib/auth'

const TOAST_ID = 'session-change'

export function SessionWatcher() {
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    return onTokenChange((token, reason) => {
      if (reason !== 'expired' && reason !== 'external') return

      const { location, matches } = router.state
      const onPrivateRoute = matches.some((match) => match.routeId.startsWith('/_authenticated'))

      if (token === null) {
        toast.error(
          reason === 'expired'
            ? 'Sua sessão expirou. Entre novamente para continuar.'
            : 'Você saiu da sua conta em outra aba.',
          { id: TOAST_ID },
        )
        if (onPrivateRoute) {
          void router
            .navigate({ to: '/login', search: { redirect: location.href }, replace: true })
            .then(() => queryClient.clear())
          return
        }
        queryClient.clear()
        return
      }

      toast.info('Sua sessão foi atualizada em outra aba.', { id: TOAST_ID })
      queryClient.clear()
      void router.invalidate()
    })
  }, [router, queryClient])

  return null
}
