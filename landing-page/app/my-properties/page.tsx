'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getApiBaseUrl } from '@/utils/api'
import { useOwnerAuth } from '@/stores/auth.store'
import {
  Home, Plus, RefreshCw, LogOut, CheckCircle2, Clock, XCircle,
  ExternalLink, Building2, MapPin, IndianRupee, Calendar, ArrowRight, KeyRound, X
} from 'lucide-react'
import { HouseAndSkyLogo } from '@/components/layout/HouseAndSkyLogo'
import { PageSection } from '@/components/layout/PageSection'
import { FALLBACK_IMAGE } from '@/utils/siteConfig'

interface MyProperty {
  _id: string
  title: string
  slug?: string
  heroImage?: string
  gallery?: { url: string }[]
  propertyType: string
  listingType: string
  location?: string
  city?: string
  state?: string
  area?: string
  price?: number
  priceRange?: string
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  status?: string
  submittedAt?: string
  rejectionReason?: string
  createdAt?: string
}

const TYPE_LABEL: Record<string, string> = {
  RESIDENTIAL_PLOT: 'Residential Plot',
  COMMERCIAL: 'Commercial',
  VILLA: 'Villa',
  SHOWROOM: 'Showroom',
  APARTMENT: 'Apartment',
  LAND: 'Land'
}

const LISTING_LABEL: Record<string, string> = {
  SALE: 'For Sale',
  RENT: 'For Rent',
  LEASE: 'For Lease'
}

