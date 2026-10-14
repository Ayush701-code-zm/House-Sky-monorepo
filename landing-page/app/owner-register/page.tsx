'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { getApiBaseUrl } from '@/utils/api'
import { scrollToFirstFormIssue } from '@/utils/scroll'
import { Eye, EyeOff, UserPlus, Lock, Mail, Phone, User, CheckCircle2, ArrowRight } from 'lucide-react'
import { HouseAndSkyLogo } from '@/components/layout/HouseAndSkyLogo'

const MIN_PASSWORD_LENGTH = 6

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/[\s\-+]/g, ''))
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/list-your-property'

  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [isRegisteredSuccess, setIsRegisteredSuccess] = React.useState(false)
  const [registeredEmail, setRegisteredEmail] = React.useState('')

  const validate = () => {
    const errors: Record<string, string> = {}

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.'
    }
    if (!email.trim() || !validateEmail(email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }
    if (!phone.trim() || !validatePhone(phone.trim())) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number.'
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    setFieldErrors(errors)
    const ok = Object.keys(errors).length === 0
    if (!ok) {
      window.setTimeout(() => scrollToFirstFormIssue(), 80)
    }
    return ok
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/register-property-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password
        })
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.message || 'Could not create account. Please try again.')
        return
      }

      setRegisteredEmail(email.trim().toLowerCase())
      setIsRegisteredSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = (field: string) =>
    `input-base ${fieldErrors[field] ? 'hs-input-error' : ''}`

  return (
    <div className="py-6 sm:py-10 px-4 bg-bg-primary min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
      <div className="w-full max-w-md my-auto">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Link href="/">
            <HouseAndSkyLogo variant="dark" showTagline={false} size="sm" />
          </Link>
        </div>

        <div className="hs-form-card space-y-6">
          {isRegisteredSuccess ? (
            <div className="py-6 space-y-4 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-brand-charcoal">Verification Email Sent!</h1>
              <p className="text-xs text-brand-charcoal/70 leading-relaxed">
                Thank you for registering. We have sent a verification email to <strong className="text-brand-green font-bold">{registeredEmail}</strong>.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-1">
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-600" /> Action Required:
                </p>
                <p className="text-[11px] text-emerald-700 font-medium leading-normal">
                  Please open your inbox and click the <strong>&quot;Verify Email Address&quot;</strong> link before logging in to your account.
                </p>
              </div>

              <Link
                href={`/owner-login${redirectTo !== '/list-your-property' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                className="w-full py-3.5 rounded-xl bg-brand-green text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors mt-4"
              >
                <span>Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-green">Property Owner Portal</p>
                <h1 className="font-serif text-4xl font-semibold text-brand-charcoal">Create Account</h1>
                <p className="text-xs text-brand-charcoal/60 font-medium">List and manage your properties with House & Sky</p>
              </div>

              {error && (
                <div className="hs-error-message">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="hs-reg-name" className="hs-label">Full Name <span className="hs-required">*</span></label>
                  <div className="relative">
                    <User className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="hs-reg-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, fullName: '' })) }}
                      placeholder="Your full name"
                      className={`${inputClass('fullName')} pl-10 pr-4`}
                    />
                  </div>
                  {fieldErrors.fullName && <p className="hs-field-error">{fieldErrors.fullName}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="hs-reg-email" className="hs-label">Email Address <span className="hs-required">*</span></label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="hs-reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })) }}
                      placeholder="you@example.com"
                      className={`${inputClass('email')} pl-10 pr-4`}
                    />
                  </div>
                  {fieldErrors.email && <p className="hs-field-error">{fieldErrors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label htmlFor="hs-reg-phone" className="hs-label">Mobile Number <span className="hs-required">*</span></label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="hs-reg-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: '' })) }}
                      placeholder="10-digit mobile number"
                      className={`${inputClass('phone')} pl-10 pr-4`}
                    />
                  </div>
                  {fieldErrors.phone && <p className="hs-field-error">{fieldErrors.phone}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="hs-reg-password" className="hs-label">Password <span className="hs-required">*</span></label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="hs-reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD_LENGTH}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })) }}
                      placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
                      className={`${inputClass('password')} pl-10 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/30 hover:text-brand-charcoal/60"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="hs-field-error">{fieldErrors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label htmlFor="hs-reg-confirm" className="hs-label">Confirm Password <span className="hs-required">*</span></label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="hs-reg-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })) }}
                      placeholder="Re-enter your password"
                      className={`${inputClass('confirmPassword')} pl-10 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/30 hover:text-brand-charcoal/60"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <p className="hs-field-error">{fieldErrors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hs-btn-primary w-full"
                >
                  <UserPlus className="w-4 h-4" />
                  {isSubmitting ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <div className="pt-2 border-t border-brand-green/10 text-center">
                <p className="text-xs text-brand-charcoal/60">
                  Already have an account?{' '}
                  <Link
                    href={`/owner-login${redirectTo !== '/list-your-property' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                    className="text-brand-green font-bold hover:underline"
                  >
                    Login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-brand-charcoal/40 mt-4">
          Your account is for listing properties only. It does not grant access to the admin panel.
        </p>
      </div>
    </div>
  )
}

export default function OwnerRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p className="text-xs text-brand-charcoal/50">Loading…</p></div>}>
      <RegisterContent />
    </Suspense>
  )
}
