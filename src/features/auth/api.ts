import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { api } from '@/lib/api'
import { setToken } from '@/lib/auth'
import type { AuthResponse } from '@/types'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})

export type LoginForm = z.infer<typeof loginSchema>

/** Only same-origin paths are accepted as a post-login destination (no open redirects). */
export function safeRedirect(target: string | undefined): string {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : '/'
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginForm) => api.post<AuthResponse>('/auth/login', input),
    onSuccess: ({ token }) => {
      setToken(token)
      // Cached data was fetched as a visitor (or another user): refetch it for this session.
      void queryClient.invalidateQueries()
    },
  })
}
