'use client'

import * as React from 'react'
import Image from 'next/image'

export const DOT_GREEN = '#22C55E'
export const DOT_YELLOW = '#EAB308'
export const DOT_RED = '#EF4444'

/** Hippo-style type fills (semi-transparent over the naksha). */
const TYPE_FILL: Record<string, string> = {
  COMMERCIAL: 'rgba(37, 99, 235, 0.45)',
  CORNER: 'rgba(249, 115, 22, 0.45)',
  CORNER_PLOT: 'rgba(249, 115, 22, 0.45)',
  GARDEN: 'rgba(34, 197, 94, 0.45)',
  GARDEN_FACING: 'rgba(34, 197, 94, 0.45)',
  PARK_FACING: 'rgba(34, 197, 94, 0.45)',
  LIG: 'rgba(107, 114, 128, 0.45)',
  EWS: 'rgba(234, 179, 8, 0.45)',
  SIMPLE: 'rgba(251, 146, 60, 0.38)',
}

const TYPE_LEGEND = [
  { key: 'COMMERCIAL', label: 'Commercial', color: '#2563EB' },
  { key: 'CORNER', label: 'Corner Plot', color: '#F97316' },
  { key: 'GARDEN', label: 'Garden Facing', color: '#22C55E' },
  { key: 'SIMPLE', label: 'Simple', color: '#FB923C' },
  { key: 'LIG', label: 'LIG Plot', color: '#6B7280' },
  { key: 'EWS', label: 'EWS Plot', color: '#EAB308' },
]

export function statusDotColor(status: string): string {
  if (status === 'SOLD') return DOT_RED
  if (status === 'AVAILABLE') return DOT_GREEN
  return DOT_YELLOW
}

export function statusBlockClass(status: string): string {
  if (status === 'SOLD') return 'bg-red-600/95 hover:bg-red-600 text-white border-red-200 shadow-red-900/30'
  if (status === 'AVAILABLE') return 'bg-emerald-600/95 hover:bg-emerald-600 text-white border-emerald-200 shadow-emerald-900/30'
  return 'bg-amber-500/95 hover:bg-amber-500 text-white border-amber-200 shadow-amber-900/30'
}

export function statusBadgeClass(status: string): string {
  if (status === 'AVAILABLE') return 'text-emerald-700 bg-emerald-100'
  if (status === 'SOLD') return 'text-red-700 bg-red-100'
  if (status === 'BOOKED') return 'text-sky-700 bg-sky-100'
  return 'text-amber-700 bg-amber-100'
}

export function hasPinnedMarker(plot: any): boolean {
  const rawX = plot?.marker?.xPercent
  const rawY = plot?.marker?.yPercent
  if (rawX === null || rawX === undefined || rawY === null || rawY === undefined) return false
  const x = Number(rawX)
  const y = Number(rawY)
  if (x === 0 && y === 0) return false
  return Number.isFinite(x) && Number.isFinite(y)
}

export function deriveFacing(plot: any): string {
  if (plot?.facing) return plot.facing
  if (Number(plot?.plcParkFacing) > 0) return 'Park / Garden Facing'
  if (Number(plot?.plcCorner) > 0) return 'Corner Plot'
  if (Number(plot?.plc12mtr) > 0) return '12m Road Facing'
  if (Number(plot?.plc9mtr) > 0) return '9m Road Facing'
  return 'Standard'
}

export function derivePlotType(plot: any): string {
  if (plot?.plotType && plot.plotType !== 'SIMPLE') return String(plot.plotType).replace(/_/g, ' ')
  const facing = deriveFacing(plot)
  if (facing !== 'Standard') return facing
  return 'Simple'
}

function typeFillKey(plot: any): string {
  const raw = String(plot?.plotType || '').toUpperCase().replace(/\s+/g, '_')
  if (raw && TYPE_FILL[raw]) return raw
  const facing = deriveFacing(plot).toLowerCase()
  if (facing.includes('garden') || facing.includes('park')) return 'GARDEN'
  if (facing.includes('corner')) return 'CORNER'
  if (facing.includes('commercial')) return 'COMMERCIAL'
  return 'SIMPLE'
}

export function plotTypeFill(plot: any): string {
  return TYPE_FILL[typeFillKey(plot)] || TYPE_FILL.SIMPLE
}

export function totalPlcPercent(plot: any): number {
  const explicit = Number(plot?.totalPlc)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  return (
    Number(plot?.plc12mtr || 0) +
    Number(plot?.plc9mtr || 0) +
    Number(plot?.plcCorner || 0) +
    Number(plot?.plcParkFacing || 0)
  )
}

type PlotShape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'polygon'; points: string }

