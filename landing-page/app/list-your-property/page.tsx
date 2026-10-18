'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getApiBaseUrl } from '@/utils/api'
import { scrollToFirstFormIssue } from '@/utils/scroll'
import { useOwnerAuth } from '@/stores/auth.store'
import {
  Home, MapPin, IndianRupee, Camera, CheckCircle2,
  ChevronRight, ChevronLeft, LogIn, UserPlus, Upload, X, Loader2,
  Phone, Mail, Building2, BedDouble, Bath, Car, ShieldCheck,
  FileText, Sparkles, AlertCircle, Eye, Check, Info, Lock
} from 'lucide-react'

// --- Option sets & Constants ---
const PROPERTY_TYPE_OPTIONS: { label: string; value: string; desc: string; icon: string }[] = [
  { label: 'Apartment / Flat', value: 'APARTMENT', desc: 'Modern living in multi-story residential complexes', icon: '🏢' },
  { label: 'Studio Apartment', value: 'STUDIO_APARTMENT', desc: 'Compact single-room living space with kitchen & bath', icon: '🛋️' },
  { label: 'Villa / Independent House', value: 'VILLA', desc: 'Luxury standalone homes with private land', icon: '🏡' },
  { label: 'Residential Plot', value: 'RESIDENTIAL_PLOT', desc: 'Approved housing land ready for construction', icon: '📐' },
  { label: 'Commercial Space', value: 'COMMERCIAL', desc: 'Offices, retail hubs & business plazas', icon: '🏙️' },
  { label: 'Showroom / Shop', value: 'SHOWROOM', desc: 'Prime street-facing retail units', icon: '🏬' },
  { label: 'Land / Agricultural', value: 'LAND', desc: 'Farmland, agricultural plots & raw land', icon: '🌾' },
]

const LISTING_TYPE_OPTIONS = [
  { label: 'For Sale', value: 'SALE', badge: 'Direct Sale', desc: 'Sell your property to verified buyers' },
  { label: 'For Rent', value: 'RENT', badge: 'Monthly Rent', desc: 'Lease out monthly to prospective tenants' },
  { label: 'For Lease', value: 'LEASE', badge: 'Long-term Lease', desc: 'Commercial or long-duration residential lease' },
]

const FURNISHING_OPTIONS = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished']
const FACING_OPTIONS = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West']

const COMMON_AMENITIES = [
  'Car Parking', '24x7 Power Backup', '3-Tier Security', 'High-speed Elevator',
  'Swimming Pool', 'Gym & Fitness Center', 'Landscaped Garden', 'Clubhouse',
  'CCTV Surveillance', 'Children Play Zone', '24x7 Water Supply', 'Servant Quarters',
  'EV Charging Station', 'Intercom Facility', 'Fire Safety Systems'
]

const ID_TYPE_OPTIONS = [
  { label: 'PAN Card (Permanent Account Number)', value: 'PAN' },
  { label: 'Aadhaar Card', value: 'AADHAAR' },
  { label: 'Passport', value: 'PASSPORT' },
  { label: 'Voter ID Card', value: 'VOTER_ID' },
  { label: 'Driving License', value: 'DRIVING_LICENSE' },
]

const OWNERSHIP_TYPE_OPTIONS = [
  { label: 'Sole Individual Owner', value: 'OWNER' },
  { label: 'Joint / Co-Owner', value: 'JOINT_OWNER' },
  { label: 'Authorized Agent (Power of Attorney)', value: 'AGENT_POA' },
  { label: 'Builder / Commercial Developer', value: 'BUILDER' },
]

interface KycState {
  fullName: string
  idType: string
  idNumber: string
  idDocumentUrl: string
  idDocumentS3Key: string
  ownershipType: string
  ownershipDocumentUrl: string
  ownershipDocumentS3Key: string
  propertyTaxId: string
  declarationSigned: boolean
}

interface FormState {
  displayType: string
  propertyType: string
  listingType: string
  title: string
  tagline: string
  description: string
  state: string
  city: string
  area: string
  address: string
  pincode: string
  googleMapsUrl: string
  latitude: string
  longitude: string
  areaSqft: string
  bedrooms: string
  bathrooms: string
  parkingSpaces: string
  floor: string
  totalFloors: string
  facing: string
  furnishing: string
  amenities: string[]
  price: string
  priceRange: string
  isNegotiable: boolean
  monthlyRent: string
  securityDeposit: string
  contactPhone: string
  contactEmail: string
  heroImage: string
  gallery: { url: string; s3Key: string }[]
  kyc: KycState
}

const EMPTY_FORM: FormState = {
  displayType: 'Apartment / Flat',
  propertyType: 'APARTMENT',
  listingType: 'SALE',
  title: '',
  tagline: '',
  description: '',
  state: '',
  city: '',
  area: '',
  address: '',
  pincode: '',
  googleMapsUrl: '',
  latitude: '',
  longitude: '',
  areaSqft: '',
  bedrooms: '2',
  bathrooms: '2',
  parkingSpaces: '1',
  floor: '',
  totalFloors: '',
  facing: 'North-East',
  furnishing: 'Semi-Furnished',
  amenities: ['Car Parking', '24x7 Power Backup', '3-Tier Security'],
  price: '',
  priceRange: '',
  isNegotiable: true,
  monthlyRent: '',
  securityDeposit: '',
  contactPhone: '',
  contactEmail: '',
  heroImage: '',
  gallery: [],
  kyc: {
    fullName: '',
    idType: 'PAN',
    idNumber: '',
    idDocumentUrl: '',
    idDocumentS3Key: '',
    ownershipType: 'OWNER',
    ownershipDocumentUrl: '',
    ownershipDocumentS3Key: '',
    propertyTaxId: '',
    declarationSigned: false
  }
}

