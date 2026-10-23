import { createFileRoute, useRouter } from '@tanstack/react-router'

import { AuthDialog } from '@/features/auth/components/AuthDialog'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { SocialButtons } from '@/features/auth/components/SocialButtons'
import { safeRedirect } from '@/features/auth/api'
import { HomePage } from '@/features/home/HomePage'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { redirect } = Route.useSearch()

  function close() {
    if (router.history.canGoBack()) router.history.back()
    else void router.navigate({ to: '/' })
  }

  return (
    <>
      <HomePage />
      <AuthDialog
        mode="login"
        description="Entre para gerenciar sua carteira, coleção e perfil de criador."
        minHeight="min-h-[600px]"
        onClose={close}
      >
        <LoginForm onSuccess={() => router.history.replace(safeRedirect(redirect))} />
        <SocialButtons />
      </AuthDialog>
    </>
  )
}
