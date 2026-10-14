'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { getApiBaseUrl } from '@/utils/api'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { HouseAndSkyLogo } from '@/components/layout/HouseAndSkyLogo'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = React.useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING')
  const [message, setMessage] = React.useState<string>('Verifying your email address...')
  // Tokens are single-use: guard against StrictMode's double effect run, where the
  // second request fails and overwrites the success state with an error.
  const verifiedTokenRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!token) {
      setStatus('ERROR')
      setMessage('Invalid verification link. No verification token was provided.')
      return
    }
    if (verifiedTokenRef.current === token) return
    verifiedTokenRef.current = token

    const verify = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        const data = await res.json().catch(() => ({}))

        if (res.ok && data.success) {
          setStatus('SUCCESS')
          setMessage(data.message || 'Email verified successfully!')
        } else {
          setStatus('ERROR')
          setMessage(data.message || 'Invalid or expired verification link.')
        }
      } catch {
        setStatus('ERROR')
        setMessage('Network error. Please try again later.')
      }
    }

    verify()
  }, [token])

  return (
    <div className="py-6 sm:py-10 px-4 bg-bg-primary min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
      <div className="w-full max-w-md my-auto text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Link href="/">
            <HouseAndSkyLogo variant="dark" showTagline={false} size="sm" />
          </Link>
        </div>

        <div className="hs-form-card space-y-6">
          {status === 'LOADING' && (
            <div className="py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-brand-green animate-spin mx-auto" />
              <p className="text-xs font-semibold text-brand-charcoal/70">{message}</p>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="font-serif text-3xl font-semibold text-brand-charcoal">Email Verified!</h1>
              <p className="text-xs text-brand-charcoal/70 leading-relaxed">{message}</p>
              <Link
                href="/owner-login"
                className="w-full py-3 rounded-xl bg-brand-green text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors mt-4"
              >
                <span>Login to Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-200">
                <XCircle className="w-10 h-10" />
              </div>
              <h1 className="font-serif text-3xl font-semibold text-brand-charcoal">Verification Failed</h1>
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-xl border border-red-100">{message}</p>
              <Link
                href="/owner-login"
                className="w-full py-3 rounded-xl bg-brand-green text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors mt-4"
              >
                <span>Back to Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p className="text-xs text-brand-charcoal/50">Loading…</p></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
