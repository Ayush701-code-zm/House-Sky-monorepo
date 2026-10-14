import * as React from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, required, id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? `hs-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
    const errorId = error && textareaId ? `${textareaId}-error` : undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="hs-label">
            {label}
            {required && <span className="hs-required">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          rows={rows}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId || undefined}
          className={cn(
            'input-base min-h-[120px] resize-y leading-relaxed',
            error && 'hs-input-error',
            className
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="hs-field-error" role="alert">{error}</p>
        ) : helperText ? (
          <p className="hs-helper-text">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
