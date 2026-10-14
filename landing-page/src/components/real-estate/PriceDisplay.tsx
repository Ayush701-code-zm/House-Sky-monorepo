import * as React from 'react'

interface PriceDisplayProps {
  formattedPrice: string
  formattedPricePerSqFt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  textColor?: string
  subTextColor?: string
  className?: string
}

export function PriceDisplay({
  formattedPrice,
  formattedPricePerSqFt,
  size = 'md',
  textColor = 'text-slate-900',
  subTextColor = 'text-slate-500',
  className = '',
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: 'text-base font-semibold',
    md: 'text-xl sm:text-2xl font-bold',
    lg: 'text-2xl sm:text-3xl font-bold',
    xl: 'text-3xl sm:text-4xl lg:text-5xl font-extrabold',
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={`font-sans tracking-tight ${textColor} ${sizeClasses[size]}`}>
        {formattedPrice}
      </span>
      {formattedPricePerSqFt && (
        <span className={`text-[11px] font-mono tracking-wider pt-0.5 ${subTextColor}`}>
          {formattedPricePerSqFt}
        </span>
      )}
    </div>
  )
}
