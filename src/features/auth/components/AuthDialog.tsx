import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Dialog } from 'radix-ui'
import { cn } from 'cn'

import closeIcon from '@/assets/auth/close.svg'

const TAB = 'text-[20px] leading-[16px] font-medium whitespace-nowrap'

const FRAMES = {
  login: { box: 'my-[160px] min-h-[600px]', close: 'top-[11px] right-[12px]' },
  signup: { box: 'my-[158px] min-h-[656px] overflow-clip rounded-[8px]', close: 'top-[13px] right-[13px]' },
} as const

type AuthMode = keyof typeof FRAMES

export function AuthDialog({
  mode,
  description,
  redirect,
  onClose,
  children,
}: {
  mode: AuthMode
  description: string
  redirect?: string
  onClose: () => void
  children: ReactNode
}) {
  const frame = FRAMES[mode]
  const tab = (target: AuthMode, label: string) =>
    target === mode ? (
      <Dialog.Title className={`${TAB} text-text-accent`}>{label}</Dialog.Title>
    ) : (
      <Link
        to={target === 'login' ? '/login' : '/signup'}
        search={{ redirect }}
        replace
        className={`${TAB} text-foreground`}
      >
        {label}
      </Link>
    )

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 overflow-y-auto">
          <Dialog.Content
            onOpenAutoFocus={(event) => {
              const field =
                event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector('input') : null
              if (field) {
                event.preventDefault()
                field.focus()
              }
            }}
            className={cn(
              'relative mx-auto flex w-[500px] max-w-[calc(100vw-32px)] flex-col items-start bg-surface-card pb-[10px] outline-none',
              frame.box,
            )}
          >
            <div className="flex w-full flex-col items-center overflow-clip pt-[48px]">
              <div className="flex w-full flex-col items-center gap-[40px] px-[48px]">
                <nav aria-label="Acesso" className="flex h-[20px] items-center justify-center gap-[8px]">
                  {tab('login', 'Entrar')}
                  <span aria-hidden className="w-px self-stretch bg-text-coral" />
                  {tab('signup', 'Criar conta')}
                </nav>
                <Dialog.Description className="w-full text-center text-[13px] leading-[16px] text-foreground">
                  {description}
                </Dialog.Description>
              </div>
            </div>

            {children}

            <span aria-hidden className="absolute bottom-0 left-0 h-[10px] w-full bg-primary" />
            <Dialog.Close aria-label="Fechar" className={cn('absolute size-[18px]', frame.close)}>
              <img alt="" src={closeIcon} className="absolute inset-0 block size-full max-w-none" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
