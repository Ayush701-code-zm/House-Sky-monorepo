'use client'

import * as React from 'react'
import { ShieldCheck, CheckCircle2 } from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'

interface InquiryFormProps {
  propertyTitle?: string
  agentName?: string
  className?: string
}

export function InquiryForm({
  propertyTitle,
  agentName = 'Senior Advisory Desk',
  className = '',
}: InquiryFormProps) {
  const [submitted, setSubmitted] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState('')

  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    inquiryType: 'CUSTOMER_VIEWING',
    preferredDate: '',
    preferredTime: 'Morning (10 AM - 1 PM)',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatusMessage('')

    const baseUrl = getApiBaseUrl();

    try {
      const digits = String(formData.phone || '').replace(/\D/g, '')
      const fallbackEmail = digits.length >= 10
        ? `sitevisit.${digits.slice(-10)}@houseandsky.com`
        : 'sitevisit@houseandsky.com'
      const res = await fetch(`${baseUrl}/public/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email.trim() || fallbackEmail,
          phone: formData.phone,
          inquiryType: 'SITE_VISIT',
          plotNo: propertyTitle || '',
          message: `Preferred Window: ${formData.preferredTime} | Date: ${formData.preferredDate || 'Anytime'} | Notes: ${formData.message}`
        })
      }).catch(() => null)

      if (!res) {
        alert('Failed to connect to backend server. Please check your internet connection.')
        setIsSubmitting(false)
        return
      }

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        alert(data.message || 'Failed to submit viewing inquiry.')
        setIsSubmitting(false)
        return
      }

      setStatusMessage(data.message || 'Viewing request submitted. Our advisor will contact you shortly.')
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Failed to connect to backend server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className={`bg-white border border-brand-green/20 rounded-2xl p-8 text-center space-y-4 shadow-md ${className}`}>
        <div className="w-12 h-12 rounded-full bg-brand-soft text-brand-green mx-auto flex items-center justify-center shadow-sm">
          <CheckCircle2 className="w-7 h-7 text-brand-green" />
        </div>
        <h4 className="font-serif text-2xl text-brand-charcoal font-normal">
          Inquiry Received
        </h4>
        <p className="text-xs text-brand-charcoal/70 font-light leading-relaxed max-w-md mx-auto">
          {statusMessage || `Thank you, ${formData.fullName}. Our advisor will contact you shortly to confirm your viewing details.`}
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false)
          }}
          className="mt-4 px-6 py-2.5 bg-brand-green text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-dark rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Submit Another Request
        </button>
      </div>
    )
  }

  return (
    <div className={`hs-form-card space-y-6 ${className}`}>
      <div className="space-y-1 pb-4 border-b border-brand-green/10">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-green block">
          INQUIRY
        </span>
        <h4 className="font-serif text-2xl text-brand-charcoal font-normal">
          Schedule a Private Tour
        </h4>
        {propertyTitle && (
          <p className="text-xs text-brand-charcoal/60 font-medium">
            Residence: <span className="text-brand-charcoal font-semibold">{propertyTitle}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="hs-inquiry-name" className="hs-label">Full Name <span className="hs-required">*</span></label>
          <input
            id="hs-inquiry-name"
            type="text"
            required
            autoComplete="name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Enter your full name"
            className="input-base"
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="hs-inquiry-email" className="hs-label">Email Address <span className="hs-required">*</span></label>
            <input
              id="hs-inquiry-email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email address"
              className="input-base"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="hs-inquiry-phone" className="hs-label">Phone Number <span className="hs-required">*</span></label>
            <input
              id="hs-inquiry-phone"
              type="tel"
              required
              autoComplete="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="input-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="hs-inquiry-date" className="hs-label">Preferred Date</label>
              <input
                id="hs-inquiry-date"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="input-base"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="hs-inquiry-time" className="hs-label">Preferred Window</label>
              <select
                id="hs-inquiry-time"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="input-base appearance-none cursor-pointer pr-10"
              >
                <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM - 4 PM)</option>
                <option value="Sunset Hour (4 PM - 7 PM)">Sunset Hour (4 PM - 7 PM)</option>
              </select>
            </div>
          </div>

        {/* Additional Notes */}
        <div className="space-y-1.5">
          <label htmlFor="hs-inquiry-notes" className="hs-label">Specific Requirements / Notes</label>
          <textarea
            id="hs-inquiry-notes"
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Mention any specific timing preferences or questions..."
            className="input-base min-h-[120px] resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="hs-btn-primary w-full"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending Inquiry...
            </>
          ) : (
            'Send Inquiry'
          )}
        </button>

        <p className="text-[10px] text-brand-charcoal/60 text-center font-medium flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
          Client Privacy Protocol Guaranteed
        </p>
      </form>
    </div>
  )
}