function formatPrice(price?: number, range?: string): string {
  if (range) return range
  if (!price) return 'Price on request'
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh`
  return `₹${price.toLocaleString('en-IN')}`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status?: string }) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
      </span>
    )
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-bold">
        <XCircle className="w-3.5 h-3.5" /> Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
      <Clock className="w-3.5 h-3.5" /> Pending Review
    </span>
  )
}

function StatusMessage({ property }: { property: MyProperty }) {
  const approval = property.approvalStatus

  if (approval === 'APPROVED') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs font-bold text-emerald-800">Your property is live on House & Sky!</p>
        </div>
        <p className="text-[11px] text-emerald-700">Your listing has been approved and is now visible to buyers and tenants.</p>
        {property.slug && (
          <Link
            href={`/properties/${property.slug}`}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> View Public Listing
          </Link>
        )}
      </div>
    )
  }

  if (approval === 'REJECTED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-xs font-bold text-red-800">Listing not approved</p>
        </div>
        {property.rejectionReason ? (
          <div>
            <p className="text-[11px] text-red-600 font-semibold">Reason:</p>
            <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">{property.rejectionReason}</p>
          </div>
        ) : (
          <p className="text-[11px] text-red-700">This listing was not approved. Please contact our team for details.</p>
        )}
        <Link
          href={`/list-your-property?resubmit=${property._id}`}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 hover:underline"
        >
          <ArrowRight className="w-3 h-3" /> Edit & Resubmit
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-xs font-bold text-amber-800">Pending Review</p>
      </div>
      <p className="text-[11px] text-amber-700">Your property has been submitted successfully. Our team is currently reviewing it. This typically takes 24–48 hours.</p>
    </div>
  )
}

const MIN_PASSWORD_LENGTH = 6

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { token, user, login } = useOwnerAuth()
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current password.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Could not change password.')
        return
      }
      // Old tokens are revoked server-side; keep this session alive with the fresh one.
      if (data.token && user) login(data.token, user)
      setSuccess(data.message || 'Password changed successfully.')
      setTimeout(onClose, 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl border border-brand-green/20">
        <div className="flex items-center justify-between border-b border-brand-green/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green text-white flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-charcoal">Change Password</h2>
              <p className="text-xs text-brand-charcoal/60">You&apos;ll be logged out on all other devices</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl bg-brand-soft text-brand-green cursor-pointer hover:bg-brand-green hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cp-current" className="hs-label">Current Password <span className="hs-required">*</span></label>
            <input id="cp-current" type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-base" />
          </div>
          <div>
            <label htmlFor="cp-new" className="hs-label">New Password <span className="hs-required">*</span></label>
            <input id="cp-new" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-base" />
          </div>
          <div>
            <label htmlFor="cp-confirm" className="hs-label">Confirm New Password <span className="hs-required">*</span></label>
            <input id="cp-confirm" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-base" />
          </div>
          {error && <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{success}</p>}
          <button
            type="submit"
            disabled={isSubmitting || Boolean(success)}
            className="w-full py-3 rounded-xl bg-brand-green text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function MyPropertiesPage() {
  const router = useRouter()
  const { isAuthenticated, user, token, logout } = useOwnerAuth()
  const [properties, setProperties] = React.useState<MyProperty[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [showChangePassword, setShowChangePassword] = React.useState(false)

  // Redirect if not logged in
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/owner-login?redirect=/my-properties')
    }
  }, [isAuthenticated, router])

  const load = React.useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${getApiBaseUrl()}/properties/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401) {
          logout()
          router.replace('/owner-login?redirect=/my-properties')
          return
        }
        setError(data.message || 'Failed to load properties')
        return
      }
      setProperties(Array.isArray(data.data) ? data.data : [])
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [token, logout, router])

  React.useEffect(() => {
    if (isAuthenticated && token) {
      load()
    }
  }, [isAuthenticated, token, load])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
        <p className="text-xs text-brand-charcoal/50 font-mono">Redirecting to login…</p>
      </div>
    )
  }

  // Summary counts
  const total = properties.length
  const pending = properties.filter((p) => !p.approvalStatus || p.approvalStatus === 'PENDING').length
  const approved = properties.filter((p) => p.approvalStatus === 'APPROVED').length
  const rejected = properties.filter((p) => p.approvalStatus === 'REJECTED').length

  return (
    <PageSection tone="white" innerClassName="max-w-5xl space-y-8">
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-green">Property Owner Portal</p>
          <h1 className="font-serif text-4xl font-semibold text-brand-charcoal">My Properties</h1>
          <p className="text-xs text-brand-charcoal/60">
            Welcome back, <span className="font-bold text-brand-charcoal">{user?.fullName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2.5 rounded-xl bg-brand-soft border border-brand-green/20 text-brand-green cursor-pointer hover:bg-brand-green hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowChangePassword(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-brand-green/20 text-brand-charcoal/70 text-xs font-bold cursor-pointer hover:bg-brand-soft hover:text-brand-green transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change Password</span>
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-brand-green/20 text-brand-charcoal/70 text-xs font-bold cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: total, color: 'bg-brand-soft text-brand-green border-brand-green/20', icon: Building2 },
          { label: 'Pending', count: pending, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
          { label: 'Approved', count: approved, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
          { label: 'Rejected', count: rejected, color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
            <Icon className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-extrabold text-2xl leading-none">{count}</p>
              <p className="text-[11px] font-semibold mt-0.5 opacity-80">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCw className="w-6 h-6 text-brand-green/40 animate-spin mx-auto" />
          <p className="text-xs text-brand-charcoal/40 mt-3 font-mono">Loading your properties…</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && properties.length === 0 && (
        <div className="bg-white border border-brand-green/15 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto">
            <Home className="w-7 h-7 text-brand-green" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-brand-charcoal">No listings yet</h3>
            <p className="text-xs text-brand-charcoal/60">You haven&apos;t listed any properties yet. It&apos;s free and takes just a few minutes.</p>
          </div>
          <Link
            href="/list-your-property"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            List Your First Property
          </Link>
        </div>
      )}

      {/* Property cards */}
      {!isLoading && properties.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-brand-charcoal">Your Listings</h2>
            <Link
              href="/list-your-property"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-dark transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> List Another
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {properties.map((property) => {
              const heroImg = property.heroImage || property.gallery?.[0]?.url || FALLBACK_IMAGE
              const locationStr = [property.area, property.city, property.state].filter(Boolean).join(', ')

              return (
                <article key={property._id} className="bg-white border border-brand-green/10 rounded-3xl overflow-hidden shadow-sm">
                  {/* Image */}
                  <div className="h-44 relative overflow-hidden bg-brand-soft">
                    <img
                      src={heroImg}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE }}
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-white/95 text-[10px] font-extrabold text-brand-charcoal">
                        {TYPE_LABEL[property.propertyType] || property.propertyType}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-brand-green/90 text-[10px] font-extrabold text-white">
                        {LISTING_LABEL[property.listingType] || property.listingType}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={property.approvalStatus} />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-serif font-bold text-brand-charcoal leading-snug line-clamp-2">{property.title}</h3>

                    {locationStr && (
                      <p className="text-xs text-brand-charcoal/60 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-green shrink-0" />
                        {locationStr}
                      </p>
                    )}

                    <p className="text-sm font-extrabold text-brand-green flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {formatPrice(property.price, property.priceRange).replace('₹', '')}
                    </p>

                    <p className="text-[11px] text-brand-charcoal/40 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Submitted {formatDate(property.submittedAt || property.createdAt)}
                    </p>

                    <StatusMessage property={property} />
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </PageSection>
  )
}
