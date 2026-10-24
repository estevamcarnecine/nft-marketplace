import type { ReactNode } from 'react'
import { cn } from 'cn'

export function MobileShell({
  children,
  narrow,
  className,
}: {
  children: ReactNode
  narrow?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col items-start gap-[16px] px-[24px] pt-[40px] pb-[32px]',
        narrow ? 'max-w-[560px]' : 'max-w-[960px]',
        className,
      )}
    >
      {children}
    </div>
  )
}
