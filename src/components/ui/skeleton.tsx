import { cn } from "cn"

/** Loading placeholder with a shimmer sweep; static under prefers-reduced-motion. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("skeleton-shimmer rounded-md bg-surface-card", className)}
      {...props}
    />
  )
}

export { Skeleton }