/** Prefer polygon points or percent bounding box from OCR/admin. */
export function getPlotShape(plot: any): PlotShape | null {
  const pts = plot?.polygon?.points
  if (Array.isArray(pts) && pts.length >= 3) {
    const nums = pts
      .map((p: any) => ({ x: Number(p.x), y: Number(p.y) }))
      .filter((p: { x: number; y: number }) => Number.isFinite(p.x) && Number.isFinite(p.y))
    if (nums.length >= 3) {
      const max = Math.max(...nums.flatMap((p: { x: number; y: number }) => [p.x, p.y]))
      // Treat values as image % when they fit a 0–100 map
      if (max <= 100) {
        return { kind: 'polygon', points: nums.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' ') }
      }
    }
  }

  const c = plot?.coordinates
  const x = Number(c?.x)
  const y = Number(c?.y)
  const w = Number(c?.width)
  const h = Number(c?.height)
  if (Number.isFinite(x) && Number.isFinite(y) && w > 0 && h > 0) {
    const max = Math.max(x + w, y + h)
    if (max <= 105) {
      return { kind: 'rect', x, y, w, h }
    }
  }
  return null
}

interface NakshaDotMapProps {
  imageUrl: string
  imageAlt: string
  plots: any[]
  onSelectPlot?: (plot: any) => void
  onInquiry?: (plot: any) => void
  onBook?: (plot: any) => void
  showTypeLegend?: boolean
}

