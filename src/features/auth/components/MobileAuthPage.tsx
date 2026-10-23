import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

/**
 * Figma "Mobile / Login" and "Mobile / Cadastro": full screen, 40px between the logo, title, form,
 * social block and the link to the other screen. The logo goes back to the catalog.
 */
export function MobileAuthPage({ title, footer, children }: { title: string; footer: ReactNode; children: ReactNode }) {
  return (
    <main
      id="conteudo"
      className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col items-start gap-[40px] px-[28px] pt-[80px] pb-[calc(24px+env(safe-area-inset-bottom))]"
    >
      <div className="flex h-[136px] w-full items-center justify-center">
        <Link to="/" aria-label="Kurio, voltar ao início" className="text-[32px] leading-[normal] font-bold tracking-[3.2px] text-foreground">
          KURIO
        </Link>
      </div>
      <h1 className="w-full text-center text-[20px] leading-[16px] font-bold text-foreground">{title}</h1>
      {children}
      <p className="w-full text-center text-[15px] leading-[normal] text-text-secondary">{footer}</p>
    </main>
  )
}
