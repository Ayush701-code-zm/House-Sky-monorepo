import { cn } from '@/utils/cn'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse bg-bg-surface border border-white-500/10 rounded-none',
        className
      )}
      {...props}
    />
  )
}