export function NakshaDotMap({
  imageUrl,
  imageAlt,
  plots,
  onSelectPlot,
  onInquiry,
  onBook,
  showTypeLegend = true,
}: NakshaDotMapProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const list = plots || []
  // Smallest shapes last (= on top) so adjacent/overlapping OCR boxes hit the right plot on hover.
  const shaped = list
    .filter((p) => getPlotShape(p))
    .slice()
    .sort((a, b) => {
      const sa = getPlotShape(a)!
      const sb = getPlotShape(b)!
      const area = (s: NonNullable<ReturnType<typeof getPlotShape>>) =>
        s.kind === 'rect' ? s.w * s.h : 4
      return area(sb) - area(sa)
    })
  const pinnedOnly = list.filter((p) => hasPinnedMarker(p) && !getPlotShape(p))
  const interactive = [...shaped, ...pinnedOnly]
  const hovered = list.find((plot) => plot._id === hoveredId) || null
  const hoveredShape = hovered ? getPlotShape(hovered) : null

  let hoverX = 50
  let hoverY = 50
  if (hovered) {
    if (hasPinnedMarker(hovered)) {
      hoverX = Number(hovered.marker.xPercent)
      hoverY = Number(hovered.marker.yPercent)
    } else if (hoveredShape?.kind === 'rect') {
      hoverX = hoveredShape.x + hoveredShape.w / 2
      hoverY = hoveredShape.y + hoveredShape.h / 2
    } else if (hoveredShape?.kind === 'polygon') {
      const pairs = hoveredShape.points.split(/\s+/).map((pair) => {
        const [px, py] = pair.split(',').map(Number)
        return { x: px, y: py }
      }).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      if (pairs.length) {
        hoverX = pairs.reduce((s, p) => s + p.x, 0) / pairs.length
        hoverY = pairs.reduce((s, p) => s + p.y, 0) / pairs.length
      }
    }
  }
  const cardRight = hoverX > 58
  /** Inflate OCR boxes slightly so hit targets / fills are easier to see and hover. */
  const BOX_SCALE = 1.35

  const clearHover = () => setHoveredId(null)

  const scaledRect = (shape: Extract<PlotShape, { kind: 'rect' }>) => {
    const w = Math.min(100, shape.w * BOX_SCALE)
    const h = Math.min(100, shape.h * BOX_SCALE)
    const cx = shape.x + shape.w / 2
    const cy = shape.y + shape.h / 2
    return {
      x: Math.max(0, Math.min(100 - w, cx - w / 2)),
      y: Math.max(0, Math.min(100 - h, cy - h / 2)),
      w,
      h,
    }
  }

  return (
    <div className="relative w-full isolate">
      <Image
        src={imageUrl}
        alt={imageAlt}
        width={1400}
        height={900}
        className="w-full h-auto block select-none"
        unoptimized
      />

      {/* SVG plot shapes (Hippo-style colored polygons / boxes) */}
      {shaped.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full z-[5]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden={false}
        >
          {shaped.map((plot) => {
            const shape = getPlotShape(plot)!
            const fill = plotTypeFill(plot)
            const stroke = statusDotColor(plot.status)
            const isHovered = hoveredId === plot._id
            const common = {
              fill,
              stroke,
              strokeWidth: isHovered ? 0.45 : 0.25,
              vectorEffect: 'non-scaling-stroke' as const,
              className: 'cursor-pointer transition-opacity',
              opacity: plot.status === 'SOLD' ? 0.55 : isHovered ? 1 : 0.92,
              onMouseEnter: () => setHoveredId(plot._id),
              onMouseLeave: clearHover,
              onClick: () => onSelectPlot?.(plot),
              role: 'button' as const,
              tabIndex: 0,
              'aria-label': `Plot ${plot.plotNo}, ${plot.status}`,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectPlot?.(plot)
                }
              },
            }
            if (shape.kind === 'rect') {
              const box = scaledRect(shape)
              return (
                <rect
                  key={plot._id}
                  {...common}
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                />
              )
            }
            return <polygon key={plot._id} {...common} points={shape.points} />
          })}
        </svg>
      )}

      {interactive.length === 0 && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-brand-charcoal/50 bg-white/80 px-3 py-1 rounded-full z-20">
          Plot pins appear after admin places them on this naksha
        </p>
      )}

      {/* Pin labels for plots without shapes */}
      {pinnedOnly.map((plot) => {
        const blockClass = statusBlockClass(plot.status)
        const isAvailable = plot.status === 'AVAILABLE'
        const isHovered = hoveredId === plot._id

        return (
          <button
            key={plot._id}
            type="button"
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
              isHovered ? 'z-30 scale-110 shadow-2xl' : 'z-10 hover:scale-105'
            }`}
            style={{
              left: `${plot.marker.xPercent}%`,
              top: `${plot.marker.yPercent}%`,
            }}
            onMouseEnter={() => setHoveredId(plot._id)}
            onMouseLeave={clearHover}
            onClick={() => onSelectPlot?.(plot)}
            aria-label={`Plot ${plot.plotNo}`}
          >
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-lg border-2 border-white/90 text-[11px] font-extrabold font-mono tracking-tight whitespace-nowrap cursor-pointer transition-all ${blockClass}`}
            >
              <span className="relative flex h-3.5 w-3.5 items-center justify-center shrink-0">
                {isAvailable && (
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-white" />
                )}
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white border border-black/20 shadow-sm" />
              </span>
              <span>{plot.plotNo}</span>
            </div>
          </button>
        )
      })}

      {/* Status + type legends */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-2 max-w-[min(100%,280px)]">
        <div className="bg-white/95 backdrop-blur-md border border-brand-green/15 rounded-xl px-3 py-2 shadow-md text-[10px] font-bold text-brand-charcoal flex flex-wrap gap-x-3 gap-y-1">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" /> Available
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" /> Booked / Pending
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full" /> Sold
          </span>
        </div>
        {showTypeLegend && shaped.length > 0 && (
          <div className="bg-white/95 backdrop-blur-md border border-brand-green/15 rounded-xl px-3 py-2 shadow-md text-[10px] font-bold text-brand-charcoal grid grid-cols-2 gap-x-3 gap-y-1">
            {TYPE_LEGEND.map((item) => (
              <span key={item.key} className="flex items-center gap-1.5">
                <span className="w-3 h-2.5 rounded-sm border border-black/10" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {hovered && (
        <div
          className="absolute z-40 w-56 pointer-events-auto bg-white text-black text-left rounded-2xl shadow-2xl border border-black/10 p-3"
          style={{
            left: `${hoverX}%`,
            top: `${hoverY}%`,
            transform: cardRight
              ? 'translate(calc(-100% - 12px), calc(-100% - 14px))'
              : 'translate(12px, calc(-100% - 14px))',
          }}
          onMouseEnter={() => setHoveredId(hovered._id)}
          onMouseLeave={clearHover}
        >
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-black bg-black/5 px-1.5 py-0.5 rounded">
              Plot {hovered.plotNo}
            </span>
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${statusBadgeClass(hovered.status)}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: statusDotColor(hovered.status) }}
              />
              {hovered.status}
            </span>
          </div>

          <dl className="space-y-1 text-[10px] text-black">
            <Row label="Plot Type" value={derivePlotType(hovered)} />
            {hovered.sizeSqft ? <Row label="Plot Area Sq.Ft" value={Number(hovered.sizeSqft).toLocaleString('en-IN')} /> : null}
            {hovered.superBuiltUpSqft ? (
              <Row label="Super Built Up Sq.Ft" value={Number(hovered.superBuiltUpSqft).toLocaleString('en-IN')} />
            ) : null}
            {hovered.dimensions ? <Row label="Plot Dimension" value={hovered.dimensions} /> : null}
            <Row label="PLC %" value={totalPlcPercent(hovered) || 0} />
            {hovered.totalCost || hovered.price ? (
              <Row
                label="Est. Cost"
                value={`₹${Number(hovered.totalCost || hovered.price).toLocaleString('en-IN')}`}
              />
            ) : null}
          </dl>

          <div className="mt-3 pt-2 border-t border-black/10 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="px-2 py-2 rounded-xl bg-black text-white text-[10px] font-extrabold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
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
              className="px-2 py-2 rounded-xl bg-brand-green text-white text-[10px] font-extrabold uppercase tracking-wider hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
