'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HouseAndSkyLogo } from './HouseAndSkyLogo'
import { AnnouncementTicker } from './AnnouncementTicker'
import { getApiBaseUrl } from '@/utils/api'
import { SITE } from '@/utils/siteConfig'
import { useOwnerAuth } from '@/stores/auth.store'
import { Bookmark, Menu, X, PhoneCall, ChevronDown, Mail, Facebook, MessageCircle, UserCircle, LogOut, Home, LogIn, Flame, Star } from 'lucide-react'

interface NavProject {
  _id: string
  name: string
  isDholera?: boolean
}

const MAIN_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Properties', href: '/properties' },
  { label: 'Get In Touch', href: '/contact' }
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobileAboutOpen, setIsMobileAboutOpen] = React.useState(false)
  const [isMobileProjectsOpen, setIsMobileProjectsOpen] = React.useState(false)
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = React.useState(false)
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)
  const [projects, setProjects] = React.useState<NavProject[]>([])

  // Owner auth
  const { isAuthenticated, user, logout } = useOwnerAuth()

  const handleOwnerLogout = () => {
    logout()
    router.push('/')
  }

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    setIsMobileMenuOpen(false)
    setOpenMenu(null)
    setIsMobileAboutOpen(false)
    setIsMobileProjectsOpen(false)
    setIsMobilePropertiesOpen(false)
  }, [pathname])

  React.useEffect(() => {
    const baseUrl = getApiBaseUrl()
    fetch(`${baseUrl}/public/projects`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProjects(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setProjects([]))
  }, [])

  const whatsappHref = `https://wa.me/${SITE.whatsapp}`
  const mailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${SITE.email}`
  const telHref = `tel:${SITE.phoneTel}`

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))
  const linkClass = (href: string) =>
    `text-[12px] lg:text-[13px] xl:text-[14px] uppercase tracking-[0.08em] lg:tracking-[0.1em] xl:tracking-[0.12em] font-bold py-1.5 transition-colors whitespace-nowrap ${isActive(href) && (href !== '/' || pathname === '/')
      ? 'text-brand-green'
      : 'text-brand-charcoal hover:text-brand-green'
    }`

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-brand-green/10 shadow-sm'
            : 'bg-white/90 backdrop-blur-sm border-b border-brand-green/5'
          }`}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-5 xl:px-8 py-3 sm:py-3.5 relative z-20">
          <div className="flex items-center justify-between gap-2 lg:gap-3 xl:gap-6">
            <Link href="/" className="focus:outline-none shrink-0">
              <HouseAndSkyLogo variant="dark" showTagline={true} size="sm" />
            </Link>

            <nav className="hidden lg:flex items-center gap-4 xl:gap-7">
              <Link href="/" className={linkClass('/')}>Home</Link>

              <div className="relative" onMouseEnter={() => setOpenMenu('about')} onMouseLeave={() => setOpenMenu(null)}>
                <Link href="/about" className={`inline-flex items-center gap-1 ${linkClass('/about')}`}>
                  About Us <ChevronDown className="w-3.5 h-3.5" />
                </Link>
                {openMenu === 'about' && (
                  <div className="absolute top-full left-0 pt-2 min-w-[190px] z-[100]">
                    <div className="bg-white border border-brand-green/15 rounded-xl shadow-xl py-1.5 overflow-hidden">
                      <Link href="/about" className="block px-4 py-2.5 text-xs font-semibold text-brand-charcoal hover:bg-brand-soft hover:text-brand-green transition-colors">Brand Story</Link>
                      <Link href="/services" className="block px-4 py-2.5 text-xs font-semibold text-brand-charcoal hover:bg-brand-soft hover:text-brand-green transition-colors">Services</Link>
                      <Link href="/gallery" className="block px-4 py-2.5 text-xs font-semibold text-brand-charcoal hover:bg-brand-soft hover:text-brand-green transition-colors">Gallery</Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" onMouseEnter={() => setOpenMenu('projects')} onMouseLeave={() => setOpenMenu(null)}>
                <Link href="/projects" className={`inline-flex items-center gap-1 ${linkClass('/projects')}`}>
                  Projects <ChevronDown className="w-3.5 h-3.5" />
                </Link>
                {openMenu === 'projects' && (
                  <div className="absolute top-full left-0 pt-2 min-w-[260px] z-[100]">
                    <div className="bg-white border border-brand-green/15 rounded-xl shadow-xl py-1.5 overflow-hidden">
                      {/* Special Dholera Featured Entry */}
                      <Link
                        href="/projects?filter=dholera"
                        className="flex items-start gap-2.5 px-4 py-3 bg-amber-50/80 border-b border-amber-200 hover:bg-amber-100/80 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-900 text-amber-900" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-amber-900 group-hover:text-amber-700">Special Dholera SIR</p>
                          <p className="text-[10px] text-amber-700/80 leading-tight mt-0.5">India&apos;s largest planned smart city — invest in DMIC-backed plots</p>
                        </div>
                      </Link>
                      <Link href="/projects" className="block px-4 py-2.5 text-xs font-bold text-brand-green hover:bg-brand-soft transition-colors">All Projects</Link>
                      {projects.map((project) => (
                        <Link key={project._id} href={`/projects/${project._id}`} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-brand-charcoal hover:bg-brand-soft hover:text-brand-green transition-colors truncate">
                          {project.isDholera && <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />}
                          {project.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Properties Dropdown with Bulk Deals */}
              <div className="relative" onMouseEnter={() => setOpenMenu('properties')} onMouseLeave={() => setOpenMenu(null)}>
                <Link href="/properties" className={`inline-flex items-center gap-1 ${linkClass('/properties')}`}>
                  Properties <ChevronDown className="w-3.5 h-3.5" />
                </Link>
                {openMenu === 'properties' && (
                  <div className="absolute top-full left-0 pt-2 min-w-[220px] z-[100]">
                    <div className="bg-white border border-brand-green/15 rounded-xl shadow-xl py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                      <Link href="/properties" className="block px-4 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-soft hover:text-brand-green transition-colors">
                        All Property Listings
                      </Link>
                      <Link href="/bulk-deals" className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-amber-700 bg-amber-50/70 hover:bg-amber-100/80 transition-colors">
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
                          Investor Bulk Deals
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded uppercase">
                          HOT
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/contact" className={linkClass('/contact')}>Get In Touch</Link>
            </nav>


            {/* Desktop right side — sleek hierarchy: Phone info | Login/Owner | List Property CTA */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
              {/* Phone info (2xl screens only to avoid mid-screen overflow) */}
              <a
                href={telHref}
                className="hidden 2xl:inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-[0.06em] text-brand-charcoal hover:text-brand-green transition-colors mr-1"
                title="Call Us"
              >
                <PhoneCall className="w-4 h-4 text-brand-green" />
                <span>{SITE.phoneDisplay}</span>
              </a>

              {/* Auth: logged-in → user dropdown pill | logged-out → Login outline button */}
              {isAuthenticated && user ? (
                <div className="relative" onMouseEnter={() => setOpenMenu('owner')} onMouseLeave={() => setOpenMenu(null)}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-2 text-[12px] xl:text-[13px] font-extrabold text-brand-charcoal bg-brand-soft hover:bg-brand-green/10 rounded-full border border-brand-green/20 transition-all whitespace-nowrap"
                  >
                    <UserCircle className="w-4 h-4 text-brand-green" />
                    <span>{user.fullName.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-brand-charcoal/50" />
                  </button>
                  {openMenu === 'owner' && (
                    <div className="absolute top-full right-0 pt-2 min-w-[180px] z-[100]">
                      <div className="bg-white border border-brand-green/15 rounded-xl shadow-xl py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-4 py-2 border-b border-brand-green/10 bg-brand-soft/40">
                          <p className="text-[10px] font-medium text-brand-muted uppercase tracking-wider">Signed in as</p>
                          <p className="text-xs font-bold text-brand-charcoal truncate">{user.fullName}</p>
                        </div>
                        <Link href="/my-properties" className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-brand-charcoal hover:bg-brand-soft hover:text-brand-green transition-colors">
                          <Home className="w-3.5 h-3.5 text-brand-green" /> My Properties
                        </Link>
                        <button
                          type="button"
                          onClick={handleOwnerLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/owner-login"
                  className="inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2 text-[12px] xl:text-[13px] font-extrabold uppercase tracking-[0.08em] text-brand-charcoal hover:text-brand-green border-2 border-brand-charcoal/25 hover:border-brand-green rounded-full transition-all whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 text-brand-green" />
                  <span>Login</span>
                </Link>
              )}

              {/* Primary CTA: List Property — Solid Brand Green pill */}
              <Link
                href="/list-your-property"
                className="inline-flex items-center gap-1.5 px-4 xl:px-5 py-2 text-[12px] xl:text-[13px] font-extrabold uppercase tracking-[0.08em] text-white bg-brand-green hover:bg-brand-dark rounded-full shadow-sm hover:shadow transition-all whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                <span>List Property</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-brand-soft border border-brand-green/20 text-brand-green rounded-md lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnnouncementTicker />
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-brand-green/15">
              <HouseAndSkyLogo variant="dark" showTagline={true} size="sm" />
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-brand-soft rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X className="w-5 h-5 text-brand-green" />
              </button>
            </div>
            <div className="pt-2 space-y-1">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center text-xs uppercase tracking-[0.14em] font-semibold text-brand-charcoal py-4 border-b border-brand-green/10 min-h-[44px]">
                Home
              </Link>

              {/* About Us Accordion */}
              <div className="border-b border-brand-green/10 py-1">
                <button
                  type="button"
                  onClick={() => setIsMobileAboutOpen(!isMobileAboutOpen)}
                  className="w-full flex items-center justify-between py-3 text-xs uppercase tracking-[0.14em] font-semibold text-brand-charcoal cursor-pointer min-h-[44px]"
                >
                  <span>About Us</span>
                  <ChevronDown className={`w-4 h-4 text-brand-green transition-transform duration-200 ${isMobileAboutOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileAboutOpen && (
                  <div className="pl-3 py-1 space-y-1 bg-brand-soft/50 rounded-lg my-1">
                    <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="block text-xs font-semibold text-brand-charcoal py-1.5 hover:text-brand-green">
                      Brand Story
                    </Link>
                    <Link href="/services" onClick={() => setIsMobileMenuOpen(false)} className="block text-xs font-semibold text-brand-charcoal py-1.5 hover:text-brand-green">
                      Services
                    </Link>
                    <Link href="/gallery" onClick={() => setIsMobileMenuOpen(false)} className="block text-xs font-semibold text-brand-charcoal py-1.5 hover:text-brand-green">
                      Gallery
                    </Link>
                  </div>
                )}
              </div>

              {/* Projects Accordion */}
              <div className="border-b border-brand-green/10 py-1">
                <button
                  type="button"
                  onClick={() => setIsMobileProjectsOpen(!isMobileProjectsOpen)}
                  className="w-full flex items-center justify-between py-3 text-xs uppercase tracking-[0.14em] font-semibold text-brand-charcoal cursor-pointer min-h-[44px]"
                >
                  <span>Projects</span>
                  <ChevronDown className={`w-4 h-4 text-brand-green transition-transform duration-200 ${isMobileProjectsOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileProjectsOpen && (
                  <div className="pl-3 py-1 space-y-1 bg-brand-soft/50 rounded-lg my-1">
                    {/* Special Dholera entry */}
                    <Link
                      href="/projects?filter=dholera"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-xs font-extrabold text-amber-800 py-2 px-2 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                      Special Dholera SIR
                    </Link>
                    <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className="block text-xs font-bold text-brand-green py-1.5">
                      All Projects
                    </Link>
                    {projects.map((project) => (
                      <Link
                        key={project._id}
                        href={`/projects/${project._id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-charcoal py-1.5 hover:text-brand-green truncate"
                      >
                        {project.isDholera && <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />}
                        {project.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Properties Accordion */}
              <div className="border-b border-brand-green/10 py-1">
                <button
                  type="button"
                  onClick={() => setIsMobilePropertiesOpen(!isMobilePropertiesOpen)}
                  className="w-full flex items-center justify-between py-3 text-xs uppercase tracking-[0.14em] font-semibold text-brand-charcoal cursor-pointer min-h-[44px]"
                >
                  <span>Properties</span>
                  <ChevronDown className={`w-4 h-4 text-brand-green transition-transform duration-200 ${isMobilePropertiesOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobilePropertiesOpen && (
                  <div className="pl-3 py-1 space-y-1 bg-brand-soft/50 rounded-lg my-1">
                    <Link href="/properties" onClick={() => setIsMobileMenuOpen(false)} className="block text-xs font-bold text-brand-charcoal py-1.5 hover:text-brand-green">
                      All Property Listings
                    </Link>
                    <Link href="/bulk-deals" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between text-xs font-bold text-amber-800 py-1.5 pr-2">
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Investor Bulk Deals
                      </span>
                      <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded">HOT</span>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center text-xs uppercase tracking-[0.14em] font-semibold text-brand-charcoal py-4 border-b border-brand-green/10 min-h-[44px]">
                Get In Touch
              </Link>

              {/* Owner auth section in mobile menu */}
              {isAuthenticated && user ? (
                <>
                  <Link href="/my-properties" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center text-xs uppercase tracking-[0.14em] font-semibold text-brand-charcoal py-4 border-b border-brand-green/10 min-h-[44px]">
                    My Properties
                  </Link>
                  <Link href="/list-your-property" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center text-xs uppercase tracking-[0.14em] font-semibold text-brand-green py-4 border-b border-brand-green/10 min-h-[44px]">
                    List Property
                  </Link>
                  <button
                    type="button"
                    onClick={() => { handleOwnerLogout(); setIsMobileMenuOpen(false) }}
                    className="w-full flex items-center text-left text-xs uppercase tracking-[0.14em] font-semibold text-red-600 py-4 min-h-[44px]"
                  >
                    Logout ({user.fullName.split(' ')[0]})
                  </button>
                </>
              ) : (
                <>
                  <Link href="/owner-login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center text-xs uppercase tracking-[0.14em] font-semibold text-brand-charcoal py-4 border-b border-brand-green/10 min-h-[44px]">
                    Login
                  </Link>
                  <Link href="/owner-register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center text-xs uppercase tracking-[0.14em] font-semibold text-brand-charcoal py-4 border-b border-brand-green/10 min-h-[44px]">
                    Create Account
                  </Link>
                  <Link href="/list-your-property" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center text-xs uppercase tracking-[0.14em] font-bold text-brand-green py-4 min-h-[44px]">
                    List Property
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 pt-5">
              <a href={mailHref} target="_blank" rel="noreferrer" className="flex items-center justify-center p-2 rounded-full bg-brand-soft text-brand-green min-w-[44px] min-h-[44px]" title={`Email: ${SITE.email}`}><Mail className="w-4 h-4" /></a>
              <a href={whatsappHref} className="flex items-center justify-center p-2 rounded-full bg-brand-soft text-brand-green min-w-[44px] min-h-[44px]"><MessageCircle className="w-4 h-4" /></a>
              <a href={SITE.facebook} className="flex items-center justify-center p-2 rounded-full bg-brand-soft text-brand-green min-w-[44px] min-h-[44px]"><Facebook className="w-4 h-4" /></a>
              <a href={telHref} className="ml-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold text-white bg-brand-green rounded-full min-h-[44px]">
                <PhoneCall className="w-3.5 h-3.5" /> Call
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