const WIZARD_STEPS = [
  { id: 1, name: 'Overview', icon: Home, short: 'Type & Purpose' },
  { id: 2, name: 'Location', icon: MapPin, short: 'Address & City' },
  { id: 3, name: 'Specs', icon: Building2, short: 'Area & Amenities' },
  { id: 4, name: 'Pricing', icon: IndianRupee, short: 'Price & Contact' },
  { id: 5, name: 'Photos', icon: Camera, short: 'Gallery Upload' },
  { id: 6, name: 'KYC & Legal', icon: ShieldCheck, short: 'ID & Title Deed' },
  { id: 7, name: 'Review', icon: CheckCircle2, short: 'Final Submit' }
]

// --- Auth Gate ---
function AuthGate() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/90 backdrop-blur-xl border border-brand-green/20 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-green/10 via-brand-green/20 to-amber-500/10 border border-brand-green/20 flex items-center justify-center mx-auto shadow-inner">
          <Home className="w-10 h-10 text-brand-green" />
        </div>
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-soft border border-brand-green/15 text-[10px] uppercase tracking-[0.2em] font-extrabold text-brand-green">
            Property Portal
          </span>
          <h1 className="font-serif text-4xl font-semibold text-brand-charcoal">List Your Property</h1>
          <p className="text-xs text-brand-charcoal/70 leading-relaxed max-w-md mx-auto">
            Please login or register to complete mandatory Seller & Property KYC verification and showcase your property to buyers and tenants.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/owner-register?redirect=/list-your-property"
            className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-brand-green text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-dark transition-all shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Create Free Account
          </Link>
          <Link
            href="/owner-login?redirect=/list-your-property"
            className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl border border-brand-green/25 bg-white text-brand-charcoal text-xs font-bold uppercase tracking-wider hover:bg-brand-soft transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4 text-brand-green" />
            Login to Existing Account
          </Link>
        </div>

        <div className="pt-2 border-t border-brand-green/10 flex items-center justify-center gap-4 text-[10px] text-brand-charcoal/50 font-semibold">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-brand-green" /> Verified KYC Security</span>
          <span>•</span>
          <span>Direct Owner Listing</span>
        </div>
      </motion.div>
    </div>
  )
}

// --- Success Screen ---
function SuccessScreen({ referenceId }: { referenceId: string }) {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] uppercase tracking-[0.2em] font-extrabold">
            Submission Received
          </span>
          <h2 className="font-serif text-4xl font-semibold text-brand-charcoal">Property Submitted!</h2>
          <p className="text-xs text-brand-charcoal/70 leading-relaxed">
            Your property and KYC documents have been securely uploaded. Our review team will verify your title deed and publish the listing within 24 hours.
          </p>
        </div>

        <div className="bg-gradient-to-br from-brand-soft to-emerald-50/50 rounded-2xl p-5 border border-brand-green/15 text-left space-y-1">
          <p className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-brand-green">Listing Reference Code</p>
          <p className="font-mono font-extrabold text-2xl text-brand-charcoal">{referenceId}</p>
          <p className="text-[11px] text-brand-charcoal/50">KYC Status: <span className="font-bold text-emerald-700">Verification Pending</span></p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/my-properties"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-green text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-dark transition-colors shadow-sm"
          >
            View My Properties
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-brand-green/20 text-brand-charcoal text-xs font-bold uppercase tracking-wider hover:bg-brand-soft transition-colors"
          >
            List Another Property
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// --- Universal File/Document Uploader ---
function SingleDocUploader({
  label,
  description,
  accept = "image/*,application/pdf",
  currentUrl,
  onUpload
}: {
  label: string
  description: string
  accept?: string
  currentUrl: string
  onUpload: (url: string, s3Key: string) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState('')
  const baseUrl = getApiBaseUrl()
  const { token } = useOwnerAuth()

  const handleFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit')
      return
    }
    if (!token) {
      setError('Please log in again to upload files')
      return
    }
    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'kyc-documents')

      const res = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        onUpload(data.url, data.s3Key || '')
      } else {
        setError(data.message || 'Upload failed. Please try again.')
      }
    } catch {
      setError('Network error uploading document')
    } finally {
      setUploading(false)
    }
  }

  const isPdf = currentUrl.toLowerCase().endsWith('.pdf')

  return (
    <div className="space-y-1.5">
      <label className="hs-label">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
          currentUrl
            ? 'border-emerald-500/40 bg-emerald-50/40 hover:bg-emerald-50/70'
            : 'border-brand-green/20 bg-[#FDFCF0] hover:border-brand-green hover:bg-brand-soft/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {uploading ? (
          <div className="py-2 flex flex-col items-center gap-1.5 text-brand-green">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold">Uploading proof document…</span>
          </div>
        ) : currentUrl ? (
          <div className="flex items-center gap-3 w-full justify-between px-2">
            <div className="flex items-center gap-2 text-emerald-800 text-left overflow-hidden">
              <FileText className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold truncate">{label} Uploaded</p>
                <p className="text-[10px] text-emerald-600 font-mono truncate">{currentUrl.split('/').pop()}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-bold shrink-0">
              Uploaded ✓
            </span>
          </div>
        ) : (
          <div className="space-y-1 py-1">
            <Upload className="w-6 h-6 text-brand-green/60 mx-auto" />
            <p className="text-xs font-bold text-brand-charcoal">Click to upload document proof</p>
            <p className="text-[10px] text-brand-charcoal/50">{description} · JPG, PNG, PDF (Max 50MB)</p>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  )
}

