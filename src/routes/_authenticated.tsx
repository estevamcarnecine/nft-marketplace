import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { isApiError } from '@/lib/api'
import { clearToken, isAuthenticated } from '@/lib/auth'
import { queryClient } from '@/lib/queryClient'
import { sessionQuery } from '@/lib/session'

export const Route = createFileRoute('/_authenticated')({
  // A token alone is not a session: it may have expired or been revoked, so ask the API.
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
      // A transient failure should not log the user out; the page handles its own errors.
    }
  },
  component: () => <Outlet />,
})
