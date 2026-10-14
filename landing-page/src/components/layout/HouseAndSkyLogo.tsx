import * as React from 'react'
import Image from 'next/image'

interface HouseAndSkyLogoProps {
  className?: string
  variant?: 'dark' | 'light'
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/** Larger lockup sizes so "House & Sky" reads clearly in the header. */
const SIZE_CLASS = {
  sm: 'h-12 sm:h-14 xl:h-[3.75rem]',
  md: 'h-14 sm:h-16 xl:h-20',
  lg: 'h-18 sm:h-22 xl:h-28',
} as const

const MAX_W = {
  sm: 'max-w-[min(100%,260px)] sm:max-w-[300px] xl:max-w-[340px]',
  md: 'max-w-[min(100%,320px)] sm:max-w-[380px]',
  lg: 'max-w-[min(100%,420px)] sm:max-w-[480px]',
} as const

/**
 * Full House & Sky lockup (transparent PNG — sits cleanly on white).
 * `variant="light"` keeps a cream plate only for dark surfaces (e.g. footer).
 */
export function HouseAndSkyLogo({
  className = '',
  variant = 'dark',
  showTagline: _showTagline = true,
  size = 'md',
}: HouseAndSkyLogoProps) {
  const plate =
    variant === 'light'
      ? 'bg-[#FDFCF0] rounded-xl px-2.5 py-1.5'
      : 'bg-transparent'

  return (
    <div
      className={`inline-flex items-center cursor-pointer select-none max-w-full ${plate} ${className}`}
    >
      <Image
        src="/images/logo.png"
        alt="House & Sky — Building Trust. Delivering Value."
        width={480}
        height={125}
        priority
        className={`w-auto object-contain object-left ${SIZE_CLASS[size]} ${MAX_W[size]}`}
      />
    </div>
  )
}
