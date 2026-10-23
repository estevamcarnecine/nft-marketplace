import { queryOptions } from '@tanstack/react-query'

import type { SessionInfo } from '@/types'
import { api } from './api'

/** The current session, checked by the private-route guard and cached briefly between navigations. */
export const sessionQuery = queryOptions({
  queryKey: ['session'] as const,
  queryFn: ({ signal }) => api.get<SessionInfo>('/auth/session', { signal }),
  staleTime: 30_000,
  retry: false,
})
