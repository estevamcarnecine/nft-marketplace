import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { isApiError } from '@/lib/api'
import { clearToken, isAuthenticated } from '@/lib/auth'
import { queryClient } from '@/lib/queryClient'
import { sessionQuery } from '@/lib/session'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const toLogin = () => redirect({ to: '/login', search: { redirect: location.href } })
    if (!isAuthenticated()) throw toLogin()
    try {
      await queryClient.ensureQueryData(sessionQuery)
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        clearToken('expired')
        queryClient.clear()
        throw toLogin()
      }
    }
  },
  component: () => <Outlet />,
})
