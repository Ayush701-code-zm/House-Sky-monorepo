import React, { useMemo, useRef, useState } from 'react';
import { Plot, Project } from '../../types';
import { Search, Building2, ScanText, MapPin, MousePointerClick } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const DOT_GREEN = '#22C55E';
const DOT_YELLOW = '#EAB308';
const DOT_RED = '#EF4444';
const PERCENT_MIN = 0;
const PERCENT_MAX = 100;

function statusBlockClass(_status: string): string {
  return 'bg-white text-[#171A18] border-[#171A18]/30 shadow-black/20';
}

function statusDotColor(status: string): string {
  if (status === 'SOLD') return DOT_RED;
  if (status === 'AVAILABLE') return DOT_GREEN;
  return DOT_YELLOW;
}

function hasPinnedMarker(plot: Plot): boolean {
  const rawX = plot.marker?.xPercent;
  const rawY = plot.marker?.yPercent;
  if (rawX === null || rawX === undefined || rawY === null || rawY === undefined) return false;
  const x = Number(rawX);
  const y = Number(rawY);
  // Legacy OCR data: un-located plots were saved as exactly (0,0) (null coerced to 0),
  // which stacked every one of them, clipped, in the image's top-left corner.
  if (x === 0 && y === 0) return false;
  return Number.isFinite(x) && Number.isFinite(y);
}

function clampPercent(value: number): number {
  return Math.min(PERCENT_MAX, Math.max(PERCENT_MIN, value));
}

function deriveFacing(plot: Plot): string {
  if (plot.facing) return plot.facing;
  if (Number(plot.plcParkFacing) > 0) return 'Park / Garden Facing';
  if (Number(plot.plcCorner) > 0) return 'Corner Plot';
  if (Number(plot.plc12mtr) > 0) return '12m Road Facing';
  if (Number(plot.plc9mtr) > 0) return '9m Road Facing';
  return 'Standard';
}

function derivePlotType(plot: Plot): string {
  if (plot.plotType && plot.plotType !== 'SIMPLE') return plot.plotType.replace(/_/g, ' ');
  const facing = deriveFacing(plot);
  if (facing !== 'Standard') return facing;
  return 'Simple';
}

interface PlotMapCanvasProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  plots: Plot[];
  onSelectPlot: (plot: Plot) => void;
  onOpenNaksaModal?: () => void;
  onRefresh?: () => void;
}

