'use client'

import * as React from 'react'
import { getApiBaseUrl } from '@/utils/api'
import { AgentCard } from '@/components/real-estate/AgentCard'
import { SectionHeading } from '@/components/real-estate/SectionHeading'
import { RefreshCw, Users } from 'lucide-react'
import { PageSection } from '@/components/layout/PageSection'

export default function AgentsPage() {
  const [agentsList, setAgentsList] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchLiveAgents()
  }, [])

  const fetchLiveAgents = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${getApiBaseUrl()}/public/agents`).catch(() => null)
      if (res && res.ok) {
        const data = await res.json().catch(() => null)
        if (Array.isArray(data)) {
          setAgentsList(data)
          return
        }
      }
      setAgentsList([])
    } catch (e) {
      console.error('Failed to fetch agents:', e)
      setAgentsList([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageSection tone="white">
      <div className="flex items-start justify-between gap-4 mb-2">
        <SectionHeading
          eyebrow="ADVISORY TEAM"
          title="Private Real Estate Advisors"
          subtitle="Our senior partners bring unmatched market intelligence, discretion, and architectural knowledge to every client engagement."
        />
        <button
          onClick={fetchLiveAgents}
          className="p-2.5 bg-brand-soft border border-brand-green/20 text-brand-green rounded-xl hover:bg-brand-green hover:text-white transition-all cursor-pointer shrink-0"
          title="Refresh live advisory team"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : agentsList.length === 0 ? (
        <div className="bg-gray-100 border border-brand-green/15 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-brand-green mx-auto" />
          <h3 className="font-serif text-2xl text-brand-charcoal font-semibold">No Advisors Found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {agentsList.map((agent) => (
            <AgentCard key={agent.id || agent._id} agent={agent} />
          ))}
        </div>
      )}
    </PageSection>
  )
}
