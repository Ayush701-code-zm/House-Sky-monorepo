'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Building2, MapPin, ArrowLeft, Phone, Mail,
  Download, CheckCircle2, X, Search, Shield,
  Star, Trees, Car, Wifi, Zap, Droplets, Camera,
  Navigation, ArrowUpRight
} from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'
import { NakshaDotMap } from '@/components/real-estate/NakshaDotMap'
import { PlotStatusGrid } from '@/components/real-estate/PlotStatusGrid'
import dynamic from 'next/dynamic'
import { hasValidCoords } from '@/components/maps/LocationMap'
import { SITE } from '@/utils/siteConfig'

const LocationMap = dynamic(
  () => import('@/components/maps/LocationMap').then((m) => m.LocationMap),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[240px] bg-brand-soft animate-pulse" /> }
)

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  security: <Shield className="w-4 h-4" />,
  electricity: <Zap className="w-4 h-4" />,
  water: <Droplets className="w-4 h-4" />,
  park: <Trees className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
  wifi: <Wifi className="w-4 h-4" />,
  cctv: <Camera className="w-4 h-4" />,
}

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BOOKED: 'bg-sky-50 text-sky-700 border-sky-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  SOLD: 'bg-red-50 text-red-700 border-red-200',
}
const STATUS_DOT: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500',
  BOOKED: 'bg-yellow-500',
  PENDING: 'bg-yellow-500',
  SOLD: 'bg-red-500',
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params?.id as string

  const [projectData, setProjectData] = React.useState<any | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedPlot, setSelectedPlot] = React.useState<any | null>(null)
  const [formData, setFormData] = React.useState({ name: '', phone: '', email: '', message: '' })
  const [formStatus, setFormStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const fetchProjectDetails = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/public/projects/${projectId}`, { cache: 'no-store' }).catch(() => null)
      if (res && res.ok) {
        const data = await res.json().catch(() => null)
        setProjectData(data)
      }
    } catch (e) {
      console.error('Fetch project details error', e)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (!projectId) return
    fetchProjectDetails()
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchProjectDetails(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [projectId])

  const scrollToInquiry = () => {
    document.getElementById('project-inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handlePlotInquiry = (plot: any) => {
    setSelectedPlot(plot)
    setFormData((prev) => ({
      ...prev,
      message: prev.message?.trim()
        ? prev.message
        : `I want details / a callback for Plot ${plot.plotNo}${plot.block ? ` (Block ${plot.block})` : ''}.`,
    }))
    // Let the hover card unmount, then scroll to the sticky form
    window.setTimeout(scrollToInquiry, 50)
  }

  const handlePlotBook = (plot: any) => {
    setSelectedPlot(plot)
    setFormData((prev) => ({
      ...prev,
      message: `Book Now request for Plot ${plot.plotNo}${plot.block ? ` (Block ${plot.block})` : ''} — please confirm availability and next steps.`,
    }))
    window.setTimeout(scrollToInquiry, 50)
  }

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormStatus('submitting')
    try {
      const baseUrl = getApiBaseUrl()
      const plotInfo = selectedPlot ? ` | Plot: ${selectedPlot.plotNo} (Block ${selectedPlot.block})` : ''
      const digits = String(formData.phone || '').replace(/\D/g, '')
      const fallbackEmail = digits.length >= 10
        ? `sitevisit.${digits.slice(-10)}@houseandsky.com`
        : 'sitevisit@houseandsky.com'
      const payload = {
          name: formData.name,
          phone: formData.phone,
          // Backend requires a dotted-TLD email; the sidebar form marks it optional
          email: formData.email.trim() || fallbackEmail,
          inquiryType: 'PROJECT_INQUIRY',
          projectId: projectData?.project?._id,
          plotNo: selectedPlot?.plotNo || '',
          message: formData.message || `Inquiry for ${projectData?.project?.name}${plotInfo}`,
          source: 'project-detail'
        }
      const res = await fetch(`${baseUrl}/public/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Inquiry submission failed')
      setFormStatus('success')
      setFormData({ name: '', phone: '', email: '', message: '' })
      setTimeout(() => { setFormStatus('idle'); setSelectedPlot(null) }, 4000)
    } catch {
      setFormStatus('error')
      setTimeout(() => setFormStatus('idle'), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-brand-charcoal/70 font-semibold">Loading Project Details…</p>
        </div>
      </div>
    )
  }

  if (!projectData?.project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <Building2 className="w-14 h-14 text-brand-green/40 mx-auto" />
          <h2 className="font-serif text-3xl font-semibold text-brand-charcoal">Project Not Found</h2>
          <Link href="/projects" className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-green text-white text-xs font-bold rounded-xl shadow-md">
            <ArrowLeft className="w-4 h-4" /> Return to All Projects
          </Link>
        </div>
      </div>
    )
  }

  const { project, stats, plots, properties } = projectData
  const availPct = project.totalPlots
    ? Math.round(((stats?.AVAILABLE ?? 0) / project.totalPlots) * 100)
    : 0

  const highlights = Array.isArray(project.highlights) ? project.highlights.filter(Boolean) : []
  const locationAdvantages = Array.isArray(project.locationAdvantages) ? project.locationAdvantages.filter((a: any) => a?.landmark) : []
  const amenities = Array.isArray(project.amenities) ? project.amenities.filter(Boolean) : []
  const heroImage = project.bannerImage || project.mapImageUrl || ''
  const mapEmbedSrc = project.mapEmbedUrl || ''
  const projectPhone = project.contactPhone || ''
  const projectEmail = project.contactEmail || ''

  const filteredPlots = (plots || []).filter((p: any) => {
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchSearch =
      !searchQuery ||
      p.plotNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.block?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="min-h-screen bg-white">

      {/* ═══ HERO BANNER ═══ */}
      <div className="relative h-[50vh] min-h-[340px] max-h-[520px] overflow-hidden bg-brand-charcoal">
        {heroImage ? (
          // Native img — Next/Image often fails on long S3 presigned URLs
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt={project.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-charcoal" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Back button */}
        <div className="absolute top-5 left-5 z-20">
          <Link href="/projects"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> All Projects
          </Link>
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 z-10">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                project.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                project.status === 'UPCOMING' ? 'bg-amber-400 text-amber-900' :
                'bg-sky-500 text-white'
              }`}>{project.status || 'ACTIVE'}</span>
              <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white font-mono text-[10px] rounded-lg border border-white/20">
                {project.code}
              </span>
              {project.legalInfo?.reraNumber && (
                <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm text-[#C9A96E] text-[10px] font-bold rounded-lg border border-white/10">
                  RERA: {project.legalInfo.reraNumber}
                </span>
              )}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-white leading-tight">{project.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80 font-medium">
              <MapPin className="w-4 h-4 text-[#C9A96E] shrink-0" />
              {[project.location, project.city, project.state].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ STATS RIBBON ═══ */}
      <div className="bg-brand-charcoal border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-white/10">
            {[
              { label: 'Total Plots', value: project.totalPlots || 0, sub: 'Masterplan' },
              { label: 'Available', value: stats?.AVAILABLE ?? 0, sub: 'Ready to Book', color: 'text-emerald-400' },
              { label: 'Booked', value: stats?.BOOKED ?? 0, sub: 'Reserved', color: 'text-sky-400' },
              { label: 'Pending', value: stats?.PENDING ?? 0, sub: 'Under Review', color: 'text-amber-400' },
              { label: 'Sold', value: stats?.SOLD ?? 0, sub: 'Conveyed', color: 'text-red-400' },
              { label: 'Base Rate', value: `₹${(project.basePricePerSqft || 0).toLocaleString('en-IN')}`, sub: 'per sq ft', color: 'text-[#C9A96E]' },
            ].map((s) => (
              <div key={s.label} className="py-4 px-3 text-center">
                <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold block">{s.label}</span>
                <span className={`text-lg sm:text-2xl font-serif font-bold block mt-0.5 ${s.color || 'text-white'}`}>{s.value}</span>
                <span className="text-[9px] text-white/40 font-mono">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="bg-gray-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─ LEFT: Main Content ─ */}
          <div className="lg:col-span-2 space-y-7">

            {/* PROJECT OVERVIEW — matches hippoinfra layout */}
            <section className="bg-white rounded-3xl shadow-sm border border-brand-green/10 overflow-hidden">
              <div className="bg-[#E8F0EC] px-7 py-4 border-b border-brand-green/15">
                <h2 className="font-serif text-xl font-bold text-brand-charcoal">Project Overview</h2>
              </div>

              {/* Quick Stats Banner */}
              <div className="grid grid-cols-3 gap-4 p-6 bg-[#E8F0EC]/40">
                <div className="text-center p-3 bg-white rounded-2xl border border-brand-green/15 shadow-sm">
                  <MapPin className="w-5 h-5 text-brand-green mx-auto mb-1" />
                  <span className="text-[10px] text-brand-charcoal/60 uppercase font-bold block">Location</span>
                  <span className="text-sm font-extrabold text-brand-charcoal">{project.city || project.location}</span>
                </div>
                <div className="text-center p-3 bg-white rounded-2xl border border-brand-green/15 shadow-sm">
                  <Building2 className="w-5 h-5 text-brand-green mx-auto mb-1" />
                  <span className="text-[10px] text-brand-charcoal/60 uppercase font-bold block">Total Plots</span>
                  <span className="text-2xl font-extrabold text-brand-charcoal">{project.totalPlots || 0}</span>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm">
                  <span className="w-5 h-5 mx-auto mb-1 flex items-center justify-center">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse block" />
                  </span>
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Available</span>
                  <span className="text-2xl font-extrabold text-emerald-700">{stats?.AVAILABLE ?? 0}</span>
                </div>
              </div>

              {/* Description */}
              {project.description ? (
                <div className="px-7 pb-6 pt-2">
                  <p className="text-sm text-brand-charcoal/70 leading-relaxed font-light">
                    {project.description}
                  </p>
                </div>
              ) : null}
            </section>

            {(highlights.length > 0 || locationAdvantages.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {highlights.length > 0 && (
              <section className="bg-white rounded-3xl shadow-sm border border-brand-green/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-brand-green/10">
                  <h2 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#C9A96E]" /> Project Highlights
                  </h2>
                </div>
                <div className="p-5 space-y-2.5">
                  {highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-brand-charcoal">{h}</span>
                    </div>
                  ))}
                </div>
              </section>
              )}

              {locationAdvantages.length > 0 && (
              <section className="bg-white rounded-3xl shadow-sm border border-brand-green/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-brand-green/10">
                  <h2 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-[#C9A96E]" /> Location Advantages
                  </h2>
                </div>
                <div className="p-5 space-y-2.5">
                  {locationAdvantages.map((adv: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                      <span className="text-xs font-extrabold text-brand-green w-20 shrink-0">{adv.distance}</span>
                      <span className="text-sm font-semibold text-brand-charcoal">{adv.landmark}</span>
                    </div>
                  ))}
                </div>
              </section>
              )}
            </div>
            )}

            {amenities.length > 0 && (
            <section className="bg-white rounded-3xl shadow-sm border border-brand-green/10 overflow-hidden">
              <div className="bg-[#E8F0EC] px-7 py-4 border-b border-brand-green/15">
                <h2 className="font-serif text-xl font-bold text-brand-charcoal">Amenities &amp; Facilities</h2>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((a: string, i: number) => {
                  const key = Object.keys(AMENITY_ICONS).find(k => a.toLowerCase().includes(k)) || 'security'
                  return (
                    <div key={i} className="flex items-center gap-3 p-3.5 bg-[#E8F0EC] rounded-2xl border border-brand-green/15 group hover:bg-brand-green hover:text-white transition-all cursor-default">
                      <span className="text-brand-green group-hover:text-white transition-colors shrink-0">
                        {AMENITY_ICONS[key] || <Star className="w-4 h-4" />}
                      </span>
                      <span className="text-xs font-bold text-brand-charcoal group-hover:text-white transition-colors">{a}</span>
                    </div>
                  )
                })}
              </div>
            </section>
            )}

            {Array.isArray(project.gallery) && project.gallery.length > 0 && (
              <section className="bg-white rounded-3xl shadow-sm border border-brand-green/10 overflow-hidden">
                <div className="bg-[#E8F0EC] px-7 py-4 border-b border-brand-green/15">
                  <h2 className="font-serif text-xl font-bold text-brand-charcoal">Project Gallery</h2>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {project.gallery.map((img: any, index: number) => (
                    <div key={`${img.url}-${index}`} className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                      <Image src={img.url} alt={img.caption || project.name} fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {Array.isArray(properties) && properties.length > 0 && (
              <section className="bg-white rounded-3xl shadow-sm border border-brand-green/10 overflow-hidden">
                <div className="bg-[#E8F0EC] px-7 py-4 border-b border-brand-green/15">
                  <h2 className="font-serif text-xl font-bold text-brand-charcoal">Premium Properties</h2>
                  <p className="text-xs text-brand-charcoal/60">Listings linked to this township — not plot inventory</p>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {properties.map((item: any) => (
                    <Link key={item._id} href={`/properties/${item.slug}`} className="p-4 rounded-2xl border border-brand-green/15 hover:border-brand-green/40">
                      <p className="text-[10px] font-bold uppercase text-brand-green">{item.propertyType?.replace('_', ' ')}</p>
                      <h3 className="font-serif font-bold text-brand-charcoal mt-1">{item.title}</h3>
                      <p className="text-xs text-brand-charcoal/60 mt-1">{item.priceRange || 'Price on request'}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* NAKSHA / LAYOUT MAP with available-plot blinking dots */}
            {(project.mapImageUrl || (plots?.length > 0)) && (
              <section className="bg-white rounded-3xl shadow-sm border border-brand-green/10 overflow-hidden">
                <div className="bg-[#E8F0EC] px-7 py-4 border-b border-brand-green/15 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-brand-charcoal">
                      {project.surveyNumber ? `Survey No. ${project.surveyNumber}` : 'Layout Map / Naksha'}
                    </h2>
                    {project.village && <p className="text-xs text-brand-charcoal/60">Vill. {project.village}</p>}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse block" />Available</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-yellow-500 rounded-full block" />Booked / Pending</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full block" />Sold</span>
                  </div>
                </div>
                <div className="p-5">
                  {project.mapImageUrl ? (
                    <div className="relative w-full rounded-2xl overflow-visible border border-brand-green/10 bg-white">
                      <NakshaDotMap
                        imageUrl={project.mapImageUrl}
                        imageAlt={`${project.name} Layout`}
                        plots={filteredPlots}
                        onSelectPlot={setSelectedPlot}
                        onInquiry={handlePlotInquiry}
                        onBook={handlePlotBook}
                      />
                    </div>
                  ) : (
                    /* If no naksha image, show a clean status grid */
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 p-2">
                      {(plots || []).slice(0, 60).map((p: any) => (
                        <div
                          key={p._id}
                          title={`Plot ${p.plotNo} · ${p.status}`}
                          onClick={() => p.status === 'AVAILABLE' && setSelectedPlot(p)}
                          className={`relative aspect-square rounded-lg flex items-center justify-center text-[8px] font-bold transition-all ${
                            p.status === 'AVAILABLE'
                              ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-700 cursor-pointer hover:bg-emerald-200'
                              : p.status === 'BOOKED'
                              ? 'bg-sky-100 border border-sky-300 text-sky-700'
                              : p.status === 'PENDING'
                              ? 'bg-amber-100 border border-amber-300 text-amber-700'
                              : 'bg-red-100 border border-red-300 text-red-700'
                          }`}
                        >
                          {p.status === 'AVAILABLE' && (
                            <div className="absolute inset-0 rounded-lg overflow-hidden">
                              <div className="absolute inset-0 bg-emerald-400 opacity-20 animate-pulse" />
                            </div>
                          )}
                          <span className="relative z-10 truncate px-0.5">{p.plotNo?.replace(/^[A-Z]-?/, '')}</span>
                        </div>
                      ))}
                      {(plots || []).length > 60 && (
                        <div className="col-span-6 sm:col-span-10 text-center text-xs text-brand-charcoal/50 pt-2 font-semibold">
                          + {(plots || []).length - 60} more plots. Filter below ↓
                        </div>
                      )}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-brand-charcoal/40 text-center font-mono">
                    * Layout is indicative. Actual plot boundaries may vary slightly.
                  </p>
                </div>
              </section>
            )}


          </div>

          {/* ─ RIGHT: Sticky Contact Sidebar ─ */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-4">

              {/* Main Contact Form */}
              <div id="project-inquiry" className="bg-brand-charcoal text-white rounded-3xl p-6 shadow-lg scroll-mt-32">
                <h3 className="font-serif text-xl font-bold mb-1">
                  {selectedPlot ? `Inquire for Plot ${selectedPlot.plotNo}` : 'Schedule a Site Visit'}
                </h3>
                {selectedPlot && (
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-white/60">{project.name} · Block {selectedPlot.block}</p>
                    <button onClick={() => setSelectedPlot(null)} className="p-1 text-white/50 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {!selectedPlot && <p className="text-xs text-white/60 mb-5">Talk to our advisor for pricing &amp; availability.</p>}

                {formStatus === 'success' ? (
                  <div className="text-center py-6 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <p className="font-bold text-sm">Thank you!</p>
                    <p className="text-xs text-white/60">Our team will call you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleInquiry} noValidate className="space-y-4 mt-4">
                    <div className="space-y-1.5">
                      <label htmlFor="sidebar-name" className="hs-label sr-only">Your Full Name <span className="hs-required">*</span></label>
                      <input id="sidebar-name" required type="text" placeholder="Your Full Name" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-base input-on-dark" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="sidebar-phone" className="hs-label sr-only">Phone Number <span className="hs-required">*</span></label>
                      <input id="sidebar-phone" required type="tel" placeholder="Phone Number" value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input-base input-on-dark" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="sidebar-email" className="hs-label sr-only">Email (optional)</label>
                      <input id="sidebar-email" type="email" placeholder="Email (optional)" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-base input-on-dark" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="sidebar-message" className="hs-label sr-only">Message</label>
                      <textarea id="sidebar-message" rows={2} placeholder="Message or preferred visit date…" value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="input-base input-on-dark resize-none min-h-[80px]" />
                    </div>
                    <button type="submit" disabled={formStatus === 'submitting'}
                      className="hs-btn-primary w-full bg-brand-green hover:bg-emerald-600 border-none">
                      {formStatus === 'submitting' ? 'Sending…' : '📞 Request Callback'}
                    </button>
                    {formStatus === 'error' && <p className="hs-field-error text-center justify-center text-red-400">Failed. Please try again.</p>}
                  </form>
                )}
              </div>

              {/* Direct contact */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-brand-green/10 space-y-3">
                <h4 className="font-bold text-sm text-brand-charcoal">Direct Project Sales Contact</h4>
                {projectPhone && (
                <a href={`tel:${projectPhone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-3 text-sm text-brand-charcoal/80 hover:text-brand-green transition-colors font-semibold">
                  <div className="w-9 h-9 bg-[#E8F0EC] rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-brand-green" />
                  </div>
                  {projectPhone}
                </a>
                )}
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-brand-charcoal/80 hover:text-brand-green transition-colors font-semibold">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </div>
                  {SITE.whatsappDisplay} (WhatsApp)
                </a>
                {projectEmail && (
                <a href={`mailto:${projectEmail}`} className="flex items-center gap-3 text-sm text-brand-charcoal/80 hover:text-brand-green transition-colors font-semibold">
                  <div className="w-9 h-9 bg-[#E8F0EC] rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-brand-green" />
                  </div>
                  {projectEmail}
                </a>
                )}
              </div>

              {/* Brochure */}
              <a
                href={project.brochureUrl || '#'}
                onClick={(e) => {
                  if (!project.brochureUrl) {
                    e.preventDefault()
                    setSelectedPlot(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                target={project.brochureUrl ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#E8F0EC] hover:bg-brand-green text-brand-green hover:text-white font-bold text-sm rounded-2xl border border-brand-green/20 transition-all shadow-sm cursor-pointer">
                <Download className="w-4 h-4" /> Download Project Brochure (PDF)
              </a>

              {/* Availability meter */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-brand-green/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">Availability</span>
                  <span className="text-sm font-extrabold text-brand-green">{availPct}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-green to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${availPct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-brand-charcoal/50 mt-1.5 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {stats?.AVAILABLE ?? 0} Available
                  </span>
                  <span>{(stats?.BOOKED ?? 0) + (stats?.SOLD ?? 0)} Taken</span>
                </div>
              </div>

              {/* Legal Info */}
              {(project.legalInfo?.reraNumber || project.legalInfo?.approvalAuthority || project.legalInfo?.titleType) && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-brand-green/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-green" />
                    <h4 className="font-bold text-sm text-brand-charcoal">Legal &amp; Compliance</h4>
                  </div>
                  {project.legalInfo.reraNumber && (
                    <div>
                      <span className="text-[10px] uppercase text-brand-charcoal/50 font-bold block">RERA Number</span>
                      <span className="text-xs font-mono font-bold text-brand-charcoal">{project.legalInfo.reraNumber}</span>
                    </div>
                  )}
                  {project.legalInfo.titleType && (
                    <div>
                      <span className="text-[10px] uppercase text-brand-charcoal/50 font-bold block">Title Type</span>
                      <span className="text-xs font-bold text-brand-green">{project.legalInfo.titleType}</span>
                    </div>
                  )}
                  {project.legalInfo.approvalAuthority && (
                    <div>
                      <span className="text-[10px] uppercase text-brand-charcoal/50 font-bold block">Approved By</span>
                      <span className="text-xs font-bold text-brand-charcoal">{project.legalInfo.approvalAuthority}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white rounded-3xl border border-brand-green/10 overflow-hidden h-[320px] sm:h-[400px] lg:h-[440px]">
            {hasValidCoords(project.latitude, project.longitude) ? (
              <LocationMap
                latitude={project.latitude}
                longitude={project.longitude}
                title={project.name}
                className="rounded-3xl"
              />
            ) : mapEmbedSrc ? (
              <iframe
                title="Project Location Map"
                src={mapEmbedSrc}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
              />
            ) : project.googleMapsUrl ? (
              <a href={project.googleMapsUrl} target="_blank" rel="noreferrer" className="flex h-full items-center justify-center text-sm font-bold text-brand-green">
                Open project location in Google Maps
              </a>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-brand-charcoal/50 px-6 text-center">
                Map location will appear after it is pinned on this project in admin.
              </div>
            )}
          </div>
          <PlotStatusGrid
            plots={filteredPlots}
            onSelectPlot={setSelectedPlot}
            onInquiry={handlePlotInquiry}
            onBook={handlePlotBook}
          />
        </section>
      </div>
      </div>
    </div>
  )
}
