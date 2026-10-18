import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  ZoomIn,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ExtractedPlot {
  plotNo: string;
  /** Block/sector letter; plot identity is block + plotNo (numbers repeat across blocks). */
  block?: string;
  status: string;
  facing?: string;
  plotType?: string;
  sellableSqYrd?: number;
  carpetSqYrd?: number;
  dimensions?: string;
  sizeSqft?: number;
  plc12mtr?: number;
  plc9mtr?: number;
  plcCorner?: number;
  plcParkFacing?: number;
  totalPlc?: number;
  discountedPlc?: number;
  otmc?: number;
  gstOnOtherCharges?: number;
  totalCost?: number;
  confidence: number;
  /** Plot centre, 0-100 % of the full (EXIF-oriented) naksha image */
  marker?: { xPercent?: number | null; yPercent?: number | null } | null;
  /** Plot bounding box (top-left + size), 0-100 % of the full naksha image */
  boxPercent?: { xPercent: number; yPercent: number; widthPercent: number; heightPercent: number } | null;
}

interface ContentBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const OVERLAY_COLORS: Record<string, string> = {
  AVAILABLE: '#22C55E',
  BOOKED: '#EAB308',
  PENDING: '#EAB308',
  SOLD: '#EF4444',
};

function toPercent(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(100, Math.max(0, num));
}

/** Box (preferred) or centre point of a plot, in % of the image content box. */
function plotGeometry(plot: ExtractedPlot) {
  const box = plot.boxPercent;
  if (box) {
    const left = toPercent(box.xPercent);
    const top = toPercent(box.yPercent);
    const width = toPercent(box.widthPercent);
    const height = toPercent(box.heightPercent);
    if (left !== null && top !== null && width && height) {
      return { kind: 'box' as const, left, top, width: Math.min(width, 100 - left), height: Math.min(height, 100 - top) };
    }
  }
  const x = toPercent(plot.marker?.xPercent);
  const y = toPercent(plot.marker?.yPercent);
  if (x !== null && y !== null) return { kind: 'point' as const, left: x, top: y };
  return null;
}

interface OcrValidationViewerProps {
  mapData: {
    mapId: string;
    mapName: string;
    imageUrl: string;
    confidenceScore: number;
    requiresHumanReview: boolean;
    extractedPlots: ExtractedPlot[];
    isSample?: boolean;
    usedAI?: boolean;
  };
  uploadedPreviewUrl?: string | null;
  onComplete: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BOOKED: 'bg-amber-50 text-amber-700 border-amber-200',
  SOLD: 'bg-red-50 text-red-600 border-red-200',
  PENDING: 'bg-sky-50 text-sky-700 border-sky-200',
};

