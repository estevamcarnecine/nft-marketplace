import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { PageShell } from '@/components/layout/PageShell'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountSidebar } from '@/features/account/components/AccountSidebar'
import { ProfileForm } from '@/features/account/components/ProfileForm'
import { profileQuery } from '@/features/checkout/api'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const profile = useQuery(profileQuery)

  return (
    <PageShell active="home" footer={false}>
      <div className="flex w-full items-start gap-[28px] overflow-clip">
        <AccountSidebar active="profile" />
        {profile.isPending ? (
          <div aria-busy="true" aria-label="Carregando perfil" className="flex min-w-px flex-1 flex-col gap-[24px]">
            <Skeleton className="h-[16px] w-[220px]" />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex justify-between">
                <Skeleton className="h-[79px] w-[417px]" />
                <Skeleton className="h-[79px] w-[417px]" />
              </div>
            ))}
          </div>
        ) : profile.isError ? (
          <p role="alert" className="text-[14px] leading-[24px] text-text-secondary">
            Não foi possível carregar seu perfil.{' '}
            <button type="button" onClick={() => void profile.refetch()} className="font-bold text-text-accent underline">
              Tentar novamente
            </button>
          </p>
        ) : (
          <ProfileForm profile={profile.data} />
        )}
      </div>
    </PageShell>
  )
}
