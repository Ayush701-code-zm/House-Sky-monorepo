interface BrandLogoProps {
  className?: string
  /** Visual size of the lockup */
  size?: 'sm' | 'md' | 'lg'
  /** Optional cream plate (useful on dark sidebars) */
  plate?: boolean
}

const HEIGHT: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-9',
  md: 'h-14',
  lg: 'h-16',
}

/** Full House & Sky logo lockup (green / gold / cream). */
export function BrandLogo({ className = '', size = 'md', plate = false }: BrandLogoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center ${
        plate ? 'bg-[#FDFCF0] rounded-xl px-2.5 py-1.5' : ''
      } ${className}`}
    >
      <img
        src="/logo.png"
        alt="House & Sky — Building Trust. Delivering Value."
        className={`w-auto max-w-full object-contain ${HEIGHT[size]}`}
      />
    </div>
  )
}
