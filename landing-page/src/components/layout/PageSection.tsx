import * as React from 'react'

type PageSectionTone = 'white' | 'muted' | 'dark' | 'none'

interface PageSectionProps {
  children: React.ReactNode
  tone?: PageSectionTone
  className?: string
  innerClassName?: string
  id?: string
}

const TONE_CLASS: Record<PageSectionTone, string> = {
  white: 'bg-white',
  muted: 'bg-gray-100',
  dark: 'bg-brand-dark text-white',
  none: '',
}

export function PageSection({
  children,
  tone = 'white',
  className = '',
  innerClassName = '',
  id,
}: PageSectionProps) {
  return (
    <section id={id} className={`${TONE_CLASS[tone]} ${className}`.trim()}>
      <div className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 ${innerClassName}`.trim()}>
        {children}
      </div>
    </section>
  )
}
