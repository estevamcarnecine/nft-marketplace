import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { cn } from 'cn'

import { ComingSoon } from '@/components/common/ComingSoon'
import { Hairline } from '@/components/common/Hairline'
import { useLogout } from '../api'
import activityIcon from '@/assets/account/activity.svg'
import dangerIcon from '@/assets/account/danger.svg'
import divider from '@/assets/account/divider.svg'
import downloadIcon from '@/assets/account/download.svg'
import heartIcon from '@/assets/account/heart.svg'
import locationIcon from '@/assets/account/location.svg'
import logoutIcon from '@/assets/account/logout.svg'
import shoppingIcon from '@/assets/account/shopping.svg'
import userIcon from '@/assets/account/user.svg'

export type AccountSection = 'profile' | 'wallets'

const LABEL = 'text-[15px] leading-[45px] whitespace-nowrap text-text-accent'

/** Iconly glyphs keep the inner slot they have inside their Figma frame. */
function Icon({ src, box, inset }: { src: string; box: string; inset?: string }) {
  return (
    <span aria-hidden className={cn('relative shrink-0', box)}>
      <span className={cn('absolute', inset ?? 'inset-0')}>
        <img alt="" src={src} className="absolute inset-0 block size-full max-w-none" />
      </span>
    </span>
  )
}

const ICONS = {
  profile: <Icon src={userIcon} box="size-[18px]" />,
  wallets: <Icon src={locationIcon} box="size-[20px]" inset="inset-[8.33%_14.59%_10.42%_16.67%]" />,
  activity: <Icon src={shoppingIcon} box="size-[18px]" />,
  interests: <Icon src={heartIcon} box="size-[16px]" />,
  offers: <Icon src={activityIcon} box="size-[18px]" inset="inset-[9.79%_10.05%_10.2%_10.21%]" />,
  downloads: <Icon src={downloadIcon} box="size-[18px]" inset="inset-[11.46%_11.46%_11.01%_11.46%]" />,
  support: <Icon src={dangerIcon} box="size-[18px]" inset="inset-[12.5%_10.42%]" />,
}

function Row({ active, icon, children }: { active?: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <span
      className={cn(
        'flex w-full items-center',
        // Figma strokes inside: the 6px marker does not push the content, so it eats into the padding.
        active ? 'gap-[16px] border-l-6 border-primary pr-[16px] pl-[10px]' : 'gap-[12px] px-[16px]',
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export function AccountSidebar({ active }: { active: AccountSection }) {
  const navigate = useNavigate()
  const logout = useLogout()

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => {
        toast.success('Você saiu da sua conta.')
        void navigate({ to: '/' })
      },
    })
  }

  const link = (section: AccountSection, label: string) => (
    <Link
      to={section === 'profile' ? '/profile' : '/wallets'}
      aria-current={active === section ? 'page' : undefined}
      className="block w-full"
    >
      <Row active={active === section} icon={ICONS[section]}>
        <span className={LABEL}>{label}</span>
      </Row>
    </Link>
  )
  const soon = (key: Exclude<keyof typeof ICONS, AccountSection>, label: string) => (
    <ComingSoon className="block w-full">
      <Row icon={ICONS[key]}>
        <span className={LABEL}>{label}</span>
      </Row>
    </ComingSoon>
  )

  return (
    <nav aria-labelledby="account-nav-title" className="flex w-[310px] shrink-0 flex-col items-start bg-surface-card py-[8px]">
      <h2 id="account-nav-title" className="p-[10px] text-[18px] leading-[16px] font-bold whitespace-nowrap text-foreground">
        Meu perfil
      </h2>
      {link('profile', 'Dados do perfil')}
      {link('wallets', 'Carteiras')}
      {soon('activity', 'Atividade')}
      {soon('interests', 'Lista de interesse')}
      {soon('offers', 'Ofertas')}
      {soon('downloads', 'Arquivos baixados')}
      {soon('support', 'Suporte')}
      <Hairline src={divider} />
      <button
        type="button"
        onClick={handleLogout}
        disabled={logout.isPending}
        className="flex h-[40px] w-full items-center gap-[8px] px-[16px] text-left disabled:opacity-60"
      >
        <span aria-hidden className="relative size-[20px] shrink-0">
          <span className="absolute inset-[11.46%_9.2%_11.46%_9.41%]">
            <span className="absolute inset-[-4.86%_-4.61%_-4.87%_-4.61%]">
              <img alt="" src={logoutIcon} className="block size-full max-w-none" />
            </span>
          </span>
        </span>
        <span className="text-[15px] leading-[15px] font-bold whitespace-nowrap text-text-accent">
          {logout.isPending ? 'Saindo…' : 'Sair'}
        </span>
      </button>
    </nav>
  )
}
