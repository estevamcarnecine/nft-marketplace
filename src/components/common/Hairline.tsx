import { cn } from 'cn'

/**
 * Figma's 0.3px rules (Line 1/2/5 assets). Chrome does not paint a 0.3px-tall image at
 * 1x, while Figma antialiases it into a 1px row at 30% coverage; the asset is drawn over
 * that 1px row at 30% opacity so both renders match.
 */
export function Hairline({ src, className }: { src: string; className?: string }) {
  return (
    <span aria-hidden className={cn('relative block h-0 w-full', className)}>
      <span className="absolute inset-x-0 top-[-1px] h-px opacity-30">
        <img alt="" src={src} className="block size-full max-w-none" />
      </span>
    </span>
  )
}
