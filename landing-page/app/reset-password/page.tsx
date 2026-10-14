'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { getApiBaseUrl } from '@/utils/api'
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'
import { HouseAndSkyLogo } from '@/components/layout/HouseAndSkyLogo'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [isSuccess, setIsSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Missing reset token. Please use the reset link sent to your email.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken: token, newPassword })
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.message || 'Failed to reset password. Link may be expired.')
        return
      }

      setIsSuccess(true)
    } catch {
      setError('Network error. Please try again later.')
    } finally {
      setIsSubmitting(false)
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
          {isSuccess ? (
            <div className="py-6 space-y-4 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="font-serif text-3xl font-semibold text-brand-charcoal">Password Reset Successful!</h1>
              <p className="text-xs text-brand-charcoal/70">
                Your password has been updated. You can now log in with your new password.
              </p>
              <Link
                href="/owner-login"
                className="w-full py-3 rounded-xl bg-brand-green text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors mt-4"
              >
                <span>Login to Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-green">Security</p>
                <h1 className="font-serif text-3xl font-semibold text-brand-charcoal">Set New Password</h1>
                <p className="text-xs text-brand-charcoal/60">Create a new password for your account</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reset-new" className="hs-label">New Password <span className="hs-required">*</span></label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-brand-charcoal/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reset-new"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="input-base pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/30 hover:text-brand-charcoal/60 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reset-confirm" className="hs-label">Confirm New Password <span className="hs-required">*</span></label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-brand-charcoal/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reset-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="input-base pl-10 pr-10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hs-btn-primary w-full mt-2"
                >
                  {isSubmitting ? 'Updating Password…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p className="text-xs text-brand-charcoal/50">Loading…</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
