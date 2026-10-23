import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { api, isApiError } from '@/lib/api'
import { setToken } from '@/lib/auth'
import type { AuthResponse } from '@/types'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

// Placeholder until the "Desktop / Login" frame is built: signs in the demo collector through
// the real mocked API, so private screens receive a valid session.
const DEMO_CREDENTIALS = { email: 'demo@kurio.io', password: '123456' }

function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { redirect } = Route.useSearch()
  const login = useMutation({
    mutationFn: () => api.post<AuthResponse>('/auth/login', DEMO_CREDENTIALS),
    onSuccess: ({ token }) => {
      setToken(token)
      void queryClient.invalidateQueries()
      router.history.push(redirect ?? '/')
    },
  })

  return (
    <main className="mx-auto max-w-[500px] px-6 py-16">
      <h1 className="text-[24px] font-bold">Entrar</h1>
      <p className="mt-2 text-[14px] leading-[22px] text-text-secondary">
        Tela provisória: entra com a conta de demonstração {DEMO_CREDENTIALS.email}.
      </p>
      <button
        type="button"
        onClick={() => login.mutate()}
        disabled={login.isPending}
        className="mt-6 h-10 rounded-button bg-primary px-6 text-[14px] font-bold text-primary-foreground disabled:opacity-60"
      >
        {login.isPending ? 'Entrando…' : 'Entrar com a conta demo'}
      </button>
      {login.isError && (
        <p role="alert" className="mt-4 text-[14px] text-destructive">
          {isApiError(login.error) ? login.error.message : 'Não foi possível entrar.'}
        </p>
      )}
    </main>
  )
}