// --- Main Page Component ---
export default function ListPropertyPage() {
  const router = useRouter()
  const { isAuthenticated, user, token } = useOwnerAuth()
  const [form, setForm] = React.useState<FormState>({ ...EMPTY_FORM })
  const [step, setStep] = React.useState<number>(1)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState('')
  const [successRefId, setSuccessRefId] = React.useState('')
  const [showLivePreview, setShowLivePreview] = React.useState(false)

  // Auto pre-fill user info
  React.useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        contactPhone: prev.contactPhone || user.phone || '',
        contactEmail: prev.contactEmail || user.email || '',
        kyc: {
          ...prev.kyc,
          fullName: prev.kyc.fullName || user.fullName || ''
        }
      }))
    }
  }, [user])

  if (!isAuthenticated) return <AuthGate />
  if (successRefId) return <SuccessScreen referenceId={successRefId} />

  const update = (key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const updateKyc = (key: keyof KycState, value: any) => {
    setForm((prev) => ({
      ...prev,
      kyc: { ...prev.kyc, [key]: value }
    }))
    setFieldErrors((prev) => ({ ...prev, [`kyc.${key}`]: '' }))
  }

  const toggleAmenity = (item: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter((a) => a !== item)
        : [...prev.amenities, item]
    }))
  }

  const isRent = form.listingType === 'RENT' || form.listingType === 'LEASE'
  const showBedBath = ['APARTMENT', 'STUDIO_APARTMENT', 'VILLA'].includes(form.propertyType)
  const showFloor = ['APARTMENT', 'STUDIO_APARTMENT', 'COMMERCIAL', 'SHOWROOM'].includes(form.propertyType)

  // Step Validation logic
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!form.displayType) errors.displayType = 'Property type is required.'
      if (!form.title.trim() || form.title.trim().length < 4) errors.title = 'Title must be at least 4 characters.'
    } else if (currentStep === 2) {
      if (!form.city.trim()) errors.city = 'City is required.'
      if (!form.area.trim()) errors.area = 'Locality / Area is required.'
    } else if (currentStep === 3) {
      if (!form.areaSqft || Number(form.areaSqft) <= 0) errors.areaSqft = 'Valid area in sq.ft is required.'
    } else if (currentStep === 4) {
      if (isRent && (!form.monthlyRent || Number(form.monthlyRent) <= 0)) errors.monthlyRent = 'Monthly rent amount is required.'
      if (!isRent && (!form.price || Number(form.price) <= 0)) errors.price = 'Expected price amount is required.'
      if (!form.contactPhone.trim() || form.contactPhone.trim().length < 8) errors.contactPhone = 'Valid 10-digit phone number is required.'
    } else if (currentStep === 6) {
      if (!form.kyc.fullName.trim()) errors['kyc.fullName'] = 'Legal full name is required for KYC.'
      if (!form.kyc.idNumber.trim()) errors['kyc.idNumber'] = 'Government ID number is required.'
      if (!form.kyc.idDocumentUrl) errors['kyc.idDocumentUrl'] = 'Please upload a photo of your Government ID proof.'
      if (!form.kyc.ownershipDocumentUrl) errors['kyc.ownershipDocumentUrl'] = 'Please upload your property title deed or registry copy.'
      if (!form.kyc.declarationSigned) errors['kyc.declarationSigned'] = 'You must accept the legal owner declaration to proceed.'
    }

    setFieldErrors(errors)
    const ok = Object.keys(errors).length === 0
    if (!ok) {
      window.setTimeout(() => scrollToFirstFormIssue(), 80)
    }
    return ok
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length))
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSubmitError('')

    if (!validateStep(6)) {
      setStep(6)
      window.setTimeout(() => scrollToFirstFormIssue(), 120)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        propertyType: form.propertyType,
        listingType: form.listingType,
        location: [form.area, form.city].filter(Boolean).join(', '),
        city: form.city.trim(),
        state: form.state.trim(),
        area: form.area.trim(),
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        googleMapsUrl: form.googleMapsUrl.trim(),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        areaSqft: Number(form.areaSqft) || 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        parkingSpaces: Number(form.parkingSpaces) || 0,
        amenities: form.amenities,
        features: [form.furnishing, form.facing].filter(Boolean),
        price: isRent ? Number(form.monthlyRent) || 0 : Number(form.price) || 0,
        priceRange: form.priceRange.trim(),
        heroImage: form.heroImage,
        gallery: form.gallery.map((img) => ({ url: img.url, s3Key: img.s3Key })),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        kycInfo: {
          fullName: form.kyc.fullName.trim(),
          idType: form.kyc.idType,
          idNumber: form.kyc.idNumber.trim(),
          idDocumentUrl: form.kyc.idDocumentUrl,
          idDocumentS3Key: form.kyc.idDocumentS3Key,
          ownershipType: form.kyc.ownershipType,
          ownershipDocumentUrl: form.kyc.ownershipDocumentUrl,
          ownershipDocumentS3Key: form.kyc.ownershipDocumentS3Key,
          propertyTaxId: form.kyc.propertyTaxId.trim(),
          declarationSigned: form.kyc.declarationSigned
        }
      }

      const res = await fetch(`${getApiBaseUrl()}/properties/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(data.message || 'Property submission failed. Please verify form details.')
        return
      }

      setSuccessRefId(data.data?.referenceId || 'HS-PROP-SUCCESS')
    } catch {
      setSubmitError('Network connectivity error. Please check your connection and retry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header banner */}
      <div className="bg-brand-charcoal text-white pt-10 pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0B4F3C_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-5xl mx-auto space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/30 border border-brand-green/40 text-[10px] uppercase tracking-[0.2em] font-extrabold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Owner Portal
            </span>
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              {showLivePreview ? 'Hide Listing Card' : 'Live Card Preview'}
            </button>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">List Your Property</h1>
          <p className="text-base text-white/70 max-w-2xl">
            Step-by-step listing wizard with integrated Seller & Title Deed KYC verification for instant buyer trust.
          </p>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="bg-white/95 backdrop-blur-xl border border-brand-green/15 rounded-3xl p-4 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between min-w-[640px] gap-2">
            {WIZARD_STEPS.map((s, idx) => {
              const Icon = s.icon
              const isDone = step > s.id
              const isCurrent = step === s.id
              return (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id < step) setStep(s.id)
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all ${
                      isCurrent
                        ? 'bg-brand-green text-white shadow-md font-bold'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100/70'
                        : 'text-brand-charcoal/50 hover:text-brand-charcoal font-medium'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-white/20 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-brand-soft text-brand-charcoal/60'
                    }`}>
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-left leading-tight hidden md:block">
                      <p className="text-[11px] uppercase tracking-wider">{s.name}</p>
                      <p className={`text-[9px] opacity-80 font-normal ${isCurrent ? 'text-white' : 'text-brand-charcoal/60'}`}>{s.short}</p>
                    </div>
                  </button>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 min-w-[16px] rounded-full transition-colors ${
                      step > s.id ? 'bg-emerald-500' : 'bg-brand-green/10'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Wizard Form Area */}
          <div className={`${showLivePreview ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6 transition-all duration-300`}>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-brand-green/15 p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* STEP 1: OVERVIEW */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-green/10 pb-4">
                      <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Property Purpose & Type</h2>
                      <p className="text-xs text-brand-charcoal/60 mt-0.5">Select whether you are selling or renting, and pick your property category.</p>
                    </div>

                    {/* Listing Type cards */}
                    <div className="space-y-2">
                      <label className="hs-label">Listing Purpose <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {LISTING_TYPE_OPTIONS.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => update('listingType', opt.value)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1 ${
                              form.listingType === opt.value
                                ? 'border-brand-green bg-brand-soft/60 shadow-sm'
                                : 'border-brand-green/15 bg-[#FDFCF0] hover:border-brand-green/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-brand-charcoal">{opt.label}</span>
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green">{opt.badge}</span>
                            </div>
                            <p className="text-[10px] text-brand-charcoal/60">{opt.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Property Type Grid */}
                    <div className="space-y-2 pt-2">
                      <label className="hs-label">Property Category <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PROPERTY_TYPE_OPTIONS.map((opt) => (
                          <div
                            key={opt.label}
                            onClick={() => {
                              update('displayType', opt.label)
                              update('propertyType', opt.value)
                            }}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                              form.displayType === opt.label
                                ? 'border-brand-green bg-brand-soft/60 shadow-sm'
                                : 'border-brand-green/15 bg-[#FDFCF0] hover:border-brand-green/40'
                            }`}
                          >
                            <span className="text-2xl">{opt.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-brand-charcoal leading-snug">{opt.label}</p>
                              <p className="text-[9px] text-brand-charcoal/50 mt-0.5 line-clamp-1">{opt.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {fieldErrors.displayType && <p className="hs-field-error">{fieldErrors.displayType}</p>}
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-4 pt-2 border-t border-brand-green/10">
                      <div className="space-y-1.5">
                        <label className="hs-label">
                          Property Listing Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`input-base ${
                            fieldErrors.title 
                              ? 'hs-input-error' 
                              : ''
                          }`}
                          value={form.title}
                          onChange={(e) => update('title', e.target.value)}
                          placeholder="e.g. Luxurious 3BHK Apartment in Bandra West with Sea View"
                          maxLength={150}
                        />
                        {fieldErrors.title && <p className="hs-field-error">{fieldErrors.title}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="hs-label">Tagline / Short Highlight</label>
                        <input
                          type="text"
                          className="input-base"
                          value={form.tagline}
                          onChange={(e) => update('tagline', e.target.value)}
                          placeholder="e.g. Corner plot facing lush green garden, 100% Vastu compliant"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="hs-label">Detailed Property Description</label>
                        <textarea
                          rows={4}
                          className="input-base"
                          value={form.description}
                          onChange={(e) => update('description', e.target.value)}
                          placeholder="Provide details about natural lighting, connectivity, nearby schools, hospitals, security features..."
                          maxLength={2000}
                        />
                        <p className="text-[10px] text-brand-charcoal/40 text-right">{form.description.length}/2000 characters</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: LOCATION */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-green/10 pb-4">
                      <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Location & Address Details</h2>
                      <p className="text-xs text-brand-charcoal/60 mt-0.5">Accurate location details increase buyer inquiry conversion by over 40%.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="hs-label">State</label>
                        <input
                          type="text"
                          className="input-base"
                          value={form.state}
                          onChange={(e) => update('state', e.target.value)}
                          placeholder="e.g. Maharashtra"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="hs-label">City <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className={`input-base ${
                            fieldErrors.city 
                              ? 'hs-input-error' 
                              : ''
                          }`}
                          value={form.city}
                          onChange={(e) => update('city', e.target.value)}
                          placeholder="e.g. Mumbai"
                        />
                        {fieldErrors.city && <p className="hs-field-error">{fieldErrors.city}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="hs-label">Locality / Area <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className={`input-base ${
                            fieldErrors.area 
                              ? 'hs-input-error' 
                              : ''
                          }`}
                          value={form.area}
                          onChange={(e) => update('area', e.target.value)}
                          placeholder="e.g. Bandra West"
                        />
                        {fieldErrors.area && <p className="hs-field-error">{fieldErrors.area}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="hs-label">Pincode</label>
                        <input
                          type="text"
                          className="input-base"
                          value={form.pincode}
                          onChange={(e) => update('pincode', e.target.value)}
                          placeholder="e.g. 400050"
                          maxLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="hs-label">Full Property Address</label>
                      <textarea
                        rows={2}
                        className="input-base"
                        value={form.address}
                        onChange={(e) => update('address', e.target.value)}
                        placeholder="Building name, Flat/Plot number, Road name, Landmark..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="hs-label">Google Maps Location URL (optional)</label>
                      <input
                        type="url"
                        className="input-base"
                        value={form.googleMapsUrl}
                        onChange={(e) => update('googleMapsUrl', e.target.value)}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>

                    <div className="pt-2 border-t border-brand-green/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-brand-charcoal">Exact Map Coordinates</h3>
                          <p className="text-[10px] text-brand-charcoal/60">Required for &apos;Nearby&apos; search visibility.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!('geolocation' in navigator)) {
                              alert('Geolocation is not supported by your browser.')
                              return
                            }
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                update('latitude', pos.coords.latitude.toString())
                                update('longitude', pos.coords.longitude.toString())
                              },
                              () => alert('Could not get your location. Please check browser permissions.')
                            )
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-soft hover:bg-brand-green/20 border border-brand-green/20 text-brand-green text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" /> Auto-Detect
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-brand-charcoal/80 block">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            className="input-base"
                            value={form.latitude}
                            onChange={(e) => update('latitude', e.target.value)}
                            placeholder="e.g. 28.6139"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-brand-charcoal/80 block">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            className="input-base"
                            value={form.longitude}
                            onChange={(e) => update('longitude', e.target.value)}
                            placeholder="e.g. 77.2090"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: SPECS & AMENITIES */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-green/10 pb-4">
                      <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Property Dimensions & Amenities</h2>
                      <p className="text-xs text-brand-charcoal/60 mt-0.5">Specify carpet/super area, room counts, and available community amenities.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <label className="hs-label">Super Area (sq. ft.) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          min="1"
                          className={`input-base ${
                            fieldErrors.areaSqft 
                              ? 'hs-input-error' 
                              : ''
                          }`}
                          value={form.areaSqft}
                          onChange={(e) => update('areaSqft', e.target.value)}
                          placeholder="e.g. 1450"
                        />
                        {fieldErrors.areaSqft && <p className="hs-field-error">{fieldErrors.areaSqft}</p>}
                      </div>

                      {showBedBath && (
                        <>
                          <div className="space-y-1.5">
                            <label className="hs-label">Bedrooms</label>
                            <div className="relative">
                              <BedDouble className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="number"
                                min="0"
                                max="20"
                                className="input-base"
                                value={form.bedrooms}
                                onChange={(e) => update('bedrooms', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="hs-label">Bathrooms</label>
                            <div className="relative">
                              <Bath className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="number"
                                min="0"
                                max="20"
                                className="input-base"
                                value={form.bathrooms}
                                onChange={(e) => update('bathrooms', e.target.value)}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="space-y-1.5">
                        <label className="hs-label">Parking Spaces</label>
                        <div className="relative">
                          <Car className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            min="0"
                            max="10"
                            className="input-base"
                            value={form.parkingSpaces}
                            onChange={(e) => update('parkingSpaces', e.target.value)}
                          />
                        </div>
                      </div>

                      {showFloor && (
                        <>
                          <div className="space-y-1.5">
                            <label className="hs-label">Floor Number</label>
                            <input
                              type="number"
                              min="0"
                              className="input-base"
                              value={form.floor}
                              onChange={(e) => update('floor', e.target.value)}
                              placeholder="e.g. 5"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="hs-label">Total Floors</label>
                            <input
                              type="number"
                              min="1"
                              className="input-base"
                              value={form.totalFloors}
                              onChange={(e) => update('totalFloors', e.target.value)}
                              placeholder="e.g. 14"
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-1.5">
                        <label className="hs-label">Facing Direction</label>
                        <select
                          className="input-base"
                          value={form.facing}
                          onChange={(e) => update('facing', e.target.value)}
                        >
                          <option value="">Select facing...</option>
                          {FACING_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>

                      {showBedBath && (
                        <div className="space-y-1.5">
                          <label className="hs-label">Furnishing Status</label>
                          <select
                            className="input-base"
                            value={form.furnishing}
                            onChange={(e) => update('furnishing', e.target.value)}
                          >
                            {FURNISHING_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Amenities multi-select */}
                    <div className="space-y-3 pt-4 border-t border-brand-green/10">
                      <label className="hs-label">Key Amenities & Society Features</label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_AMENITIES.map((item) => {
                          const active = form.amenities.includes(item)
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleAmenity(item)}
                              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                active
                                  ? 'bg-brand-green text-white shadow-sm scale-[1.02]'
                                  : 'bg-[#FDFCF0] border border-brand-green/20 text-brand-charcoal/70 hover:bg-brand-soft'
                              }`}
                            >
                              <span>{active ? '✓' : '+'}</span> {item}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: PRICING & CONTACT */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-green/10 pb-4">
                      <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Pricing & Verified Contact</h2>
                      <p className="text-xs text-brand-charcoal/60 mt-0.5">Set expected pricing and phone number for verified inquiries.</p>
                    </div>

                    {isRent ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="hs-label">Expected Monthly Rent (₹) <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <IndianRupee className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              min="0"
                              className={`input-base ${
                                fieldErrors.monthlyRent 
                                  ? 'hs-input-error' 
                                  : ''
                              }`}
                              value={form.monthlyRent}
                              onChange={(e) => update('monthlyRent', e.target.value)}
                              placeholder="e.g. 35000"
                            />
                          </div>
                          {fieldErrors.monthlyRent && <p className="hs-field-error">{fieldErrors.monthlyRent}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <label className="hs-label">Security Deposit (₹)</label>
                          <div className="relative">
                            <IndianRupee className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              min="0"
                              className="input-base"
                              value={form.securityDeposit}
                              onChange={(e) => update('securityDeposit', e.target.value)}
                              placeholder="e.g. 100000"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="hs-label">Expected Sale Price (₹) <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <IndianRupee className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              min="0"
                              className={`input-base ${
                                fieldErrors.price 
                                  ? 'hs-input-error' 
                                  : ''
                              }`}
                              value={form.price}
                              onChange={(e) => update('price', e.target.value)}
                              placeholder="e.g. 12500000"
                            />
                          </div>
                          {fieldErrors.price && <p className="hs-field-error">{fieldErrors.price}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <label className="hs-label">Display Price Label (optional)</label>
                          <input
                            type="text"
                            className="input-base"
                            value={form.priceRange}
                            onChange={(e) => update('priceRange', e.target.value)}
                            placeholder="e.g. ₹1.25 Crore"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <label className="inline-flex items-center gap-2 cursor-pointer bg-brand-soft/60 border border-brand-green/15 px-4 py-3 rounded-2xl w-full">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-brand-green cursor-pointer"
                          checked={form.isNegotiable}
                          onChange={(e) => update('isNegotiable', e.target.checked)}
                        />
                        <span className="text-xs font-bold text-brand-charcoal">Price is negotiable for serious buyers</span>
                      </label>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-brand-green/10">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-green">Direct Contact Info</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="hs-label">Contact Mobile Number <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              className={`input-base ${
                                fieldErrors.contactPhone 
                                  ? 'hs-input-error' 
                                  : ''
                              }`}
                              value={form.contactPhone}
                              onChange={(e) => update('contactPhone', e.target.value)}
                              placeholder="10-digit mobile"
                            />
                          </div>
                          {fieldErrors.contactPhone && <p className="hs-field-error">{fieldErrors.contactPhone}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <label className="hs-label">Contact Email</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              className="input-base"
                              value={form.contactEmail}
                              onChange={(e) => update('contactEmail', e.target.value)}
                              placeholder="your@email.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: PHOTOS */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-green/10 pb-4">
                      <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Property Photo Gallery</h2>
                      <p className="text-xs text-brand-charcoal/60 mt-0.5">Listings with 4+ high quality photos receive 3x more buyer responses.</p>
                    </div>

                    {/* Photo Uploader */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {form.gallery.map((img, idx) => (
                          <div
                            key={`${img.url}-${idx}`}
                            onClick={() => update('heroImage', img.url)}
                            className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer group transition-all ${
                              form.heroImage === img.url ? 'border-brand-green ring-4 ring-brand-green/10' : 'border-brand-green/15'
                            }`}
                          >
                            <img src={img.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            {form.heroImage === img.url && (
                              <span className="absolute bottom-0 left-0 right-0 bg-brand-green text-white text-[9px] font-extrabold text-center py-1 uppercase tracking-wider">
                                Main Photo ★
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const nextGallery = form.gallery.filter((_, i) => i !== idx)
                                update('gallery', nextGallery)
                                if (form.heroImage === img.url) {
                                  update('heroImage', nextGallery[0]?.url || '')
                                }
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <SingleDocUploader
                        label="Upload Property Photos"
                        description="Add up to 10 photos of living room, exterior, kitchen & bedrooms"
                        accept="image/*"
                        currentUrl=""
                        onUpload={(url, s3Key) => {
                          const nextGallery = [...form.gallery, { url, s3Key }]
                          update('gallery', nextGallery)
                          if (!form.heroImage) update('heroImage', url)
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 6: MANDATORY KYC & LEGAL VERIFICATION */}
                {step === 6 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-green/10 pb-4 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-6 h-6 text-brand-green" />
                          <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Seller Identity & Title KYC</h2>
                        </div>
                        <p className="text-xs text-brand-charcoal/60 mt-1">
                          Mandatory legal verification to prevent fraudulent property listings and protect real estate buyers.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                        Required
                      </span>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                      <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-900 leading-relaxed font-medium">
                        Your government ID number and title deed documents are encrypted and kept strictly confidential. They are viewed solely by our compliance team for listing approval.
                      </p>
                    </div>

                    {/* Seller Personal KYC */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-green">1. Seller Identity Proof</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="hs-label">
                            Full Legal Name (as per ID) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className={`input-base ${
                              fieldErrors['kyc.fullName'] 
                                ? 'hs-input-error' 
                                : ''
                            }`}
                            value={form.kyc.fullName}
                            onChange={(e) => updateKyc('fullName', e.target.value)}
                            placeholder="e.g. Ankit Kumar"
                          />
                          {fieldErrors['kyc.fullName'] && <p className="hs-field-error">{fieldErrors['kyc.fullName']}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <label className="hs-label">Identity Document Type <span className="text-red-500">*</span></label>
                          <select
                            className="input-base"
                            value={form.kyc.idType}
                            onChange={(e) => updateKyc('idType', e.target.value)}
                          >
                            {ID_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="hs-label">
                          Government ID Number ({form.kyc.idType}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`input-base ${
                            fieldErrors['kyc.idNumber'] 
                              ? 'hs-input-error' 
                              : ''
                          }`}
                          value={form.kyc.idNumber}
                          onChange={(e) => updateKyc('idNumber', e.target.value)}
                          placeholder="e.g. ABCDE1234F"
                        />
                        {fieldErrors['kyc.idNumber'] && <p className="hs-field-error">{fieldErrors['kyc.idNumber']}</p>}
                      </div>

                      {/* ID Document Upload */}
                      <SingleDocUploader
                        label="Government ID Document Proof Upload"
                        description="Upload clear photo or PDF scan of your PAN, Aadhaar or Passport"
                        currentUrl={form.kyc.idDocumentUrl}
                        onUpload={(url, s3Key) => {
                          updateKyc('idDocumentUrl', url)
                          updateKyc('idDocumentS3Key', s3Key)
                        }}
                      />
                      {fieldErrors['kyc.idDocumentUrl'] && <p className="hs-field-error">{fieldErrors['kyc.idDocumentUrl']}</p>}
                    </div>

                    {/* Property Ownership Title Deed KYC */}
                    <div className="space-y-4 pt-4 border-t border-brand-green/10">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-green">2. Property Ownership & Title Deed Verification</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="hs-label">Ownership Status <span className="text-red-500">*</span></label>
                          <select
                            className="input-base"
                            value={form.kyc.ownershipType}
                            onChange={(e) => updateKyc('ownershipType', e.target.value)}
                          >
                            {OWNERSHIP_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="hs-label">Property Tax / Khata / Survey Number (optional)</label>
                          <input
                            type="text"
                            className="input-base"
                            value={form.kyc.propertyTaxId}
                            onChange={(e) => updateKyc('propertyTaxId', e.target.value)}
                            placeholder="e.g. TAX-2026-88910"
                          />
                        </div>
                      </div>

                      {/* Title Deed Upload */}
                      <SingleDocUploader
                        label="Property Title Deed / Sale Registry / Allotment Letter Proof"
                        description="Upload copy of Registry, Title Deed, or Allotment Certificate proving ownership right"
                        currentUrl={form.kyc.ownershipDocumentUrl}
                        onUpload={(url, s3Key) => {
                          updateKyc('ownershipDocumentUrl', url)
                          updateKyc('ownershipDocumentS3Key', s3Key)
                        }}
                      />
                      {fieldErrors['kyc.ownershipDocumentUrl'] && <p className="hs-field-error">{fieldErrors['kyc.ownershipDocumentUrl']}</p>}
                    </div>

                    {/* Legal Declaration */}
                    <div className="pt-4 border-t border-brand-green/10 space-y-2">
                      <label className="inline-flex items-start gap-3 cursor-pointer bg-brand-soft/50 border border-brand-green/20 p-4 rounded-2xl w-full">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded accent-brand-green cursor-pointer mt-0.5 shrink-0"
                          checked={form.kyc.declarationSigned}
                          onChange={(e) => updateKyc('declarationSigned', e.target.checked)}
                        />
                        <div className="text-xs text-brand-charcoal space-y-1">
                          <p className="font-bold">Self-Declaration of Legitimate Ownership & Verification</p>
                          <p className="text-[11px] text-brand-charcoal/70 leading-relaxed">
                            I hereby solemnly affirm and declare that I am the rightful legal owner or authorized agent (with valid Power of Attorney) of the property described herein. All provided documents and information are true and authentic.
                          </p>
                        </div>
                      </label>
                      {fieldErrors['kyc.declarationSigned'] && <p className="hs-field-error">{fieldErrors['kyc.declarationSigned']}</p>}
                    </div>
                  </div>
                )}

                {/* STEP 7: REVIEW & SUBMIT */}
                {step === 7 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-green/10 pb-4">
                      <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Review Listing & Final Submit</h2>
                      <p className="text-xs text-brand-charcoal/60 mt-0.5">Please review your property summary and attached KYC status before submitting.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-white border border-brand-green/20 rounded-2xl p-4 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-brand-green">Overview</span>
                        <p className="font-bold text-brand-charcoal text-sm">{form.title}</p>
                        <p className="text-brand-charcoal/70">{form.displayType} · {form.listingType}</p>
                        <p className="font-extrabold text-brand-green text-sm">
                          {isRent ? `₹${Number(form.monthlyRent).toLocaleString('en-IN')}/mo` : `₹${Number(form.price).toLocaleString('en-IN')}`}
                        </p>
                      </div>

                      <div className="bg-white border border-brand-green/20 rounded-2xl p-4 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-brand-green">Location & Contact</span>
                        <p className="font-bold text-brand-charcoal">{form.area}, {form.city}</p>
                        <p className="text-brand-charcoal/70">{form.address || 'Address provided'}</p>
                        <p className="text-brand-charcoal">Phone: <span className="font-bold">{form.contactPhone}</span></p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-500/20 rounded-2xl p-4 space-y-2 col-span-1 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" /> KYC Status Summary
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                            Verified & Signed ✓
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-emerald-900">
                          <p>Legal Name: <span className="font-bold">{form.kyc.fullName}</span></p>
                          <p>ID Type: <span className="font-bold">{form.kyc.idType} ({form.kyc.idNumber})</span></p>
                          <p>Ownership: <span className="font-bold">{form.kyc.ownershipType}</span></p>
                        </div>
                      </div>
                    </div>

                    {submitError && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-xs font-semibold">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{submitError}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 bg-white/90 backdrop-blur-xl border border-brand-green/15 rounded-3xl p-5 shadow-lg">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-brand-green/20 text-brand-charcoal text-xs font-bold hover:bg-brand-soft disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="text-center hidden sm:block">
                <p className="text-xs font-bold text-brand-charcoal">Step {step} of {WIZARD_STEPS.length}</p>
                <p className="text-[10px] text-brand-charcoal/50">{WIZARD_STEPS[step - 1]?.name}</p>
              </div>

              {step < WIZARD_STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-brand-green text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-dark transition-all shadow-md"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-brand-green text-white text-xs font-extrabold uppercase tracking-wider hover:from-emerald-700 hover:to-brand-dark transition-all shadow-lg disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Listing…</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Submit Property For Approval</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Optional Live Public Card Preview Drawer/Panel */}
          {showLivePreview && (
            <div className="lg:col-span-5 sticky top-28 space-y-4">
              <div className="bg-white rounded-3xl border border-brand-green/20 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-brand-green/10 pb-3">
                  <div className="flex items-center gap-2 text-brand-green font-bold text-xs">
                    <Eye className="w-4 h-4" /> Public Card Preview
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-soft text-brand-green">
                    Live Demo
                  </span>
                </div>

                {/* Simulated Public Listing Card */}
                <div className="bg-white border border-brand-green/15 rounded-3xl overflow-hidden shadow-sm space-y-3">
                  <div className="h-48 bg-brand-soft relative overflow-hidden">
                    {form.heroImage || form.gallery[0]?.url ? (
                      <img src={form.heroImage || form.gallery[0]?.url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-brand-green/40 gap-2">
                        <Home className="w-10 h-10" />
                        <span className="text-[10px] font-bold uppercase">Photo Preview</span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-[10px] font-extrabold text-brand-charcoal shadow-sm">
                      {form.displayType}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-green text-white text-[10px] font-extrabold shadow-sm">
                      {form.listingType}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-serif font-bold text-brand-charcoal leading-snug line-clamp-2">
                      {form.title || 'Your Property Title Will Appear Here'}
                    </h4>
                    <p className="text-xs text-brand-charcoal/60 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-green" />
                      {[form.area, form.city].filter(Boolean).join(', ') || 'City, Area'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-brand-green/10">
                      <p className="text-base font-extrabold text-brand-green">
                        {isRent
                          ? (form.monthlyRent ? `₹${Number(form.monthlyRent).toLocaleString('en-IN')}/mo` : '₹ Rent')
                          : (form.priceRange || (form.price ? `₹${Number(form.price).toLocaleString('en-IN')}` : '₹ Price'))}
                      </p>
                      <span className="text-[10px] font-bold text-brand-charcoal/50">
                        {form.areaSqft ? `${form.areaSqft} sq.ft` : 'Sq.ft'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-brand-charcoal/60 pt-1">
                      <span>{showBedBath ? `${form.bedrooms} Beds · ${form.bathrooms} Baths` : 'Plot / Unit'}</span>
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Title KYC Verified
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-brand-charcoal/50 text-center italic">
                  This preview updates automatically as you complete each step of the form.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
