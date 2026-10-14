import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Agent } from '@/data/agents'
import { Phone, ArrowUpRight } from 'lucide-react'

interface AgentCardProps {
  agent: Agent
  className?: string
}

export function AgentCard({ agent, className = '' }: AgentCardProps) {
  const nameParts = (agent.name || 'Sales Executive').trim().split(/\s+/);
  const initials = (agent as any).initials || (
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : (agent.name || 'AG').slice(0, 2).toUpperCase()
  );

  return (
    <div className={`group bg-white border border-brand-green/15 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-green/40 transition-all duration-300 shadow-sm ${className}`}>
      <div className="space-y-5">
        {/* Agent Initials Badge */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-gradient-to-br from-[#0B4F3C] via-[#0B241C] to-[#063B2D] border-2 border-amber-400/40 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <span className="font-serif font-bold text-xl sm:text-2xl text-amber-300 tracking-wider">
              {initials}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-brand-green block">
              {agent.location || 'Executive Desk'}
            </span>
            <Link href={`/agents/${agent.slug}`}>
              <h3 className="font-serif text-xl sm:text-2xl text-brand-charcoal font-semibold group-hover:text-brand-green transition-colors">
                {agent.name}
              </h3>
            </Link>
            <p className="text-xs text-brand-charcoal/70 font-semibold">{agent.title}</p>
          </div>
        </div>


        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-brand-green/10 text-center font-mono">
          <div>
            <span className="block text-[10px] text-brand-charcoal/60 uppercase font-semibold">Sales Volume</span>
            <span className="text-sm font-bold text-brand-charcoal">{agent.totalSalesVolume}</span>
          </div>
          <div>
            <span className="block text-[10px] text-brand-charcoal/60 uppercase font-semibold">Active Listings</span>
            <span className="text-sm font-bold text-brand-charcoal">{agent.activeListingsCount} Estates</span>
          </div>
        </div>

        <p className="text-xs text-brand-charcoal/80 line-clamp-3 font-light leading-relaxed">
          {agent.bio}
        </p>
      </div>

      {/* Actions */}
      <div className="pt-6 border-t border-brand-green/10 flex items-center justify-between gap-3">
        <a
          href={`tel:${agent.phone.replace(/\s+/g, '')}`}
          className="flex-1 py-2.5 bg-brand-soft hover:bg-brand-green hover:text-white border border-brand-green/20 text-brand-green text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call</span>
        </a>

        <Link
          href={`/agents/${agent.slug}`}
          className="flex-1 py-2.5 bg-brand-green hover:bg-brand-dark text-white text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
        >
          <span className="text-white">Profile</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-white" />
        </Link>
      </div>
    </div>
  )
}
