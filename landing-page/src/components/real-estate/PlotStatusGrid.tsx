'use client'

import * as React from 'react'
import {
  derivePlotType,
  statusBadgeClass,
  statusDotColor,
  totalPlcPercent,
} from '@/components/real-estate/NakshaDotMap'

type PlotStatusGridProps = {
  plots: any[]
  onSelectPlot?: (plot: any) => void
  onInquiry?: (plot: any) => void
  onBook?: (plot: any) => void
}

function cellStyle(status: string): string {
  if (status === 'SOLD') return 'bg-red-500 text-white border-red-700'
  if (status === 'BOOKED') return 'bg-amber-400 text-amber-950 border-amber-600'
  if (status === 'PENDING') return 'bg-yellow-300 text-yellow-950 border-yellow-500'
  return 'bg-emerald-500 text-white border-emerald-700'
}

function sortPlots(plots: any[]) {
  return [...plots].sort((a, b) =>
    String(a.plotNo).localeCompare(String(b.plotNo), undefined, { numeric: true, sensitivity: 'base' })
  )
}

export function PlotStatusGrid({ plots, onSelectPlot, onInquiry, onBook }: PlotStatusGridProps) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const [anchor, setAnchor] = React.useState({ x: 50, y: 50 })
  const hideTimer = React.useRef<number | null>(null)
  const list = sortPlots(plots || [])
  const hovered = list.find((plot) => plot._id === hoveredId) || null
  const cardBelow = anchor.y < 48
  const cardRight = anchor.x > 58

  const placeCard = (el: HTMLElement) => {
    const box = boxRef.current
    if (!box) return
    const bounds = box.getBoundingClientRect()
    const cell = el.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const next = {
      x: ((cell.left + cell.width / 2 - bounds.left) / bounds.width) * 100,
      y: ((cell.top + cell.height / 2 - bounds.top) / bounds.height) * 100,
    }
    setAnchor({
      x: Math.min(96, Math.max(4, next.x)),
      y: Math.min(92, Math.max(8, next.y)),
    })
  }

  const showPlot = (id: string, el?: HTMLElement | null) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    setHoveredId(id)
    if (el) placeCard(el)
  }
  const hidePlot = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setHoveredId(null), 160)
  }

  return (
    <div className="bg-white rounded-3xl border border-brand-green/10 p-4 sm:p-5 h-[50vh] lg:h-full min-h-0 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal">Plot Inventory</h3>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-brand-charcoal">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-300 border border-yellow-500" /> Pending</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> Sold</span>
        </div>
      </div>

      <div ref={boxRef} className="relative flex-1 min-h-0 rounded-2xl border border-brand-green/15 bg-[#f7f4ee] overflow-visible">
        <div className="h-full overflow-y-auto p-3 sm:p-4">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
          {list.map((plot) => {
            const status = String(plot.status || 'AVAILABLE').toUpperCase()
            const isHovered = hoveredId === plot._id
            return (
              <button
                key={plot._id}
                type="button"
                className={`relative aspect-[1.15] rounded-md border text-[11px] sm:text-xs font-extrabold leading-tight flex flex-col items-center justify-center px-1 transition-transform cursor-pointer ${cellStyle(status)} ${
                  isHovered ? 'z-10 scale-105 shadow-lg ring-2 ring-black/30' : 'hover:scale-105'
                }`}
                onMouseEnter={(e) => showPlot(plot._id, e.currentTarget)}
                onMouseLeave={hidePlot}
                onFocus={(e) => showPlot(plot._id, e.currentTarget)}
                onBlur={hidePlot}
                onClick={() => onSelectPlot?.(plot)}
                aria-label={`Plot ${plot.plotNo}, ${status}`}
              >
                <span>{plot.plotNo}</span>
                {status !== 'AVAILABLE' && (
                  <span className="text-[8px] font-bold uppercase tracking-wide opacity-90">{status}</span>
                )}
              </button>
            )
          })}
        </div>
        </div>

        {hovered && (
          <div
            className="absolute z-30 w-56 pointer-events-auto bg-white text-black text-left rounded-2xl shadow-2xl border border-black/10 p-3"
            style={{
              left: `${anchor.x}%`,
              top: cardBelow ? `${anchor.y}%` : undefined,
              bottom: cardBelow ? undefined : `${100 - anchor.y}%`,
              transform: cardRight ? 'translate(calc(-100% - 10px), 0)' : 'translate(10px, 0)',
              marginTop: cardBelow ? 8 : undefined,
              marginBottom: cardBelow ? undefined : 8,
            }}
            onMouseEnter={() => showPlot(hovered._id)}
            onMouseLeave={hidePlot}
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-black bg-black/5 px-1.5 py-0.5 rounded">
                Plot {hovered.plotNo}
              </span>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${statusBadgeClass(hovered.status)}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusDotColor(hovered.status) }} />
                {hovered.status}
              </span>
            </div>
            <dl className="space-y-1 text-[10px] text-black">
              <Row label="Status" value={hovered.status || 'AVAILABLE'} />
              <Row label="Plot Type" value={derivePlotType(hovered)} />
              {hovered.sizeSqft ? <Row label="Plot Area Sq.Ft" value={Number(hovered.sizeSqft).toLocaleString('en-IN')} /> : null}
              <Row label="PLC %" value={totalPlcPercent(hovered) || 0} />
              {hovered.totalCost || hovered.price ? (
                <Row label="Est. Cost" value={`₹${Number(hovered.totalCost || hovered.price).toLocaleString('en-IN')}`} />
              ) : null}
            </dl>
            <div className="mt-3 pt-2 border-t border-black/10 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="px-2 py-2 rounded-xl bg-black text-white text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onInquiry?.(hovered)
                  onSelectPlot?.(hovered)
                }}
              >
                Inquiry
              </button>
              <button
                type="button"
                disabled={hovered.status !== 'AVAILABLE'}
                className="px-2 py-2 rounded-xl bg-brand-green text-white text-[10px] font-extrabold uppercase tracking-wider cursor-pointer disabled:opacity-40"
                onClick={(e) => {
                  e.stopPropagation()
                  onBook?.(hovered)
                  onSelectPlot?.(hovered)
                }}
              >
                Book Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-black/55">{label}</dt>
      <dd className="font-bold text-black text-right">{value}</dd>
    </div>
  )
}
