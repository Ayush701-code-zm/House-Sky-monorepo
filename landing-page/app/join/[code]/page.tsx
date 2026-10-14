'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getApiBaseUrl } from '@/utils/api'
import { UserPlus } from 'lucide-react'
import { PageSection } from '@/components/layout/PageSection'

const MIN_PASSWORD_LENGTH = 6

export default function JoinAgentLandingPage() {
  const params = useParams()
  const inviteCode = String(params?.code || '').trim().toUpperCase()
  const [sponsorName, setSponsorName] = React.useState('')
  const [employeeCode, setEmployeeCode] = React.useState('')
  const [isLoadingSponsor, setIsLoadingSponsor] = React.useState(true)
  const [sponsorError, setSponsorError] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  React.useEffect(() => {
    const load = async () => {
      if (!inviteCode) {
        setSponsorError('Invite code is missing.')
        setIsLoadingSponsor(false)
        return
      }
      try {
        const res = await fetch(`${getApiBaseUrl()}/public/agent-invite/${encodeURIComponent(inviteCode)}`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setSponsorError(data.message || 'This invite link is invalid.')
          return
        }
        setSponsorName(data.sponsorName || '')
        setEmployeeCode(data.employeeCode || '')
      } catch {
        setSponsorError('Could not verify this invite link.')
      } finally {
        setIsLoadingSponsor(false)
      }
    }
    load()
  }, [inviteCode])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    // The form uses noValidate, and the backend falls back to a default
    // password when none is sent — so enforce the required fields here.
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Full name, email and phone are required.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/public/agent-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password, inviteCode })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Could not create the account.')
        return
      }
      setSuccess(data.message || 'Account created. Wait for admin approval.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageSection tone="muted">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-brand-green/15 p-6 sm:p-8 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-bold text-brand-green">Agent invite</p>
          <h1 className="font-serif text-4xl font-semibold text-brand-charcoal mt-1">Join House & Sky</h1>
          {sponsorName ? (
            <p className="text-sm text-brand-charcoal/70 mt-2">
              You will join under <span className="font-bold text-brand-green">{sponsorName}</span>
              {employeeCode ? ` (${employeeCode})` : ''}
            </p>
          ) : null}
        </div>

        {isLoadingSponsor ? (
          <p className="text-xs text-brand-charcoal/60">Checking invite link…</p>
        ) : sponsorError ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-red-700">{sponsorError}</p>
            <Link href="/" className="text-xs font-bold text-brand-green">Back home</Link>
          </div>
        ) : success ? (
          <p className="text-sm font-semibold text-emerald-800">{success}</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="join-name" className="hs-label">Full name <span className="hs-required">*</span></label>
              <input id="join-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-base" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="join-email" className="hs-label">Email <span className="hs-required">*</span></label>
              <input id="join-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="join-phone" className="hs-label">Phone <span className="hs-required">*</span></label>
              <input id="join-phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-base" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="join-password" className="hs-label">Password <span className="hs-required">*</span></label>
              <input id="join-password" required type="password" minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" />
            </div>
            {error ? <p className="hs-field-error">{error}</p> : null}
            <button type="submit" disabled={isSubmitting} className="hs-btn-primary w-full">
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Creating account…' : 'Create agent account'}
            </button>
          </form>
        )}
      </div>
    </PageSection>
  )
}
