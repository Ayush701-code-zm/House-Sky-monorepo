import * as React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'gold' | 'outline' | 'surface' | 'amber' | 'success' | 'error'
  size?: 'sm' | 'md'
}

export function Badge({
  className,
  variant = 'gold',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-inter text-label uppercase tracking-widest rounded-none border border-transparent font-medium'

  const variantStyles = {
    gold: 'bg-gold-300/15 text-gold-200 border-gold-300/30',
    outline: 'bg-transparent text-white-200 border-white-500/60',
    surface: 'bg-bg-elevated text-white-200 border-white-500/30',
    amber: 'bg-amber/20 text-amber border-amber/40',
    success: 'bg-success/20 text-success border-success/40',
    error: 'bg-error/20 text-error border-error/40',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]',
  }

  return (
    <div className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
      {children}
    </div>
  )
}
