import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './api'

const MAX_QUERY_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Client errors (404, 401, 422…) are final; only transient failures are retried.
      retry: (failureCount, error) =>
        failureCount < MAX_QUERY_RETRIES &&
        !(isApiError(error) && error.status >= 400 && error.status < 500),
      refetchOnWindowFocus: false,
    },
  },
})