import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Header, type HeaderSection } from './Header'

/** Desktop screen frame from the Figma: 1200 content column, 24 top/bottom, 96 between sections. */
export function PageShell({
  active,
  footer = true,
  children,
}: {
  active: HeaderSection
  /** The account frames (perfil, carteiras) end without the footer. */
  footer?: boolean
  children: ReactNode
}) {
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
