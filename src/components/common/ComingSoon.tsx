import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Out-of-scope link or action shown in the Figma. It keeps its visual slot but is
 * announced as unavailable and never pretends to navigate or succeed.
 */
export function ComingSoon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span role="link" aria-disabled="true" tabIndex={0} className={className}>
          {children}
          <span className="sr-only"> (em breve)</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>Em breve</TooltipContent>
    </Tooltip>
  )
}
