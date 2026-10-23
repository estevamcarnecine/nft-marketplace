import { createFileRoute, useRouter } from '@tanstack/react-router'
import { setToken } from '@/lib/auth'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { redirect } = Route.useSearch()

  function handleTemporaryLogin() {
    setToken('temporary-dev-token')
    router.history.push(redirect ?? '/')
  }

  return (
    <main className="mx-auto max-w-[500px] px-6 py-16">
      <h1 className="text-[24px] font-bold">Entrar</h1>
      <button
        type="button"
        onClick={handleTemporaryLogin}
        className="mt-6 h-10 rounded-button bg-primary px-6 text-[14px] font-bold text-primary-foreground"
      >
        Entrar (temporário)
      </button>
    </main>
  )
}