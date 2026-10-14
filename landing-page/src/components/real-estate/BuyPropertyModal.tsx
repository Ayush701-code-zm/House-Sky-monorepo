'use client'

import * as React from 'react'
import {
  X, ShoppingCart, Home, Key, FileText,
  Phone, Mail, User, IndianRupee, MessageCircle,
  CheckCircle2, AlertCircle, Loader2, Calendar
} from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type InquiryIntent = 'BUY' | 'RENT' | 'LEASE'
type FormState = 'idle' | 'loading' | 'success' | 'error'

interface PropertyInquiryModalProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  propertyTitle: string
  propertyCity?: string
  propertyPrice?: string
  /** Pre-select intent based on property listing type */
  defaultIntent?: InquiryIntent
}

// ─── Config ───────────────────────────────────────────────────────────────────

const INTENT_CONFIG = {
  BUY: {
    label: 'Buy',
    icon: ShoppingCart,
    color: 'emerald',
    headerGradient: 'from-[#051711] via-[#0A2E23] to-[#0B4F3C]',
    accentClass: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    btnClass: 'bg-[#0B4F3C] hover:bg-[#0a4434]',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    activeBtnClass: 'bg-emerald-600 text-white border-emerald-600',
    headline: 'Interested to Buy?',
    subline: 'Submit your buy inquiry — free, zero brokerage',
    submitLabel: 'Submit Buy Inquiry — Free',
    successNote: '✅ Zero brokerage · Admin-verified listing · RERA compliant',
  },
  RENT: {
    label: 'Rent',
    icon: Key,
    color: 'sky',
    headerGradient: 'from-[#051828] via-[#0A2A40] to-[#0B4060]',
    accentClass: 'bg-sky-500/20 border-sky-500/30 text-sky-300',
    btnClass: 'bg-sky-700 hover:bg-sky-800',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    activeBtnClass: 'bg-sky-600 text-white border-sky-600',
    headline: 'Looking to Rent?',
    subline: 'Submit your rental inquiry — our team will connect you',
    submitLabel: 'Submit Rent Inquiry — Free',
    successNote: '✅ Verified landlord listing · Admin reviewed · No broker fees',
  },
  LEASE: {
    label: 'Lease',
    icon: FileText,
    color: 'violet',
    headerGradient: 'from-[#130522] via-[#200A38] to-[#2D0F4F]',
    accentClass: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
    btnClass: 'bg-violet-700 hover:bg-violet-800',
    badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    activeBtnClass: 'bg-violet-600 text-white border-violet-600',
    headline: 'Looking for a Lease?',
    subline: 'Corporate & long-term lease inquiry — team will contact you',
    submitLabel: 'Submit Lease Inquiry — Free',
    successNote: '✅ Long-term lease ready · Admin verified · RERA compliant',
  },
} as const

const BUY_BUDGET_OPTIONS = [
  'Under ₹25 Lakhs',
  '₹25L – ₹50L',
  '₹50L – ₹1 Crore',
  '₹1 Cr – ₹3 Crores',
  '₹3 Cr – ₹5 Crores',
  'Above ₹5 Crores',
  'Flexible / Negotiable',
]

const RENT_BUDGET_OPTIONS = [
  'Under ₹10,000 / month',
  '₹10K – ₹25K / month',
  '₹25K – ₹50K / month',
  '₹50K – ₹1 Lakh / month',
  '₹1L – ₹2 Lakh / month',
  'Above ₹2 Lakh / month',
  'Flexible',
]

const LEASE_DURATION_OPTIONS = [
  '6 Months',
  '1 Year',
  '2 Years',
  '3 Years',
  '5 Years',
  'Negotiable',
]

// ─── Component ────────────────────────────────────────────────────────────────

