'use client'

import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  label?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  icon: Icon,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`space-y-1.5 relative ${isOpen ? 'z-[60]' : 'z-10'} ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-[10px] uppercase tracking-[0.18em] text-brand-charcoal/70 font-semibold flex items-center gap-1.5">
          {Icon && <Icon className="w-3 h-3 text-brand-green" />}
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border text-left text-xs px-3.5 py-3 rounded-md flex items-center justify-between transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'border-brand-green ring-2 ring-brand-green/20 text-brand-charcoal shadow-md'
            : 'border-brand-green/20 hover:border-brand-green/40 text-brand-charcoal'
        }`}
      >
        <span className="truncate font-semibold text-brand-charcoal">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-brand-green shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Options Panel Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-white border border-brand-green/30 rounded-md shadow-2xl max-h-60 overflow-y-auto py-1.5">
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left text-xs px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-brand-green text-white font-bold'
                    : 'text-brand-charcoal hover:bg-brand-soft'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