export const OcrValidationViewer: React.FC<OcrValidationViewerProps> = ({
  mapData,
  uploadedPreviewUrl,
  onComplete
}) => {
  const toast = useToast();
  const [plots, setPlots] = useState<ExtractedPlot[]>(mapData.extractedPlots);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [contentBox, setContentBox] = useState<ContentBox | null>(null);

  // The <img> uses object-contain, so the picture is letterboxed inside its element box.
  // Overlay coordinates are % of the picture itself, so position the overlay layer over
  // the actual rendered content rect (recomputed on every resize / zoom toggle).
  const measureImage = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight || !img.clientWidth || !img.clientHeight) {
      setContentBox(null);
      return;
    }
    const scale = Math.min(img.clientWidth / img.naturalWidth, img.clientHeight / img.naturalHeight);
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    setContentBox({
      left: img.offsetLeft + (img.clientWidth - width) / 2,
      top: img.offsetTop + (img.clientHeight - height) / 2,
      width,
      height
    });
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return undefined;
    measureImage();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureImage);
      return () => window.removeEventListener('resize', measureImage);
    }
    const observer = new ResizeObserver(() => measureImage());
    observer.observe(img);
    return () => observer.disconnect();
  }, [measureImage, uploadedPreviewUrl, mapData.imageUrl]);

  const handleFieldChange = (index: number, field: keyof ExtractedPlot, value: any) => {
    const updated = [...plots];
    updated[index] = { ...updated[index], [field]: value };
    setPlots(updated);
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await api.post(`/ocr/approve/${mapData.mapId}`, {
        updatedVectorOverlayData: plots
      });
      toast.success(`✅ ${plots.length} plots saved to database successfully!`);
      onComplete();
    } catch (error: any) {
      console.error(error);
      // Surface the server's reason (e.g. which plots are duplicated) so the reviewer can fix rows.
      toast.error(error?.friendlyMessage || error?.response?.data?.message || 'Failed to save plots. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      await api.post(`/ocr/reject/${mapData.mapId}`);
      toast.info('Analysis discarded.');
      onComplete();
    } catch (error) {
      toast.error('Failed to discard analysis.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confidenceScore = Number(mapData.confidenceScore) || 0;
  const isHighConfidence = confidenceScore >= 0.90;
  const imageToShow = uploadedPreviewUrl || mapData.imageUrl;

  // Counts
  const counts = plots.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Result Summary Banner */}
      <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        mapData.isSample
          ? 'bg-amber-50 border-amber-200'
          : isHighConfidence
          ? 'bg-[#E8F0EC] border-[#0B4F3C]/25'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isHighConfidence && !mapData.isSample ? 'bg-[#0B4F3C] text-white' : 'bg-amber-500 text-white'
          }`}>
            {isHighConfidence && !mapData.isSample
              ? <CheckCircle2 className="w-5 h-5" />
              : <AlertTriangle className="w-5 h-5" />
            }
          </div>
          <div>
            <p className="font-bold text-sm text-[#171A18]">
              {mapData.isSample
                ? '⚠️ Demo data — Upload a real Naksha to extract actual plots'
                : `${plots.length} plots extracted — ${(confidenceScore * 100).toFixed(0)}% confidence`
              }
            </p>
            <p className="text-xs text-[#171A18]/60 mt-0.5">
              {mapData.isSample
                ? 'This is sample data to preview the workflow'
                : `Click any row to correct plot no, area, or SOLD/AVAILABLE before saving. ${counts.SOLD || 0} sold · ${counts.AVAILABLE || 0} available`
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <X className="w-3.5 h-3.5" /> Discard
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold shadow-md hover:bg-[#063B2D] transition-all flex items-center gap-2 cursor-pointer border border-[#0B4F3C]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {isProcessing ? 'Saving...' : `Save ${plots.length} Plots to Database`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Uploaded Naksha Image */}
        <div className="lg:col-span-4 space-y-3">
          <h4 className="text-xs font-bold text-[#171A18] uppercase tracking-wider">
            Uploaded Naksha
          </h4>

          <div className="bg-white rounded-2xl border border-[#0B4F3C]/15 overflow-hidden shadow-sm">
            {imageToShow ? (
              <div className="relative">
                <img
                  ref={imgRef}
                  src={imageToShow}
                  alt="Naksha Layout"
                  className={`block w-full object-contain transition-all cursor-zoom-in ${imageZoomed ? 'max-h-[500px]' : 'max-h-56'}`}
                  onClick={() => setImageZoomed(v => !v)}
                  onLoad={measureImage}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; setContentBox(null); }}
                />
                {contentBox && (
                  <div
                    className="absolute pointer-events-none"
                    style={{ left: contentBox.left, top: contentBox.top, width: contentBox.width, height: contentBox.height }}
                  >
                    {plots.map((p, idx) => {
                      const geometry = plotGeometry(p);
                      if (!geometry) return null;
                      const color = OVERLAY_COLORS[p.status] || OVERLAY_COLORS.PENDING;
                      const selected = editingIdx === idx;
                      const common = {
                        title: `${p.plotNo} · ${p.status}`,
                        onClick: () => setEditingIdx(selected ? null : idx),
                      };
                      if (geometry.kind === 'box') {
                        return (
                          <div
                            key={idx}
                            {...common}
                            className="absolute box-border pointer-events-auto cursor-pointer"
                            style={{
                              left: `${geometry.left}%`,
                              top: `${geometry.top}%`,
                              width: `${geometry.width}%`,
                              height: `${geometry.height}%`,
                              border: `${selected ? 2 : 1}px solid ${color}`,
                              backgroundColor: `${color}${selected ? '55' : '26'}`,
                              zIndex: selected ? 2 : 1
                            }}
                          />
                        );
                      }
                      return (
                        <div
                          key={idx}
                          {...common}
                          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white pointer-events-auto cursor-pointer"
                          style={{
                            left: `${geometry.left}%`,
                            top: `${geometry.top}%`,
                            width: selected ? 12 : 8,
                            height: selected ? 12 : 8,
                            backgroundColor: color,
                            zIndex: selected ? 2 : 1
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={() => setImageZoomed(v => !v)}
                  className="absolute bottom-2 right-2 w-7 h-7 bg-black/60 text-white rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-[#171A18]/30 text-xs font-semibold">
                No image available
              </div>
            )}

            {/* Map details */}
            <div className="p-3 border-t border-[#0B4F3C]/10 space-y-1">
              <p className="text-xs font-bold text-[#171A18] truncate">{mapData.mapName}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {mapData.usedAI && (
                  <span className="text-[10px] bg-[#E8F0EC] text-[#0B4F3C] font-bold px-2 py-0.5 rounded-full border border-[#0B4F3C]/20">
                    ✨ AI Extracted
                  </span>
                )}
                {mapData.isSample && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    DEMO DATA
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-white rounded-2xl border border-[#0B4F3C]/15 p-4 space-y-3 shadow-sm">
            <h5 className="text-xs font-bold text-[#171A18] uppercase tracking-wider">Plot Breakdown</h5>
            <div className="space-y-2">
              {(['AVAILABLE', 'BOOKED', 'SOLD', 'PENDING'] as const).map(s => (
                counts[s] ? (
                  <div key={s} className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_COLORS[s]}`}>{s}</span>
                    <span className="text-xs font-bold text-[#171A18]">{counts[s]}</span>
                  </div>
                ) : null
              ))}
              <div className="pt-1 border-t border-[#0B4F3C]/10 flex items-center justify-between">
                <span className="text-xs font-bold text-[#171A18]/70">Total</span>
                <span className="text-sm font-bold text-[#0B4F3C]">{plots.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Plot Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-[#0B4F3C]/15 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#0B4F3C]/10 flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#171A18] uppercase tracking-wider">
                Extracted Plot Data
              </h4>
              <span className="text-[10px] text-[#171A18]/50 font-semibold">Click a row to edit</span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
              <table className="w-full text-xs">
                <thead className="bg-[#E8F0EC] text-[#0B4F3C] text-[10px] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">#</th>
                    <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Block</th>
                    <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Plot No</th>
                    <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Status</th>
                    <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">Size (sq yd)</th>
                    <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">Dimensions</th>
                    <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">Total PLC</th>
                    <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">Total Cost</th>
                    <th className="px-3 py-2.5 text-center font-bold whitespace-nowrap">Confidence</th>
                    <th className="px-3 py-2.5 text-center font-bold whitespace-nowrap">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0B4F3C]/8">
                  {plots.map((p, idx) => (
                    <React.Fragment key={idx}>
                      <tr
                        className={`transition-colors cursor-pointer ${editingIdx === idx ? 'bg-[#E8F0EC]/70' : 'hover:bg-[#FDFCF0]'}`}
                        onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                      >
                        <td className="px-3 py-2.5 text-[#171A18]/50 font-mono">{idx + 1}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-[#171A18]/70 font-mono">{p.block || '—'}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-[#0B4F3C] font-mono">{p.plotNo}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_COLORS[p.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[#171A18]">
                          {p.sellableSqYrd || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[#171A18]">
                          {p.dimensions || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[#0B4F3C]">
                          {p.totalPlc ? `₹${p.totalPlc}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold font-mono text-[#171A18]">
                          {p.totalCost ? `₹${p.totalCost.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="inline-flex items-center gap-1">
                            <div className="w-12 h-1.5 bg-[#0B4F3C]/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${p.confidence >= 0.9 ? 'bg-emerald-500' : p.confidence >= 0.7 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${(p.confidence || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-[#171A18]/50">{Math.round((p.confidence || 0) * 100)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button className="text-[#0B4F3C] hover:text-[#063B2D]">
                            {editingIdx === idx
                              ? <ChevronUp className="w-3.5 h-3.5" />
                              : <ChevronDown className="w-3.5 h-3.5" />
                            }
                          </button>
                        </td>
                      </tr>

                      {/* Inline Edit Row */}
                      {editingIdx === idx && (
                        <tr className="bg-[#E8F0EC]/50">
                          <td colSpan={10} className="px-4 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-[#171A18]/60 block mb-1">Block</label>
                                <input
                                  type="text"
                                  value={p.block || ''}
                                  placeholder="A"
                                  onChange={(e) => handleFieldChange(idx, 'block', e.target.value.toUpperCase())}
                                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2 py-1.5 text-[#171A18] font-bold text-xs focus:outline-none focus:border-[#0B4F3C]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#171A18]/60 block mb-1">Plot No</label>
                                <input
                                  type="text"
                                  value={p.plotNo}
                                  onChange={(e) => handleFieldChange(idx, 'plotNo', e.target.value)}
                                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2 py-1.5 text-[#171A18] font-bold text-xs focus:outline-none focus:border-[#0B4F3C]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#171A18]/60 block mb-1">Status</label>
                                <select
                                  value={p.status}
                                  onChange={(e) => handleFieldChange(idx, 'status', e.target.value)}
                                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2 py-1.5 text-xs text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                                >
                                  <option value="AVAILABLE">AVAILABLE</option>
                                  <option value="BOOKED">BOOKED</option>
                                  <option value="PENDING">PENDING</option>
                                  <option value="SOLD">SOLD</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#171A18]/60 block mb-1">Sellable Sq Yd</label>
                                <input
                                  type="number"
                                  value={p.sellableSqYrd || ''}
                                  onChange={(e) => handleFieldChange(idx, 'sellableSqYrd', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2 py-1.5 text-[#171A18] font-bold text-xs focus:outline-none focus:border-[#0B4F3C]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#171A18]/60 block mb-1">Dimensions</label>
                                <input
                                  type="text"
                                  value={p.dimensions || ''}
                                  onChange={(e) => handleFieldChange(idx, 'dimensions', e.target.value)}
                                  placeholder="e.g. 30x60"
                                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2 py-1.5 text-[#171A18] font-bold text-xs focus:outline-none focus:border-[#0B4F3C]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#171A18]/60 block mb-1">Total Cost (₹)</label>
                                <input
                                  type="number"
                                  value={p.totalCost || ''}
                                  onChange={(e) => handleFieldChange(idx, 'totalCost', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2 py-1.5 text-[#171A18] font-bold text-xs focus:outline-none focus:border-[#0B4F3C]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#171A18]/60 block mb-1">Total PLC (₹)</label>
                                <input
                                  type="number"
                                  value={p.totalPlc || ''}
                                  onChange={(e) => handleFieldChange(idx, 'totalPlc', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2 py-1.5 text-[#171A18] font-bold text-xs focus:outline-none focus:border-[#0B4F3C]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#171A18]/60 block mb-1">OTMC (₹)</label>
                                <input
                                  type="number"
                                  value={p.otmc || ''}
                                  onChange={(e) => handleFieldChange(idx, 'otmc', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2 py-1.5 text-[#171A18] font-bold text-xs focus:outline-none focus:border-[#0B4F3C]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#171A18]/60 block mb-1">GST on Charges (₹)</label>
                                <input
                                  type="number"
                                  value={p.gstOnOtherCharges || ''}
                                  onChange={(e) => handleFieldChange(idx, 'gstOnOtherCharges', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2 py-1.5 text-[#171A18] font-bold text-xs focus:outline-none focus:border-[#0B4F3C]"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
