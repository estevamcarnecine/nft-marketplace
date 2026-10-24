import { cn } from 'cn'

export function Hairline({ src, className }: { src: string; className?: string }) {
  return (
    <span aria-hidden className={cn('relative block h-0 w-full', className)}>
      <span className="absolute inset-x-0 top-[-1px] h-px opacity-30">
        <img alt="" src={src} className="block size-full max-w-none" />
      </span>
    </span>
  )
}
