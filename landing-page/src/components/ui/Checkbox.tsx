import * as React from 'react'
import { cn } from '@/utils/cn'
import { Check } from 'lucide-react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, checked, id, onChange, ...props }, ref) => {
    const checkboxId = id || (label ? `hs-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={checkboxId} className="inline-flex items-center gap-3 cursor-pointer group select-none">
          <div className="relative shrink-0">
            <input
              id={checkboxId}
              type="checkbox"
              ref={ref}
              checked={checked}
              onChange={onChange}
              className="sr-only peer"
              {...props}
            />
            <div
              className={cn(
                'h-5 w-5 border border-gray-300 bg-white rounded-md transition-all duration-150',
                'peer-checked:bg-brand-green peer-checked:border-brand-green',
                'peer-focus:ring-2 peer-focus:ring-brand-green/20 peer-focus:ring-offset-1',
                'group-hover:border-brand-green/60',
                className
              )}
            >
              {checked && <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto stroke-[3]" />}
            </div>
          </div>
          {label && <span className="text-sm font-medium text-brand-charcoal group-hover:text-brand-charcoal/80">{label}</span>}
        </label>
        {error && <span className="hs-field-error pl-8">{error}</span>}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
