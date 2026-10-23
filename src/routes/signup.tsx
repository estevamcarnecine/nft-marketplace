import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { safeRedirect } from '@/features/auth/api'
import { AuthDialog } from '@/features/auth/components/AuthDialog'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { SocialButtons } from '@/features/auth/components/SocialButtons'
import { HomePage } from '@/features/home/HomePage'
import { MobileAuthPage } from '@/features/auth/components/MobileAuthPage'
import { useIsDesktop } from '@/lib/use-media-query'

export const Route = createFileRoute('/signup')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: SignupPage,
})

function SignupPage() {
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
        title="Criar perfil de colecionador"
        footer={
          <>
            Já tem uma conta?{' '}
            <Link to="/login" search={{ redirect }} className="text-text-secondary">
              Entre
            </Link>
          </>
        }
      >
        <SignupForm variant="page" onSuccess={() => router.history.replace(safeRedirect(redirect))} />
        <SocialButtons variant="page" />
      </MobileAuthPage>
    )
  }

  return (
    <>
      <HomePage />
      <AuthDialog
        mode="signup"
        description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
        redirect={redirect}
        onClose={close}
      >
        <SignupForm onSuccess={() => router.history.replace(safeRedirect(redirect))} />
        <SocialButtons gap={16} />
      </AuthDialog>
    </>
  )
}
