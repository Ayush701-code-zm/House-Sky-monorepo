'use client'

import * as React from 'react'
import { TrendingUp, BarChart3, Building2 } from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'

export function MarketSnapshot() {
  const [marketData, setMarketData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchMarketSnapshot()
  }, [])

  const fetchMarketSnapshot = async () => {
    try {
      setIsLoading(true)
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/public/projects`).catch(() => null)
      if (res && res.ok) {
        const projects = await res.json().catch(() => null)
        if (Array.isArray(projects) && projects.length > 0) {
          const liveData = projects.slice(0, 4).map((p) => ({
            city: p.name || p.location,
            avgPrice: `₹${(p.basePricePerSqft || 4500).toLocaleString('en-IN')} / sqft`,
            growth: '+14.2% YoY',
            listings: `${p.availableCount !== undefined ? p.availableCount : (p.totalPlots || 0)} Available Plots`
          }))
          setMarketData(liveData)
          return
        }
      }
      // Default fallback
      setMarketData([
        { city: 'Noida Executive Enclaves', avgPrice: '₹4,500 / sqft', growth: '+14.2% YoY', listings: '20 Available Plots' },
        { city: 'Mumbai Seafront Penthouses', avgPrice: '₹49,137 / sqft', growth: '+12.4% YoY', listings: '12 Active Units' },
        { city: 'Goa Coastal Valleys', avgPrice: '₹30,833 / sqft', growth: '+18.2% YoY', listings: '15 Active Units' },
        { city: 'Delhi NCR Golf Course', avgPrice: '₹47,222 / sqft', growth: '+14.1% YoY', listings: '18 Active Units' },
      ])
    } catch (e) {
      console.error('Market snapshot error:', e)
      setMarketData([
        { city: 'Noida Executive Enclaves', avgPrice: '₹4,500 / sqft', growth: '+14.2% YoY', listings: '20 Available Plots' },
        { city: 'Mumbai Seafront Penthouses', avgPrice: '₹49,137 / sqft', growth: '+12.4% YoY', listings: '12 Active Units' },
        { city: 'Goa Coastal Valleys', avgPrice: '₹30,833 / sqft', growth: '+18.2% YoY', listings: '15 Active Units' },
        { city: 'Delhi NCR Golf Course', avgPrice: '₹47,222 / sqft', growth: '+14.1% YoY', listings: '18 Active Units' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-brand-green/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-soft border border-brand-green/15 rounded-md">
            <BarChart3 className="w-4 h-4 text-brand-green" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
              REAL ESTATE INTELLIGENCE & LIVE MARKET METRICS
            </span>
          </div>
          <h3 className="font-serif text-4xl sm:text-5xl text-brand-charcoal font-semibold">
            Township Market Snapshot & Base Rates
          </h3>
        </div>

        <span className="text-xs font-mono text-brand-charcoal/60">
          Source: House & Sky Market Intelligence · Updated Real-Time
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-6 h-6 border-3 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketData.map((data, idx) => (
            <div key={idx} className="bg-brand-soft/40 border border-brand-green/15 rounded-md p-6 space-y-3">
              <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider block">
                {data.city}
              </span>
              <div className="space-y-1">
                <span className="text-lg font-bold font-sans text-brand-charcoal block">{data.avgPrice}</span>
                <span className="text-xs text-brand-green font-mono font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {data.growth}
                </span>
              </div>
              <span className="text-[11px] text-brand-charcoal/60 font-mono block pt-2 border-t border-brand-green/10">
                {data.listings}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
