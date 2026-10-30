'use client'

import * as React from 'react'
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'
import { SITE } from '@/utils/siteConfig'
import { DraftNotice } from '@/components/ui/DraftNotice'
import { useClientDraft } from '@/utils/useFormDraft'

const HOME_CONTACT_DEFAULTS = {
  fullName: '',
  phone: '',
  email: '',
  projectOfInterest: 'Dholera SIR Smart City Enclave',
  preferredDate: '',
  message: '',
}

export function HomepageContactSection() {
  const homeDraft = useClientDraft('hs-public-home-contact', HOME_CONTACT_DEFAULTS)
  const formData = homeDraft.value
  const setFormData = homeDraft.setValue
  const draftRestored = homeDraft.restored
  const setDraftRestored = homeDraft.setRestored
  const clearHomeDraft = homeDraft.clear
  const [submitted, setSubmitted] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const baseUrl = getApiBaseUrl()
      const digits = String(formData.phone || '').replace(/\D/g, '')
      const fallbackEmail = digits.length >= 10
        ? `sitevisit.${digits.slice(-10)}@houseandsky.com`
        : 'sitevisit@houseandsky.com'
      const payload = {
          name: formData.fullName,
          email: formData.email.trim() || fallbackEmail,
          phone: formData.phone,
          inquiryType: 'CUSTOMER_VIEWING',
          message: `Project Interest: ${formData.projectOfInterest}. Site Tour Date: ${formData.preferredDate}. Notes: ${formData.message}`
        }
      const res = await fetch(`${baseUrl}/public/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null)

      if (!res || !res.ok) {
        setSubmitError('Could not submit your request. Please try again or call the advisory desk.')
        return
      }
      clearHomeDraft()
      setDraftRestored(false)
      setFormData(HOME_CONTACT_DEFAULTS)
      setSubmitted(true)
    } catch {
      setSubmitError('Could not submit your request. Please try again or call the advisory desk.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="bg-brand-charcoal text-white px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative overflow-hidden">
      {/* Subtle Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-green/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 border border-white/20 rounded-full backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
              DIRECT ADVISORY DESK
            </span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] text-white">
            Schedule Your Private VIP Site Tour.
          </h2>

          <p className="text-xs sm:text-base text-white/80 font-light leading-relaxed">
            Experience our demarcated township plots firsthand. Request a complimentary luxury AC cab pick-up, physical survey map review, and plot reservation consultation.
          </p>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#C9A96E] shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider block">Call Advisory Hotline</span>
                <a href={`tel:${SITE.phoneTel}`} className="text-sm font-bold text-white hover:text-[#C9A96E] transition-colors">{SITE.phoneDisplay}</a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider block">Official WhatsApp Desk</span>
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-400 hover:underline">{SITE.whatsappDisplay}</a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#C9A96E] shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider block">Official Advisory Desk</span>
                <span className="text-sm font-bold text-white">{SITE.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#C9A96E] shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider block">Corporate Office</span>
                <a href={SITE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white hover:text-[#C9A96E] transition-colors leading-tight block">
                  {SITE.address}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Interactive Form */}
        <div className="lg:col-span-7 bg-white text-brand-charcoal rounded-2xl p-6 sm:p-8 shadow-xl border border-brand-green/20">
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-brand-soft border border-brand-green/30 rounded-full flex items-center justify-center mx-auto text-brand-green">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-brand-charcoal">
                Site Tour Request Confirmed!
              </h3>
              <p className="text-xs sm:text-sm text-brand-charcoal/70 max-w-md mx-auto font-light leading-relaxed">
                Thank you <strong className="text-brand-charcoal font-semibold">{formData.fullName || 'Valued Investor'}</strong>. Your request for <strong className="text-brand-green">{formData.projectOfInterest}</strong> has been routed to our senior advisory manager. We will contact you within 15 minutes.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 bg-brand-green text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-dark transition-all cursor-pointer"
              >
                Book Another Tour
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {draftRestored && (
                <DraftNotice onDiscard={() => {
                  clearHomeDraft()
                  setFormData(HOME_CONTACT_DEFAULTS)
                  setDraftRestored(false)
                }} />
              )}
              <div className="space-y-1.5 pb-2 border-b border-brand-green/10">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-charcoal">
                  Book Site Visit & Plot Consultation
                </h3>
                <p className="text-xs text-brand-charcoal/60 font-medium">
                  Fill in your details below for instant callback & brochure dispatch.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="hs-contact-name" className="hs-label">Full Name <span className="hs-required">*</span></label>
                  <input
                    id="hs-contact-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="input-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="hs-contact-phone" className="hs-label">Mobile Number <span className="hs-required">*</span></label>
                  <input
                    id="hs-contact-phone"
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
                  <label htmlFor="hs-contact-email" className="hs-label">Email Address</label>
                  <input
                    id="hs-contact-email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email address"
                    className="input-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="hs-contact-project" className="hs-label">Target Project <span className="hs-required">*</span></label>
                  <select
                    id="hs-contact-project"
                    value={formData.projectOfInterest}
                    onChange={(e) => setFormData({ ...formData, projectOfInterest: e.target.value })}
                    className="input-base appearance-none cursor-pointer pr-10"
                  >
                    <option value="Dholera SIR Smart City Enclave">Dholera SIR Smart City Enclave</option>
                    <option value="Royal Palms Executive City - Noida">Royal Palms Executive City - Noida</option>
                    <option value="Emerald Crest Valley - Expressway">Emerald Crest Valley - Expressway</option>
                    <option value="Vrindavan Heritage Enclave">Vrindavan Heritage Enclave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="hs-contact-date" className="hs-label">Preferred Site Visit Date</label>
                  <input
                    id="hs-contact-date"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="hs-contact-prefs" className="hs-label">Specific Plot Preferences</label>
                  <input
                    id="hs-contact-prefs"
                    type="text"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="e.g. 200 sqyd, Corner plot, East facing"
                    className="input-base"
                  />
                </div>
              </div>

              {submitError ? (
                <p className="text-xs font-semibold text-red-600">{submitError}</p>
              ) : null}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hs-btn-primary w-full"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  {isSubmitting ? 'Submitting Request...' : 'Confirm VIP Site Visit Request'}
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-brand-charcoal/60 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                <span>Your information is 100% confidential. No spam guaranteed.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
