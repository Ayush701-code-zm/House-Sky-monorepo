import * as React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, required, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? `hs-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
    const errorId = error && inputId ? `${inputId}-error` : undefined
    const helperId = helperText && inputId ? `${inputId}-helper` : undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="hs-label">
            {label}
            {required && <span className="hs-required">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={errorId || helperId || undefined}
            className={cn(
              'input-base',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'hs-input-error',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p id={errorId} className="hs-field-error" role="alert">{error}</p>
        ) : helperText ? (
          <p id={helperId} className="hs-helper-text">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