export function BuyPropertyModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  propertyCity,
  propertyPrice,
  defaultIntent = 'BUY',
}: PropertyInquiryModalProps) {
  const [intent, setIntent] = React.useState<InquiryIntent>(defaultIntent)
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [budget, setBudget] = React.useState('')
  const [duration, setDuration] = React.useState('')
  const [moveIn, setMoveIn] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [formState, setFormState] = React.useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = React.useState('')

  // Reset on close
  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormState('idle')
        setErrorMsg('')
        setName('')
        setPhone('')
        setEmail('')
        setBudget('')
        setDuration('')
        setMoveIn('')
        setMessage('')
        setIntent(defaultIntent)
      }, 300)
    }
  }, [isOpen, defaultIntent])

  // Reset budget when switching intent
  React.useEffect(() => {
    setBudget('')
    setDuration('')
  }, [intent])

  const cfg = INTENT_CONFIG[intent]
  const IntentIcon = cfg.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setFormState('loading')
    setErrorMsg('')

    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/public/properties/${propertyId}/buy-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          budget: budget || undefined,
          inquiryIntent: intent,
          message: [
            message.trim(),
            duration ? `Lease Duration: ${duration}` : '',
            moveIn ? `Move-in Date: ${moveIn}` : '',
          ].filter(Boolean).join('\n') || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Submission failed. Please try again.')
      setFormState('success')
    } catch (err: any) {
      setFormState('error')
      setErrorMsg(err?.message || 'Something went wrong. Please try again.')
    }
  }

  if (!isOpen) return null

  const INTENTS: InquiryIntent[] = ['BUY', 'RENT', 'LEASE']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.18s ease-out' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-white/20"
        style={{ animation: 'fadeIn 0.2s ease-out' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className={`bg-gradient-to-br ${cfg.headerGradient} p-5 text-white relative`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Intent selector tabs */}
          <div className="flex items-center gap-1.5 mb-4 bg-black/20 p-1 rounded-2xl w-fit">
            {INTENTS.map((it) => {
              const c = INTENT_CONFIG[it]
              const Icon = c.icon
              const isActive = intent === it
              return (
                <button
                  key={it}
                  type="button"
                  onClick={() => setIntent(it)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? c.activeBtnClass
                      : 'text-white/60 border-transparent hover:text-white/90 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {c.label}
                </button>
              )
            })}
          </div>

          {/* Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${cfg.accentClass}`}>
              <IntentIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white leading-snug">{cfg.headline}</h2>
              <p className="text-[11px] text-white/55">{cfg.subline}</p>
            </div>
          </div>

          {/* Property info pill */}
          <div className="bg-white/10 rounded-2xl px-3.5 py-2.5 border border-white/15">
            <p className="text-xs font-bold text-white truncate">{propertyTitle}</p>
            {(propertyCity || propertyPrice) && (
              <p className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {propertyCity && <span>📍 {propertyCity}</span>}
                {propertyPrice && <span>💰 {propertyPrice}</span>}
              </p>
            )}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          {formState === 'success' ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-slate-900">Inquiry Submitted! 🎉</h3>
                <p className="text-sm text-slate-500">
                  Our senior advisory team will call <span className="font-bold text-slate-800">{phone}</span> within 24 hours.
                </p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                {cfg.successNote}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`w-full py-3 rounded-2xl text-white font-bold text-sm transition-colors cursor-pointer ${cfg.btnClass}`}
              >
                Close
              </button>
            </div>
          ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {formState === 'error' && (
                  <div className="hs-error-message">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="modal-name" className="hs-label sr-only">Your Full Name <span className="hs-required">*</span></label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="modal-name"
                    type="text"
                    required
                    placeholder="Your Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-base pl-10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="modal-phone" className="hs-label sr-only">Phone Number <span className="hs-required">*</span></label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="modal-phone"
                    type="tel"
                    required
                    placeholder="Phone Number * (for callback)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-base pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="modal-email" className="hs-label sr-only">Email (optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="modal-email"
                    type="email"
                    placeholder="Email (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-base pl-10"
                  />
                </div>
              </div>

              {/* Budget / Rent Range — changes per intent */}
              <div className="space-y-1.5">
                <label htmlFor="modal-budget" className="hs-label sr-only">Budget</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="modal-budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="input-base pl-10 pr-4 appearance-none cursor-pointer"
                  >
                    <option value="">
                      {intent === 'BUY' ? 'Select Budget (optional)' : intent === 'RENT' ? 'Select Monthly Rent Range (optional)' : 'Select Budget / Range (optional)'}
                    </option>
                    {(intent === 'RENT' ? RENT_BUDGET_OPTIONS : BUY_BUDGET_OPTIONS).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lease Duration — only for LEASE */}
              {intent === 'LEASE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="input-base pl-10 pr-3 appearance-none cursor-pointer"
                    >
                      <option value="">Lease Duration</option>
                      {LEASE_DURATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      value={moveIn}
                      onChange={(e) => setMoveIn(e.target.value)}
                      placeholder="Move-in Date"
                      className="input-base pl-10 pr-3 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Move-in date for RENT */}
              {intent === 'RENT' && (
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={moveIn}
                    onChange={(e) => setMoveIn(e.target.value)}
                    className="input-base pl-10 pr-4 cursor-pointer"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold pointer-events-none">Move-in</span>
                </div>
              )}

              {/* Message */}
              <div className="space-y-1.5">
                <label htmlFor="modal-message" className="hs-label sr-only">Message</label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
                  <textarea
                    id="modal-message"
                    rows={2}
                    placeholder={
                      intent === 'BUY' ? 'Any requirements? (optional)'
                      : intent === 'RENT' ? 'Preferred location, furnishing, etc. (optional)'
                      : 'Company name, lease terms, usage (optional)'
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-base pl-10 pr-4 min-h-[80px] resize-y"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={formState === 'loading' || !name.trim() || !phone.trim()}
                className={`w-full py-3 rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg ${cfg.btnClass}`}
              >
                {formState === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <IntentIcon className="w-4 h-4" />
                    {cfg.submitLabel}
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-slate-400 font-medium">
                🔒 Zero brokerage · No spam · Your data is secure
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
