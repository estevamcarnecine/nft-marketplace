import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { MobileBackButton } from '@/features/nft/components/MobileNftDetail'
import { useIsDesktop } from '@/lib/use-media-query'
import { Footer } from './Footer'
import { Header, type HeaderSection } from './Header'
import { MobileShell } from './MobileShell'

export function PageShell({
  active,
  footer = true,
  children,
}: {
  active: HeaderSection
  footer?: boolean
  children: ReactNode
}) {
  const desktop = useIsDesktop()

  if (!desktop) {
    return (
      <MobileShell narrow className="gap-[24px]">
        <header className="relative flex h-[35px] w-full items-center">
          <MobileBackButton />
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-[16px] leading-[normal] font-bold tracking-[1.6px] text-foreground">
            KURIO
          </Link>
        </header>
        <main id="conteudo" className="flex w-full min-w-px flex-col gap-[32px]">
          {children}
        </main>
      </MobileShell>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-[96px] py-[24px]">
      <div className="flex w-full flex-col items-start gap-[32px]">
        <Header active={active} divider={active === 'home'} />
        <main id="conteudo" className="flex w-full flex-col gap-[96px]">
          {children}
        </main>
      </div>
      {footer && <Footer />}
    </div>
  )
}
