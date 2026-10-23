import type { ReactNode } from 'react'
import { cn } from 'cn'

/**
 * Mobile screen frame from the Figma (414 wide: 40 top, 24 sides). Tablets keep the same layout,
 * centered and wider; `narrow` caps form screens so lines stay readable.
 */
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
