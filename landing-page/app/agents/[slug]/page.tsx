import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AGENTS, Agent } from '@/data/agents'
import { getApiBaseUrl } from '@/utils/api'
import { PROPERTIES } from '@/data/properties'
import { PropertyGrid } from '@/components/real-estate/PropertyGrid'
import { InquiryForm } from '@/components/real-estate/InquiryForm'
import { ChevronRight, Star } from 'lucide-react'
import { PageSection } from '@/components/layout/PageSection'

interface AgentPageProps {
  params: Promise<{
    slug: string
  }>
}

/**
 * The /agents listing renders LIVE agents from the API (slug = employee code),
 * so detail pages must resolve those too — not only the static showcase data,
 * otherwise every live agent card links to a 404.
 */
async function resolveAgent(rawSlug: string): Promise<Agent | null> {
  let slug = rawSlug
  try {
    slug = decodeURIComponent(rawSlug)
  } catch {
    // keep raw slug
  }
  const staticAgent = AGENTS.find((a) => a.slug === slug || a.slug === rawSlug)
  if (staticAgent) return staticAgent

  try {
    const res = await fetch(`${getApiBaseUrl()}/public/agents`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data)) return null
    const live = data.find((a: any) => a?.slug === slug || a?.slug === rawSlug)
    if (!live) return null
    return {
      id: String(live.id || ''),
      slug: String(live.slug || slug),
      name: live.name || 'Sales Executive',
      title: live.title || 'Advisory Executive',
      avatar: live.avatar || '',
      phone: live.phone || '',
      email: live.email || '',
      location: live.location || 'Executive Desk',
      experienceYears: Number(live.experienceYears) || 0,
      activeListingsCount: Number(live.activeListingsCount) || 0,
      totalSalesVolume: live.totalSalesVolume || '0 Plots Sold',
      rating: Number(live.rating) || 5,
      reviewCount: Number(live.reviewCount) || 0,
      bio: live.bio || '',
      specialties: Array.isArray(live.specialties) ? live.specialties : [],
      socials: live.socials || {},
    }
  } catch {
    return null
  }
}

export async function generateStaticParams() {
  return AGENTS.map((a) => ({
    slug: a.slug,
  }))
}

export async function generateMetadata({ params }: AgentPageProps) {
  const resolvedParams = await params
  const agent = await resolveAgent(resolvedParams.slug)
  if (!agent) return { title: 'Advisor Not Found' }

  return {
    title: `${agent.name} — ${agent.title}`,
    description: agent.bio,
  }
}

export default async function AgentDetailPage({ params }: AgentPageProps) {
  const resolvedParams = await params
  const agent = await resolveAgent(resolvedParams.slug)

  if (!agent) {
    notFound()
  }

  // Active listings represented by this agent
  const agentProperties = PROPERTIES.filter((p) => p.agentId === agent.id)

  return (
    <div>
      <PageSection tone="white">
        <nav className="flex items-center space-x-2 text-xs text-brand-charcoal/50 mb-8">
          <Link href="/" className="hover:text-brand-green">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/agents" className="hover:text-brand-green">Advisors</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-brand-charcoal font-semibold">{agent.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-brand-green/15">
            {agent.avatar ? (
              <Image
                src={agent.avatar}
                alt={agent.name}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0B4F3C] via-[#0B241C] to-[#063B2D]">
                <span className="font-serif font-semibold text-6xl text-[#C9A96E] tracking-wider">
                  {agent.name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] font-bold text-brand-green">
                {agent.location} Desk
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl text-brand-charcoal font-semibold">
                {agent.name}
              </h1>
              <p className="text-base text-brand-charcoal/70">{agent.title}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 border-y border-brand-green/15 text-center">
              <div>
                <span className="block text-xs text-brand-charcoal/50 uppercase font-bold">Experience</span>
                <span className="text-lg font-semibold text-brand-charcoal font-serif">{agent.experienceYears} Years</span>
              </div>
              <div>
                <span className="block text-xs text-brand-charcoal/50 uppercase font-bold">Sales Volume</span>
                <span className="text-lg font-semibold text-brand-charcoal font-serif">{agent.totalSalesVolume}</span>
              </div>
              <div>
                <span className="block text-xs text-brand-charcoal/50 uppercase font-bold">Client Rating</span>
                <span className="text-lg font-semibold text-brand-charcoal font-serif inline-flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-[#C9A96E] text-[#C9A96E]" />
                  {agent.rating}
                </span>
              </div>
            </div>

            <p className="text-base text-brand-charcoal/70 leading-relaxed">
              {agent.bio}
            </p>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs uppercase tracking-wider text-brand-green font-bold">Specialty Focus</h4>
              <div className="flex flex-wrap gap-2">
                {agent.specialties.map((s) => (
                  <span key={s} className="px-3 py-1 bg-gray-100 border border-brand-green/15 text-sm text-brand-charcoal rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection tone="muted">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-6">
            <h3 className="font-serif text-3xl text-brand-charcoal font-semibold">
              Active Listings Represented by {agent.name}
            </h3>
            <PropertyGrid properties={agentProperties} columns={2} variant="B" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <InquiryForm agentName={agent.name} />
          </div>
        </div>
      </PageSection>
    </div>
  )
}
