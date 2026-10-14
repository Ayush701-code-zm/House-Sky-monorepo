'use client'

import * as React from 'react'

interface AuraVeloceLogoProps {
  variant?: 'full' | 'icon' | 'compact'
  className?: string
  iconSize?: number
  gold?: boolean
}

export function AuraVeloceLogo({
  variant = 'full',
  className = '',
  iconSize = 34,
  gold = false,
}: AuraVeloceLogoProps) {
  const primaryColor = gold ? '#C9A96E' : 'currentColor'
  const accentColor = gold ? '#E8C98A' : 'currentColor'

  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none group cursor-pointer ${className}`}>
      {/* Architectural Monogram Crest Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        {/* Precision Architectural Grid Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeDasharray="4 2"
          className="opacity-30"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke={accentColor}
          strokeWidth="1"
          className="opacity-60"
        />
        {/* Apex Pinnacle Diamond */}
        <path
          d="M50 14L54 20L50 26L46 20Z"
          fill={primaryColor}
        />
        {/* 'A' Architectural Pillar Lines */}
        <path
          d="M30 76L50 28L60 52"
          stroke={primaryColor}
          strokeWidth="4"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* 'A' Structural Crossbar */}
        <line
          x1="38"
          y1="58"
          x2="56"
          y2="58"
          stroke={primaryColor}
          strokeWidth="2.5"
        />
        {/* 'V' Overlapping Architectural Facet */}
        <path
          d="M44 28L64 76L76 46"
          stroke={accentColor}
          strokeWidth="4"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* Base Alignment Accent Line */}
        <line
          x1="26"
          y1="82"
          x2="74"
          y2="82"
          stroke={primaryColor}
          strokeWidth="1.5"
          className="opacity-40"
        />
      </svg>

      {variant !== 'icon' && (
        <div className="flex flex-col shrink-0 leading-none">
          <span className="font-sans text-[13px] sm:text-base md:text-lg tracking-[0.22em] text-white font-bold uppercase leading-none group-hover:text-gold-300 transition-colors">
            Aura Véloce
          </span>
          {variant === 'full' && (
            <span className="text-[6.5px] sm:text-[8px] font-inter uppercase tracking-[0.35em] text-gold-400 font-medium pt-1">
              Estates & Residences
            </span>
          )}
        </div>
      )}
    </div>
  )
}