export const PlotMapCanvas: React.FC<PlotMapCanvasProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  plots,
  onSelectPlot,
  onOpenNaksaModal,
  onRefresh
}) => {
  const toast = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [activeBlock, setActiveBlock] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pinPlotId, setPinPlotId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localMarkers, setLocalMarkers] = useState<Record<string, { xPercent: number; yPercent: number }>>({});
  const justDraggedRef = useRef(false);

  const selectedProject = projects.find((p) => p._id === selectedProjectId) || projects[0];
  const projectMapImage = selectedProject?.mapImageUrl || selectedProject?.bannerImage || '';

  const projectPlots = useMemo(() => plots.filter((plot) =>
    !selectedProjectId || (typeof plot.projectId === 'string' ? plot.projectId === selectedProjectId : plot.projectId?._id === selectedProjectId)
  ), [plots, selectedProjectId]);

  const blocks = ['ALL', ...Array.from(new Set(projectPlots.map((p) => p.block).filter(Boolean))).sort()];

  const filteredPlots = projectPlots.filter((plot) => {
    const matchesStatus = activeFilter === 'ALL' || plot.status === activeFilter;
    const matchesBlock = activeBlock === 'ALL' || plot.block === activeBlock;
    const matchesSearch =
      plot.plotNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.block.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesBlock && matchesSearch;
  });

  const markerOf = (plot: Plot) => localMarkers[plot._id] || (
    hasPinnedMarker(plot)
      ? { xPercent: Number(plot.marker?.xPercent), yPercent: Number(plot.marker?.yPercent) }
      : null
  );

  const percentFromEvent = (clientX: number, clientY: number) => {
    const el = mapRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      xPercent: clampPercent(((clientX - rect.left) / rect.width) * PERCENT_MAX),
      yPercent: clampPercent(((clientY - rect.top) / rect.height) * PERCENT_MAX)
    };
  };

  const correctStatus = async (plot: Plot, status: 'AVAILABLE' | 'SOLD') => {
    try {
      await api.put(`/plots/${plot._id}/status`, { status, inventoryOnly: true });
      toast.success(`Plot ${plot.plotNo} marked ${status}`);
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to correct plot status');
    }
  };

  const saveMarker = async (plotId: string, xPercent: number, yPercent: number) => {
    setLocalMarkers((prev) => ({ ...prev, [plotId]: { xPercent, yPercent } }));
    try {
      await api.put(`/plots/${plotId}/marker`, { xPercent, yPercent });
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save plot pin');
    }
  };

  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    if (!pinPlotId || draggingId) return;
    const point = percentFromEvent(e.clientX, e.clientY);
    if (!point) return;
    const plot = projectPlots.find((p) => p._id === pinPlotId);
    await saveMarker(pinPlotId, point.xPercent, point.yPercent);
    toast.success(`Pinned Plot ${plot?.plotNo || ''} on the naksha`);
    setPinPlotId(null);
  };

  const handleDotMouseDown = (e: React.MouseEvent, plot: Plot) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(plot._id);
    setHoveredId(null);
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingId) return;
    const point = percentFromEvent(e.clientX, e.clientY);
    if (!point) return;
    setLocalMarkers((prev) => ({ ...prev, [draggingId]: point }));
  };

  const handleMapMouseUp = async () => {
    if (!draggingId) return;
    const marker = localMarkers[draggingId];
    const plotId = draggingId;
    justDraggedRef.current = true;
    setDraggingId(null);
    if (marker) {
      await saveMarker(plotId, marker.xPercent, marker.yPercent);
    }
  };

  const unpinnedPlots = filteredPlots.filter((plot) => !markerOf(plot));
  const pinnedPlots = filteredPlots.filter((plot) => markerOf(plot));
  const pinTarget = projectPlots.find((p) => p._id === pinPlotId);

  return (
    <div className="bg-white rounded-2xl border border-[#0B4F3C]/15 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#0B4F3C]/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">Select Project / Township</label>
            <select
              value={selectedProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-1.5 text-sm font-extrabold text-[#171A18] focus:outline-none focus:border-[#0B4F3C] block mt-0.5"
            >
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.name} ({proj.code}) - {proj.location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedProject && (
          <div className="flex items-center gap-3 bg-[#E8F0EC] px-4 py-2 rounded-xl border border-[#0B4F3C]/20 text-xs flex-wrap">
            {onOpenNaksaModal && (
              <button
                onClick={onOpenNaksaModal}
                className="px-3 py-1 rounded-lg font-bold bg-white text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer border border-[#0B4F3C]/20"
              >
                <ScanText className="w-3.5 h-3.5" />
                Import Plots (CSV / OCR)
              </button>
            )}
            <div className="border-l border-[#0B4F3C]/20 pl-3">
              <p className="text-[#171A18]/70 font-semibold text-[10px]">Pinned on map</p>
              <p className="font-bold text-[#0B4F3C]">{pinnedPlots.length} / {projectPlots.length}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FDFCF0] p-3 rounded-xl border border-[#0B4F3C]/15">
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'AVAILABLE', 'BOOKED', 'AGREEMENT', 'PENDING', 'SOLD'].map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === status
                  ? 'bg-[#0B4F3C] text-white shadow-md'
                  : 'bg-white text-[#0B4F3C] hover:bg-[#E8F0EC] border border-[#0B4F3C]/20'
              }`}
            >
              {status === 'ALL' && 'All Statuses'}
              {status === 'AVAILABLE' && <span>Green Available</span>}
              {status === 'BOOKED' && <span>Yellow Booked</span>}
              {status === 'PENDING' && <span>Yellow Pending</span>}
              {status === 'SOLD' && <span>Red Sold</span>}
            </button>
          ))}

          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-[#0B4F3C]/20">
            <span className="text-[10px] text-[#0B4F3C] font-bold">Block:</span>
            {blocks.map((b) => (
              <button
                key={b}
                onClick={() => setActiveBlock(b)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  activeBlock === b ? 'bg-[#0B4F3C] text-white' : 'bg-white text-[#0B4F3C] border border-[#0B4F3C]/15'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#0B4F3C]" />
          <input
            type="text"
            placeholder="Search plot no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-[#0B4F3C]/20 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold text-[#171A18]/70">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DOT_GREEN }} /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DOT_YELLOW }} /> Booked / Pending</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DOT_RED }} /> Sold</span>
        <span className="ml-auto flex items-center gap-1 text-[#0B4F3C]">
          <MousePointerClick className="w-3 h-3" />
          Pin on the photo, then Correct / Sold / Available if OCR missed a stamp
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <div className="border border-[#0B4F3C]/15 rounded-xl overflow-hidden max-h-[640px] flex flex-col">
          <div className="px-3 py-2 bg-[#E8F0EC] text-[10px] font-extrabold uppercase tracking-wider text-[#0B4F3C]">
            Pin plots on naksha
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {filteredPlots.map((plot) => {
              const pinned = Boolean(markerOf(plot));
              const isPinning = pinPlotId === plot._id;
              return (
                <button
                  key={plot._id}
                  type="button"
                  onClick={() => setPinPlotId(isPinning ? null : plot._id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-pointer ${
                    isPinning
                      ? 'bg-[#0B4F3C] text-white'
                      : pinned
                      ? 'bg-white border border-[#0B4F3C]/15 text-[#171A18]'
                      : 'bg-[#FDFCF0] border border-dashed border-[#0B4F3C]/25 text-[#0B4F3C]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusDotColor(plot.status) }} />
                    {plot.plotNo}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectPlot(plot);
                      }}
                      className="text-[9px] underline opacity-80"
                    >
                      Correct
                    </span>
                    <span className="text-[9px] opacity-70">{pinned ? 'Pinned' : 'Pin'}</span>
                  </span>
                </button>
              );
            })}
            {filteredPlots.length === 0 && (
              <p className="text-[11px] text-[#171A18]/50 p-3 text-center">No plots in this filter.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#0B4F3C]/20 overflow-auto bg-[#FDFCF0]">
          {!projectMapImage ? (
            <div className="h-[420px] flex flex-col items-center justify-center gap-2 text-center px-6">
              <MapPin className="w-8 h-8 text-[#0B4F3C]/40" />
              <p className="text-sm font-bold text-[#171A18]">Upload this project&apos;s naksha image first</p>
              <p className="text-xs text-[#171A18]/60">Edit the project and set Layout / Map image. Pins sit on that exact photo.</p>
            </div>
          ) : (
            <div
              ref={mapRef}
              className={`relative w-full ${pinPlotId ? 'cursor-crosshair' : 'cursor-default'}`}
              onClick={handleMapClick}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onMouseLeave={handleMapMouseUp}
            >
              <img
                src={projectMapImage}
                alt={`${selectedProject?.name || 'Project'} naksha`}
                className="w-full h-auto block select-none pointer-events-none"
              />

              {pinTarget && (
                <div className="absolute top-3 left-3 z-20 bg-[#0B4F3C] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg">
                  Click the exact box for Plot {pinTarget.plotNo}
                </div>
              )}

              {pinnedPlots.map((plot) => {
                const marker = markerOf(plot);
                if (!marker) return null;
                const color = statusDotColor(plot.status);
                const isHovered = hoveredId === plot._id && !draggingId;
                const flipLeft = marker.xPercent > 70;
                return (
                  <div
                    key={plot._id}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${marker.xPercent}%`, top: `${marker.yPercent}%` }}
                    onMouseDown={(e) => handleDotMouseDown(e, plot)}
                    onMouseEnter={() => setHoveredId(plot._id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlot(plot);
                    }}
                  >
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl shadow-lg border-2 border-white/90 text-[11px] font-extrabold font-mono tracking-tight whitespace-nowrap cursor-grab active:cursor-grabbing transition-all ${statusBlockClass(plot.status)}`}>
                      <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                        {plot.status === 'AVAILABLE' && (
                          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: color }} />
                        )}
                        <span className="relative inline-flex h-2 w-2 rounded-full border border-black/20 shadow-sm" style={{ backgroundColor: color }} />
                      </span>
                      <span className="text-[#171A18]">{plot.plotNo}</span>
                    </div>
                    {isHovered && (
                      <div className={`absolute top-1/2 -translate-y-1/2 w-56 bg-white rounded-xl shadow-xl border border-[#0B4F3C]/15 p-3 z-20 ${flipLeft ? 'right-5' : 'left-5'}`}>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B4F3C] mb-2">Plot {plot.plotNo}</p>
                        <dl className="space-y-1 text-[11px] text-[#171A18]">
                          <HoverRow label="Type" value={derivePlotType(plot)} />
                          <HoverRow label="Facing" value={deriveFacing(plot)} />
                          <HoverRow label="Area" value={`${plot.sizeSqft || '—'} sqft`} />
                          <HoverRow label="Dimension" value={plot.dimensions || '—'} />
                          <HoverRow label="Status" value={plot.status} />
                        </dl>
                        <div className="mt-2 flex gap-1.5">
                          <button
                            type="button"
                            className="flex-1 text-[10px] font-bold rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 py-1"
                            onClick={(event) => {
                              event.stopPropagation();
                              void correctStatus(plot, 'AVAILABLE');
                            }}
                          >
                            Available
                          </button>
                          <button
                            type="button"
                            className="flex-1 text-[10px] font-bold rounded-md border border-red-200 bg-red-50 text-red-700 py-1"
                            onClick={(event) => {
                              event.stopPropagation();
                              void correctStatus(plot, 'SOLD');
                            }}
                          >
                            Sold
                          </button>
                        </div>
                        <p className="mt-2 text-[10px] text-[#171A18]/50">Drag pin · click dot for full edit</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {unpinnedPlots.length > 0 && projectMapImage && (
        <p className="text-[11px] text-[#171A18]/55">
          {unpinnedPlots.length} plot{unpinnedPlots.length === 1 ? '' : 's'} still need a pin. Select from the left list, then click the matching box on the naksha.
        </p>
      )}
    </div>
  );
};

function HoverRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[#171A18]/50">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
