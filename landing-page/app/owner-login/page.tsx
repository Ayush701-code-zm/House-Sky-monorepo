'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { getApiBaseUrl } from '@/utils/api'
import { useOwnerAuth } from '@/stores/auth.store'
import { Eye, EyeOff, LogIn, Lock, Mail, X, Send, AlertCircle } from 'lucide-react'
import { HouseAndSkyLogo } from '@/components/layout/HouseAndSkyLogo'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Only allow same-site relative paths to avoid an open redirect (e.g. ?redirect=https://evil.com)
  const rawRedirect = searchParams.get('redirect')
  const redirectTo = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/\\')
    ? rawRedirect
    : '/my-properties'
  const { login, isAuthenticated } = useOwnerAuth()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<string | null>(null)

  // Resend verification
  const [isResending, setIsResending] = React.useState(false)
  const [resendMsg, setResendMsg] = React.useState('')

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = React.useState(false)
  const [forgotEmail, setForgotEmail] = React.useState('')
  const [isSendingForgot, setIsSendingForgot] = React.useState(false)
  const [forgotFeedback, setForgotFeedback] = React.useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, redirectTo, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUnverifiedEmail(null)
    setResendMsg('')

    const emailTrimmed = email.trim().toLowerCase()
    if (!emailTrimmed || !password) {
      setError('Email or Mobile number and password are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrimmed, password })
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (data.isVerified === false) {
          setUnverifiedEmail(data.email || emailTrimmed)
        }
        setError(data.message || 'Invalid email or password.')
        return
      }

      if (!data.token || !data.user) {
        setError('Login failed. Please try again.')
        return
      }

      // Only allow PROPERTY_OWNER role to login via this portal
      if (data.user.role !== 'PROPERTY_OWNER') {
        setError('This portal is for property owners only. Admin/staff should use the admin panel.')
        return
      }

      login(data.token, {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role
      })

      router.replace(redirectTo)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || email.trim().toLowerCase()
    if (!targetEmail) return

    setIsResending(true)
    setResendMsg('')
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      })
      const data = await res.json().catch(() => ({}))
      setResendMsg(data.message || 'Verification link sent! Check your email.')
    } catch {
      setResendMsg('Failed to send verification link.')
    } finally {
      setIsResending(false)
    }
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return

    setIsSendingForgot(true)
    setForgotFeedback(null)
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setForgotFeedback({ type: 'success', msg: data.message || 'Password reset link sent to your email!' })
      } else {
        setForgotFeedback({ type: 'error', msg: data.message || 'Failed to send password reset email.' })
      }
    } catch {
      setForgotFeedback({ type: 'error', msg: 'Network error. Please try again.' })
    } finally {
      setIsSendingForgot(false)
    }
  }

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
          {/* Header */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-green">Property Owner Portal</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-brand-charcoal">Welcome back</h1>
            <p className="text-xs text-brand-charcoal/60 font-medium">Login to manage your property listings</p>
          </div>

          {/* Error */}
          {error && (
            <div className="hs-error-message">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div className="space-y-2 flex-1">
                <p>{error}</p>
                {unverifiedEmail && (
                  <div className="pt-2 border-t border-red-200">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isResending ? 'Sending Verification Link…' : 'Resend Verification Email'}
                    </button>
                    {resendMsg && (
                      <p className="mt-2 text-[11px] font-bold text-brand-green text-center bg-white p-2 rounded-lg border border-brand-green/20">
                        {resendMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="hs-login-email" className="hs-label">Email Address or Mobile Number <span className="hs-required">*</span></label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="hs-login-email"
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com or 10-digit mobile"
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="hs-login-password" className="hs-label !mb-0">Password <span className="hs-required">*</span></label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotFeedback(null)
                    setShowForgotModal(true)
                  }}
                  className="text-[11px] font-bold text-brand-green hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="hs-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="input-base pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/30 hover:text-brand-charcoal/60 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="hs-btn-primary w-full"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Logging in…' : 'Login to my account'}
            </button>
          </form>

          {/* Footer links */}
          <div className="pt-2 border-t border-brand-green/10 text-center space-y-2">
            <p className="text-xs text-brand-charcoal/60">
              Don&apos;t have an account?{' '}
              <Link
                href={`/owner-register${redirectTo !== '/my-properties' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                className="text-brand-green font-bold hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-brand-green/20 shadow-2xl p-6 w-full max-w-sm space-y-4 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-brand-charcoal/40 hover:text-brand-charcoal hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-brand-charcoal">Reset Password</h3>
              <p className="text-xs text-brand-charcoal/60">
                Enter your registered email address to receive password reset instructions.
              </p>
            </div>

            {forgotFeedback?.type === 'success' ? (
              <div className="py-4 space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                  <Send className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">Reset Link Sent!</h4>
                  <p className="text-xs text-slate-600 font-medium">
                    {forgotFeedback.msg}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false)
                    setForgotFeedback(null)
                  }}
                  className="w-full py-2.5 rounded-xl bg-brand-green text-white font-bold text-xs shadow-sm hover:bg-brand-dark transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <>
                {forgotFeedback && (
                  <div className="p-3 rounded-xl text-xs font-bold text-center border bg-red-50 text-red-600 border-red-200">
                    {forgotFeedback.msg}
                  </div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="hs-forgot-email" className="hs-label">Email Address <span className="hs-required">*</span></label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="hs-forgot-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="input-base pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingForgot}
                      className="w-1/2 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingForgot ? 'Sending…' : 'Send Link'}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p className="text-xs text-brand-charcoal/50">Loading…</p></div>}>
      <LoginContent />
    </Suspense>
  )
}
