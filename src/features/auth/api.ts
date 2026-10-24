import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { api } from '@/lib/api'
import { setToken } from '@/lib/auth'
import { getGuestCartId, rotateGuestCartId } from '@/lib/cart-id'
import type { AuthResponse } from '@/types'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})

export type LoginForm = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, 'Informe um nome de usuário')
      .regex(/^[a-z0-9_]{3,20}$/i, 'Use de 3 a 20 letras, números ou _'),
    email: z.string().trim().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
    password: z
      .string()
      .min(1, 'Crie uma senha')
      .refine(
        (value) => value.length >= 8 && /[a-z]/i.test(value) && /\d/.test(value),
        'Use ao menos 8 caracteres, com letras e números',
      ),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })

export type SignupForm = z.infer<typeof signupSchema>

export function safeRedirect(target: string | undefined): string {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : '/'
}

function useStartSession<TInput>(request: (input: TInput) => Promise<AuthResponse>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: ({ token }) => {
      setToken(token)
      rotateGuestCartId()
      queryClient.clear()
    },
  })
}

export function useLogin() {
  return useStartSession((input: LoginForm) =>
    api.post<AuthResponse>('/auth/login', { ...input, guestCartId: getGuestCartId() }),
  )
}

export function useSignup() {
  return useStartSession(({ username, email, password }: SignupForm) =>
    api.post<AuthResponse>('/auth/signup', { username, email, password, guestCartId: getGuestCartId() }),
  )
}
