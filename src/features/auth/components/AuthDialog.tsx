import type { ReactNode } from 'react'
import { Dialog } from 'radix-ui'

import { ComingSoon } from '@/components/common/ComingSoon'
import closeIcon from '@/assets/auth/close.svg'

const TAB = 'text-[20px] leading-[16px] font-medium whitespace-nowrap'

/**
 * Shell of the Figma "Sign In Modal" / "Sign Up Modal": a real modal dialog (focus trap,
 * Escape, labelled) over the page, which stays visible because the frame's scrim is clear.
 */
export function AuthDialog({
  mode,
  description,
  minHeight,
  onClose,
  children,
}: {
  mode: 'login' | 'signup'
  description: string
  /** Frame height from the Figma (600 for login, 656 for sign up); content may grow past it. */
  minHeight: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 overflow-y-auto">
          <Dialog.Content
            // Start on the first field, not on the header tabs.
            onOpenAutoFocus={(event) => {
              const field = event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector('input') : null
              if (field) {
                event.preventDefault()
                field.focus()
              }
            }}
            className={`relative mx-auto my-[160px] flex w-[500px] max-w-[calc(100vw-32px)] flex-col items-start bg-surface-card pb-[10px] outline-none ${minHeight}`}>
            <div className="flex w-full flex-col items-center overflow-clip pt-[48px]">
              <div className="flex w-full flex-col items-center gap-[40px] px-[48px]">
                <div className="flex h-[20px] items-center justify-center gap-[8px]">
                  {mode === 'login' ? (
                    <Dialog.Title className={`${TAB} text-text-accent`}>Entrar</Dialog.Title>
                  ) : (
                    <span className={`${TAB} text-foreground`}>Entrar</span>
                  )}
                  <span aria-hidden className="w-px self-stretch bg-text-coral" />
                  {mode === 'signup' ? (
                    <Dialog.Title className={`${TAB} text-text-accent`}>Criar conta</Dialog.Title>
                  ) : (
                    // The sign-up tab is wired with the Cadastro frame.
                    <ComingSoon className={`${TAB} text-foreground`}>Criar conta</ComingSoon>
                  )}
                </div>
                <Dialog.Description className="w-full text-center text-[13px] leading-[16px] text-foreground">
                  {description}
                </Dialog.Description>
              </div>
            </div>

            {children}

            <span aria-hidden className="absolute bottom-0 left-0 h-[10px] w-full bg-primary" />
            <Dialog.Close aria-label="Fechar" className="absolute top-[11px] right-[12px] size-[18px]">
              <img alt="" src={closeIcon} className="absolute inset-0 block size-full max-w-none" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
