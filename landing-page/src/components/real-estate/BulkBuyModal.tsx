'use client'

import * as React from 'react'
import { X, Building2 } from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'

const MIN_BULK_UNITS = 2
const DEFAULT_UNIT_COUNT = 2
const PROPERTY_TYPE_OPTIONS = [
  { value: '', label: 'Any type' },
  { value: 'RESIDENTIAL_PLOT', label: 'Residential plot' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'SHOWROOM', label: 'Showroom' },
  { value: 'LAND', label: 'Land' },
]
const BUDGET_OPTIONS = [
  { value: '', label: 'Discuss on call' },
  { value: 'UNDER_50L', label: 'Under ₹50 Lakh' },
  { value: '50L_1CR', label: '₹50 Lakh – ₹1 Cr' },
  { value: '1CR_3CR', label: '₹1 Cr – ₹3 Cr' },
  { value: '3CR_PLUS', label: '₹3 Cr+' },
]

export interface BulkBuyContext {
  propertyId?: string
  propertyTitle?: string
  city?: string
  propertyType?: string
}

interface BulkBuyModalProps {
  isOpen: boolean
  onClose: () => void
  context?: BulkBuyContext | null
}

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  unitCount: String(DEFAULT_UNIT_COUNT),
  budgetRange: '',
  propertyType: '',
  city: '',
  message: '',
}

export function BulkBuyModal({ isOpen, onClose, context }: BulkBuyModalProps) {
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = React.useState('')

  React.useEffect(() => {
    if (!isOpen) return
    setStatus('idle')
    setErrorMessage('')
    setForm({
      ...EMPTY_FORM,
      city: context?.city || '',
      propertyType: context?.propertyType || '',
      message: context?.propertyTitle
        ? `Interested in bulk purchase related to ${context.propertyTitle}.`
        : '',
    })
  }, [isOpen, context?.city, context?.propertyType, context?.propertyTitle])

  if (!isOpen) return null

  const patch = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('submitting')
    setErrorMessage('')
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/public/bulk-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          unitCount: Number(form.unitCount) || DEFAULT_UNIT_COUNT,
          budgetRange: form.budgetRange,
          propertyType: form.propertyType,
          city: form.city.trim(),
          propertyId: context?.propertyId || '',
          propertyTitle: context?.propertyTitle || '',
          message: form.message.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMessage(data.message || 'Could not send your request. Try again.')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setErrorMessage('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close bulk buy form"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-buy-title"
        className="relative w-full max-w-lg bg-white rounded-3xl border border-brand-green/15 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-brand-green">Bulk purchase</p>
            <h2 id="bulk-buy-title" className="font-serif text-2xl font-bold text-brand-charcoal mt-1">
              Talk to us for a bulk buy
            </h2>
            <p className="text-xs text-brand-charcoal/60 mt-1">
              {context?.propertyTitle
                ? `Request for ${context.propertyTitle}`
                : 'Share your requirement. An advisor will call you.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#E8F0EC] text-brand-green hover:bg-brand-green hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            <p className="font-bold">Request received.</p>
            <p className="mt-1 text-xs">Our desk will contact you on the number you shared.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label htmlFor="bulk-buy-name" className="block space-y-1.5">
                <span className="hs-label">Full name <span className="hs-required">*</span></span>
                <input
                  id="bulk-buy-name"
                  required
                  value={form.name}
                  onChange={(e) => patch('name', e.target.value)}
                  className="input-base"
                />
              </label>
              <label htmlFor="bulk-buy-phone" className="block space-y-1.5">
                <span className="hs-label">Phone <span className="hs-required">*</span></span>
                <input
                  id="bulk-buy-phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => patch('phone', e.target.value)}
                  className="input-base"
                />
              </label>
            </div>
            <label htmlFor="bulk-buy-email" className="block space-y-1.5">
              <span className="hs-label">Email (optional)</span>
              <input
                id="bulk-buy-email"
                type="email"
                value={form.email}
                onChange={(e) => patch('email', e.target.value)}
                className="input-base"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label htmlFor="bulk-buy-units" className="block space-y-1.5">
                <span className="hs-label">Units to buy <span className="hs-required">*</span></span>
                <input
                  id="bulk-buy-units"
                  required
                  type="number"
                  min={MIN_BULK_UNITS}
                  value={form.unitCount}
                  onChange={(e) => patch('unitCount', e.target.value)}
                  className="input-base"
                />
              </label>
              <label htmlFor="bulk-buy-budget" className="block space-y-1.5">
                <span className="hs-label">Budget</span>
                <select
                  id="bulk-buy-budget"
                  value={form.budgetRange}
                  onChange={(e) => patch('budgetRange', e.target.value)}
                  className="input-base appearance-none cursor-pointer pr-10"
                >
                  {BUDGET_OPTIONS.map((option) => (
                    <option key={option.value || 'any'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label htmlFor="bulk-buy-type" className="block space-y-1.5">
                <span className="hs-label">Property type</span>
                <select
                  id="bulk-buy-type"
                  value={form.propertyType}
                  onChange={(e) => patch('propertyType', e.target.value)}
                  className="input-base appearance-none cursor-pointer pr-10"
                >
                  {PROPERTY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value || 'any'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="bulk-buy-city" className="block space-y-1.5">
                <span className="hs-label">Preferred city</span>
                <input
                  id="bulk-buy-city"
                  value={form.city}
                  onChange={(e) => patch('city', e.target.value)}
                  className="input-base"
                />
              </label>
            </div>
            <label htmlFor="bulk-buy-message" className="block space-y-1.5">
              <span className="hs-label">Message</span>
              <textarea
                id="bulk-buy-message"
                rows={3}
                value={form.message}
                onChange={(e) => patch('message', e.target.value)}
                className="input-base min-h-[100px] resize-y"
              />
            </label>
            {status === 'error' && errorMessage ? (
              <div className="hs-error-message">
                <p>{errorMessage}</p>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="hs-btn-primary w-full"
            >
              <Building2 className="w-4 h-4" />
              {status === 'submitting' ? 'Sending…' : 'Request a callback'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
