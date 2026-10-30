'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getApiBaseUrl } from '@/utils/api'
import { Search, UserPlus } from 'lucide-react'
import { PageSection } from '@/components/layout/PageSection'
import { DraftNotice } from '@/components/ui/DraftNotice'
import { useClientDraft } from '@/utils/useFormDraft'

const MIN_PASSWORD_LENGTH = 6

type ConfirmedSponsor = {
  sponsorName: string
  employeeCode: string
  currentRank: string
}

function looksLikeSponsorId(value: string) {
  const trimmed = value.trim()
  return trimmed.length >= 4 && trimmed.length <= 40 && /\d{3,}/.test(trimmed)
}

export default function JoinAgentLandingPage() {
  const params = useParams()
  const inviteCode = String(params?.code || '').trim().toUpperCase()
  const joinDefaults = { fullName: '', email: '', phone: '', sponsorCode: '' }
  const joinKey = `hs-public-join-${inviteCode || 'new'}`
  const joinDraft = useClientDraft(joinKey, joinDefaults)
  const fullName = joinDraft.value.fullName
  const setFullName = (next: string) => joinDraft.setValue((prev) => ({ ...prev, fullName: next }))
  const email = joinDraft.value.email
  const setEmail = (next: string) => joinDraft.setValue((prev) => ({ ...prev, email: next }))
  const phone = joinDraft.value.phone
  const setPhone = (next: string) => joinDraft.setValue((prev) => ({ ...prev, phone: next }))
  const sponsorCode = joinDraft.value.sponsorCode
  const setSponsorCode = (next: string) => joinDraft.setValue((prev) => ({ ...prev, sponsorCode: next }))
  const draftRestored = joinDraft.restored
  const setDraftRestored = joinDraft.setRestored
  const clearJoinDraft = joinDraft.clear
  const [password, setPassword] = React.useState('')
  const [confirmed, setConfirmed] = React.useState<ConfirmedSponsor | null>(null)
  const [lookupError, setLookupError] = React.useState('')
  const [lookingUp, setLookingUp] = React.useState(false)
  const [inviteNote, setInviteNote] = React.useState('')
  const [inviteSponsorCode, setInviteSponsorCode] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const sponsorTouched = React.useRef(false)
  const lookupSeq = React.useRef(0)
  const confirmedRef = React.useRef<ConfirmedSponsor | null>(null)

  const rememberSponsor = (next: ConfirmedSponsor | null) => {
    confirmedRef.current = next
    setConfirmed(next)
  }

  const typedMatchesConfirmed = (typed: string) => {
    const current = confirmedRef.current
    if (!current) return false
    const code = current.employeeCode.toUpperCase()
    const bare = code.replace(/^H&S-/, '')
    const value = typed.trim().toUpperCase().replace(/\s+/g, '')
    return value === code || value === bare || value === `H&S-${bare}` || value === `H&S${bare}`
  }

  const lookupSponsor = React.useCallback(async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) {
      rememberSponsor(null)
      setLookupError('Enter a sponsor ID.')
      return
    }
    const seq = lookupSeq.current + 1
    lookupSeq.current = seq
    setLookingUp(true)
    setLookupError('')
    try {
      const res = await fetch(`${getApiBaseUrl()}/public/sponsors/lookup?code=${encodeURIComponent(trimmed)}`)
      const data = await res.json().catch(() => ({}))
      if (lookupSeq.current !== seq) return
      if (!res.ok) {
        rememberSponsor(null)
        setLookupError(data.message || 'Sponsor ID not found.')
        return
      }
      rememberSponsor({
        sponsorName: data.sponsorName || 'House & Sky Agent',
        employeeCode: data.employeeCode || trimmed,
        currentRank: data.currentRank || '',
      })
    } catch {
      if (lookupSeq.current !== seq) return
      rememberSponsor(null)
      setLookupError('Could not look up that sponsor ID.')
    } finally {
      if (lookupSeq.current === seq) setLookingUp(false)
    }
  }, [])

  React.useEffect(() => {
    if (!joinDraft.hydrated || !inviteCode) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/public/agent-invite/${encodeURIComponent(inviteCode)}`)
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setInviteNote(data.message || 'This invite link is invalid. Enter a sponsor ID instead.')
          return
        }
        const code = String(data.employeeCode || '')
        setInviteSponsorCode(code)
        setInviteNote('')
        if (!sponsorTouched.current && !joinDraft.value.sponsorCode && code) {
          setSponsorCode(code)
        }
      } catch {
        if (!cancelled) setInviteNote('Could not verify this invite link. Enter a sponsor ID instead.')
      }
    }
    load()
    return () => { cancelled = true }
  }, [inviteCode, joinDraft.hydrated])

  React.useEffect(() => {
    if (!joinDraft.hydrated) return
    const code = sponsorCode.trim()
    if (typedMatchesConfirmed(code)) return
    rememberSponsor(null)
    if (!looksLikeSponsorId(code)) {
      lookupSeq.current += 1
      setLookupError('')
      setLookingUp(false)
      return
    }
    const timer = window.setTimeout(() => { lookupSponsor(code) }, 350)
    return () => window.clearTimeout(timer)
  }, [sponsorCode, joinDraft.hydrated, lookupSponsor])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!confirmed) {
      setError('Confirm a sponsor ID before joining.')
      return
    }
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
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          sponsorCode: confirmed.employeeCode,
          inviteCode: inviteCode || undefined,
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Could not create the account.')
        return
      }
      clearJoinDraft()
      setDraftRestored(false)
      const memberId = data.employeeCode ? ` Your member ID is ${data.employeeCode}.` : ''
      setSuccess(`${data.message || 'Account created. Wait for admin approval.'}${memberId}`)
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
          <p className="text-sm text-brand-charcoal/70 mt-2">
            Enter your sponsor&apos;s member ID. Their name appears before you create your account.
          </p>
        </div>

        {success ? (
          <p className="text-sm font-semibold text-emerald-800">{success}</p>
        ) : (
          <>
          {inviteNote ? <p className="text-sm font-semibold text-amber-800">{inviteNote}</p> : null}
          {draftRestored && (
            <DraftNotice onDiscard={() => {
              clearJoinDraft()
              setFullName('')
              setEmail('')
              setPhone('')
              sponsorTouched.current = false
              setSponsorCode(inviteSponsorCode)
              rememberSponsor(null)
              setLookupError('')
              setDraftRestored(false)
            }} />
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="join-sponsor" className="hs-label">Joining under <span className="hs-required">*</span></label>
              <div className="flex items-center gap-2">
                <input
                  id="join-sponsor"
                  value={sponsorCode}
                  onChange={(e) => {
                    sponsorTouched.current = true
                    setSponsorCode(e.target.value)
                  }}
                  placeholder="H&S-1001"
                  className="input-base flex-1"
                  autoComplete="off"
                />
                <button
                  type="button"
                  aria-label="Search sponsor"
                  onClick={() => lookupSponsor(sponsorCode)}
                  className="shrink-0 h-11 w-11 rounded-xl border border-brand-green/20 text-brand-green flex items-center justify-center hover:bg-brand-soft"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {lookingUp ? (
                <p className="text-xs text-brand-charcoal/60">Searching…</p>
              ) : confirmed ? (
                <p className="text-sm font-semibold text-brand-green">
                  {confirmed.sponsorName}
                  <span className="font-medium text-brand-charcoal/70"> · {confirmed.employeeCode}{confirmed.currentRank ? ` · ${confirmed.currentRank}` : ''}</span>
                </p>
              ) : lookupError ? (
                <p className="text-sm font-semibold text-red-700">{lookupError}</p>
              ) : (
                <p className="text-xs text-brand-charcoal/50">Type a member ID such as H&S-1001 or 1001.</p>
              )}
            </div>
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
            <button type="submit" disabled={isSubmitting || lookingUp || !confirmed} className="hs-btn-primary w-full disabled:opacity-60">
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Creating account…' : 'Create agent account'}
            </button>
          </form>
          <Link href="/" className="text-xs font-bold text-brand-green">Back home</Link>
          </>
        )}
      </div>
    </PageSection>
  )
}
