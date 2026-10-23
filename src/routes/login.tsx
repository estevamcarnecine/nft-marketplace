import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { AuthDialog } from '@/features/auth/components/AuthDialog'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { SocialButtons } from '@/features/auth/components/SocialButtons'
import { safeRedirect } from '@/features/auth/api'
import { HomePage } from '@/features/home/HomePage'
import { MobileAuthPage } from '@/features/auth/components/MobileAuthPage'
import { useIsDesktop } from '@/lib/use-media-query'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { redirect } = Route.useSearch()
  const desktop = useIsDesktop()

  function close() {
    if (router.history.canGoBack()) router.history.back()
    else void router.navigate({ to: '/' })
  }

  if (!desktop) {
    return (
      <MobileAuthPage
        title="Entrar"
        footer={
          <>
            Novo na Kurio?{' '}
            <Link to="/signup" search={{ redirect }} className="text-text-secondary">
              Crie uma conta
            </Link>
          </>
        }
      >
        <LoginForm variant="page" onSuccess={() => router.history.replace(safeRedirect(redirect))} />
        <SocialButtons variant="page" />
      </MobileAuthPage>
    )
  }

  return (
    <>
      <HomePage />
      <AuthDialog
        mode="login"
        description="Entre para gerenciar sua carteira, coleção e perfil de criador."
        redirect={redirect}
        onClose={close}
      >
        <LoginForm onSuccess={() => router.history.replace(safeRedirect(redirect))} />
        <SocialButtons />
      </AuthDialog>
    </>
  )
}
