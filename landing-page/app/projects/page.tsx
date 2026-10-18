'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Building2,
  MapPin,
  ArrowUpRight,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  ShieldCheck,
  Landmark,
} from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'
import { scrollToSection } from '@/utils/scroll'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500 text-white',
  UPCOMING: 'bg-amber-400 text-amber-900',
  COMPLETED: 'bg-sky-500 text-white',
}

const DHOLERA_HIGHLIGHTS = [
  { icon: TrendingUp,  label: 'High ROI Potential',  desc: 'DMIC-driven infrastructure push projected to multiply land values 5–10x' },
  { icon: ShieldCheck, label: 'Government Backed',   desc: 'Directly under Gujarat Government & Delhi-Mumbai Industrial Corridor' },
  { icon: Landmark,    label: 'Smart City Ready',    desc: `India's first greenfield smart city with world-class urban planning` },
  { icon: Building2,   label: 'Freehold NA Plots',   desc: 'Clear legal titles, RERA-approved with transparent documentation' },
]

// ─── inner component that reads searchParams (must be inside Suspense) ───────
function ProjectsInner() {
  const searchParams = useSearchParams()
  const initialDholera = searchParams.get('filter') === 'dholera'

  const [projects, setProjects] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [dholeraOnly, setDholeraOnly] = React.useState(initialDholera)
  const [search, setSearch] = React.useState('')

  React.useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/public/projects`, { cache: 'no-store' }).catch(() => null)
      if (res && res.ok) {
        const data = await res.json().catch(() => null)
        setProjects(Array.isArray(data) ? data : (data?.data || []))
      }
    } catch (e) {
      console.error('Projects fetch error', e)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = projects.filter((p) => {
    // Dholera filter: only show if isDholera === true
    if (dholeraOnly && !p.isDholera) return false
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const dholeraCount = projects.filter(p => p.isDholera).length

  return (
    <div className="min-h-screen bg-white">

      {/* ── DHOLERA HERO (shown only when dholeraOnly=true) ── */}
      {dholeraOnly ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-amber-900 to-[#171A18] text-white">
          <div
            className="absolute inset-0 z-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 10% 50%, #f59e0b 0%, transparent 55%), radial-gradient(circle at 90% 10%, #0B4F3C 0%, transparent 50%)' }}
          />
          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-10">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              Special Investment Region · Gujarat, India
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="font-serif text-4xl sm:text-6xl font-semibold leading-[1.1]">
                Dholera <span className="text-amber-400">Special Investment</span> Region
              </h1>
              <p className="text-sm sm:text-base text-white/75 font-light leading-relaxed max-w-2xl">
                India&apos;s largest planned greenfield smart city, spread across 920 sq km, developed under the
                Delhi-Mumbai Industrial Corridor (DMIC). Backed by the Government of India and the Government of
                Gujarat — Dholera SIR is the country&apos;s single largest infrastructure project.
              </p>
              <p className="text-sm text-white/60 font-light leading-relaxed max-w-2xl">
                Invest in demarcated freehold NA land plots with clear legal title and RERA approval. With
                world-class connectivity — including a 6-lane expressway, metro rail, and a dedicated
                international airport — Dholera SIR is positioned as the investment opportunity of the decade.
              </p>
            </div>

            {/* Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DHOLERA_HIGHLIGHTS.map((h) => {
                const Icon = h.icon
                return (
                  <div
                    key={h.label}
                    className="bg-white/10 border border-amber-400/20 backdrop-blur-sm rounded-2xl p-5 space-y-2 hover:bg-white/15 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-xs font-extrabold text-amber-300">{h.label}</p>
                    <p className="text-[11px] text-white/65 leading-relaxed font-light">{h.desc}</p>
                  </div>
                )
              })}
            </div>

            {/* Search */}
            <div className="max-w-md relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/50" />
              <label htmlFor="search-dholera" className="sr-only">Search Dholera projects</label>
              <input
                id="search-dholera"
                type="text"
                placeholder="Search Dholera projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') scrollToSection('projects-results', { blur: true })
                }}
                enterKeyHint="search"
                className="input-base input-on-dark pl-11"
              />
            </div>
          </div>
        </div>
      ) : (
        /* ── DEFAULT HERO ── */
        <div className="relative bg-brand-charcoal text-white overflow-hidden">
          <div
            className="absolute inset-0 z-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #0B4F3C 0%, transparent 60%), radial-gradient(circle at 80% 20%, #C9A96E 0%, transparent 50%)' }}
          />
          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A96E]">Real Estate Investments</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-white leading-[1.1] max-w-3xl">
              Township Projects &amp; <br />
              <span className="text-[#C9A96E]">Masterplan Developments</span>
            </h1>
            <p className="mt-4 text-sm text-white/70 max-w-xl font-light">
              Explore prime demarcated land plots, active township developments, and high-yield real estate investment opportunities.
            </p>
            <div className="mt-8 max-w-md relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/50" />
              <label htmlFor="search-projects" className="sr-only">Search projects</label>
              <input
                id="search-projects"
                type="text"
                placeholder="Search by project name, location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') scrollToSection('projects-results', { blur: true })
                }}
                enterKeyHint="search"
                className="input-base input-on-dark pl-11"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER TABS & CONTENT ── */}
      <div className="bg-gray-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div id="projects-results" className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            {/* Dholera / All toggle */}
            <div className="flex items-center gap-1 bg-white border border-amber-200 p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setDholeraOnly(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !dholeraOnly ? 'bg-[#0B4F3C] text-white shadow-sm' : 'text-brand-charcoal/70 hover:text-brand-charcoal'
                }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setDholeraOnly(true)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dholeraOnly ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                Special Dholera ({dholeraCount})
              </button>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 bg-white border border-brand-green/20 p-1 rounded-xl shadow-sm">
              {['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === s ? 'bg-brand-green text-white shadow-sm' : 'text-brand-charcoal/70 hover:text-brand-charcoal'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToSection('projects-list')}
              className="text-xs text-brand-charcoal/70 font-semibold px-3 py-1.5 rounded-xl border border-brand-green/20 bg-white hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
              title="Jump to projects"
            >
              {filtered.length} {filtered.length === 1 ? 'Project' : 'Projects'} ↓
            </button>
            <button
              onClick={fetchProjects}
              className="p-2 bg-white border border-brand-green/20 text-brand-green rounded-xl hover:bg-brand-green hover:text-white transition-all cursor-pointer shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-brand-green/10 animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-brand-green/15 rounded-3xl p-16 text-center space-y-4 shadow-sm">
            <Star className={`w-14 h-14 mx-auto ${dholeraOnly ? 'text-amber-400 fill-amber-200' : 'text-brand-green/40'}`} />
            <h3 className="font-serif text-xl text-brand-charcoal font-bold">
              {dholeraOnly ? 'No Dholera Projects Yet' : 'No Projects Found'}
            </h3>
            <p className="text-xs text-brand-charcoal/60 max-w-sm mx-auto">
              {dholeraOnly
                ? 'No projects are tagged as Special Dholera SIR yet. New Dholera plot launches will appear here — stay tuned.'
                : search
                ? 'No projects match your search. Try a different keyword.'
                : 'Check back soon for new township launches and land plot releases.'}
            </p>
            {dholeraOnly && (
              <button
                onClick={() => setDholeraOnly(false)}
                className="text-xs font-bold text-brand-green underline cursor-pointer"
              >
                View All Projects
              </button>
            )}
            {search && !dholeraOnly && (
              <button onClick={() => setSearch('')} className="text-xs font-bold text-brand-green underline cursor-pointer">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div id="projects-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((proj) => (
              <ProjectCard key={proj._id} proj={proj} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

// ─── Page export: wraps inner in Suspense (required by Next.js 15 for useSearchParams) ─
export default function PublicProjectsPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0B4F3C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProjectsInner />
    </React.Suspense>
  )
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ proj }: { proj: any }) {
  const statusColor = STATUS_COLORS[proj.status] || 'bg-gray-500 text-white'
  const availPct = proj.totalPlots
    ? Math.round(((proj.availableCount ?? 0) / proj.totalPlots) * 100)
    : 0
  const showBanner = Boolean(proj.bannerImage)

  return (
    <Link
      href={`/projects/${proj._id}`}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-brand-green/10 hover:shadow-xl hover:border-brand-green/30 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-charcoal">
        {showBanner ? (
          <Image src={proj.bannerImage} alt={proj.name || 'Project'} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 bg-brand-green/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusColor}`}>
            {proj.status || 'ACTIVE'}
          </span>
          {proj.isDholera && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold">
              <Star className="w-2.5 h-2.5 fill-amber-900" /> Dholera SIR
            </span>
          )}
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white font-mono text-[10px] rounded-lg">{proj.code}</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
            <span className="font-medium">{proj.location}</span>
          </div>
          <h3 className="font-serif text-xl font-bold text-white leading-tight group-hover:text-[#C9A96E] transition-colors">
            {proj.name}
          </h3>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#E8F0EC] rounded-xl p-2.5 border border-brand-green/15">
            <span className="text-[10px] text-brand-charcoal/60 font-bold uppercase block">Total</span>
            <span className="text-base font-extrabold text-brand-charcoal">{proj.totalPlots || 0}</span>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Available</span>
            <span className="text-base font-extrabold text-emerald-700">{proj.availableCount ?? 0}</span>
          </div>
          <div className="bg-red-50 rounded-xl p-2.5 border border-red-200">
            <span className="text-[10px] text-red-700 font-bold uppercase block">Sold</span>
            <span className="text-base font-extrabold text-red-700">{proj.soldCount ?? 0}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-brand-charcoal/60 font-bold uppercase">Availability</span>
            <span className="text-[10px] font-extrabold text-brand-green">{availPct}% Available</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-green to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${availPct}%` }} />
          </div>
        </div>

        {(proj.priceRange || proj.basePricePerSqft) && (
          <div className="text-xs font-bold text-brand-green bg-[#E8F0EC] px-3 py-1.5 rounded-lg border border-brand-green/15 text-center">
            {proj.priceRange || `₹${proj.basePricePerSqft?.toLocaleString('en-IN')} / sq ft`}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-xs text-brand-charcoal/50 font-medium">
            {proj.area || `${((proj.totalAreaSqft || 0) / 43560).toFixed(1)} Acres`}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-green group-hover:gap-2 transition-all">
            View Project <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
