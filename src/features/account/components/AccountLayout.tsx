import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { cn } from 'cn'

import { MobileShell } from '@/components/layout/MobileShell'
import { PageShell } from '@/components/layout/PageShell'
import { MobileBackButton } from '@/features/nft/components/MobileNftDetail'
import { useIsDesktop } from '@/lib/use-media-query'
import { useLogout } from '../api'
import { AccountSidebar, type AccountSection } from './AccountSidebar'

const TAB = 'flex h-[40px] items-center rounded-[20px] border px-[16px] text-[14px] leading-[16px] whitespace-nowrap'

export function AccountLayout({ active, children }: { active: AccountSection; children: ReactNode }) {
  const desktop = useIsDesktop()
  const navigate = useNavigate()
  const logout = useLogout()

  if (desktop) {
    return (
      <PageShell active="home" footer={false}>
        <div className="flex w-full items-start gap-[28px] overflow-clip">
          <AccountSidebar active={active} />
          {children}
        </div>
      </PageShell>
    )
  }

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => {
        toast.success('Você saiu da sua conta.')
        void navigate({ to: '/' })
      },
    })
  }

  return (
    <MobileShell narrow className="gap-[24px]">
      <header className="flex w-full items-center gap-[24px]">
        <MobileBackButton />
        <p className="text-[20px] leading-[16px] font-bold text-foreground">Meu perfil</p>
      </header>
      <nav aria-label="Minha conta" className="flex w-full flex-wrap items-center gap-[8px]">
        {(
          [
            ['profile', '/profile', 'Dados do perfil'],
            ['wallets', '/wallets', 'Carteiras'],
          ] as const
        ).map(([section, to, label]) => (
          <Link
            key={section}
            to={to}
            aria-current={active === section ? 'page' : undefined}
            className={cn(TAB, active === section ? 'border-primary bg-surface-dark font-bold text-text-accent' : 'border-border text-foreground')}
          >
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          disabled={logout.isPending}
          className={cn(TAB, 'ml-auto border-border font-bold text-text-accent disabled:opacity-60')}
        >
          {logout.isPending ? 'Saindo…' : 'Sair'}
        </button>
      </nav>
      <main id="conteudo" className="flex w-full min-w-px flex-col gap-[32px]">
        {children}
      </main>
    </MobileShell>
  )
}
