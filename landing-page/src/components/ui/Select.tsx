import * as React from 'react'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  helperText?: string
  required?: boolean
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, helperText, required, placeholder, id, ...props }, ref) => {
    const selectId = id || (label ? `hs-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
    const errorId = error && selectId ? `${selectId}-error` : undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="hs-label">
            {label}
            {required && <span className="hs-required">*</span>}
          </label>
        )}
        <div className="relative w-full">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={errorId || undefined}
            data-hs-select
            className={cn(
              'input-base appearance-none cursor-pointer pr-10',
              'bg-no-repeat bg-[length:16px] bg-[position:right_12px_center]',
              error && 'hs-input-error',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p id={errorId} className="hs-field-error" role="alert">{error}</p>
        ) : helperText ? (
          <p className="hs-helper-text">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = 'Select'
