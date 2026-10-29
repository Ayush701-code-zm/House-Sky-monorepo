const { clampPercent } = require('./googleMaps');
const { computePricing } = require('../services/pricingEngine');

const SQFT_PER_SQ_YRD = 9;
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const DEFAULT_STATUS = 'AVAILABLE';
const PLOT_STATUSES = ['AVAILABLE', 'BOOKED', 'PENDING', 'SOLD'];
const CRM_LOCKED_STATUSES = ['BOOKED', 'PENDING'];

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

// clampPercent(null|''|false) would coerce to 0 and pin the plot at the top-left corner.
function percentOrNull(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  return clampPercent(value);
}

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function sanitizeSellableArea(sqYrd, label) {
  const text = cleanText(label);
  if (/^50\.0+$/.test(text) || text === '50') return 500;
  const n = toNumber(sqYrd);
  if (n === 50) return 500;
  if (n >= 900 && n <= 3999 && Math.round(n) % 10 === 5) {
    const scaled = Number((n / 10).toFixed(2));
    if (scaled >= 80 && scaled <= 400) return scaled;
  }
  return n;
}

function parseAreaLabel(raw) {
  const text = cleanText(raw).toLowerCase().replace(/,/g, '');
  if (/^50\.0+$/.test(text) || text === '50') {
    return { sellableSqYrd: 500, sizeSqft: 4500 };
  }
  const yard = text.match(/(\d+(?:\.\d+)?)\s*(?:sq\.?\s*(?:yd|yrd|yard)s?|syd)/i);
  if (yard) {
    const sellableSqYrd = sanitizeSellableArea(Number(yard[1]), raw);
    return { sellableSqYrd, sizeSqft: Number((sellableSqYrd * SQFT_PER_SQ_YRD).toFixed(2)) };
  }
  const feet = text.match(/(\d+(?:\.\d+)?)\s*(?:sq\.?\s*(?:ft|feet)|sft)/i);
  if (feet) {
    const sizeSqft = Number(feet[1]);
    return { sizeSqft, sellableSqYrd: Number((sizeSqft / SQFT_PER_SQ_YRD).toFixed(2)) };
  }
  return { sellableSqYrd: 0, sizeSqft: 0 };
}

function parseOcrStatus(raw = {}) {
  const blob = [
    raw.status,
    raw.plotStatus,
    raw.label,
    raw.areaText,
    raw.plotNo
  ].map(cleanText).join(' ').toUpperCase();
  if (/\bSOLD\b/.test(blob) || blob.includes('SOLD OUT')) return 'SOLD';
  if (/\bBOOKED\b/.test(blob) || blob.includes('RESERVED')) return 'BOOKED';
  if (/\bPENDING\b/.test(blob)) return 'PENDING';
  const explicit = cleanText(raw.status || raw.plotStatus).toUpperCase();
  if (PLOT_STATUSES.includes(explicit)) return explicit;
  return DEFAULT_STATUS;
}

function resolveApproveStatus(existing, ocrStatus) {
  if (existing && CRM_LOCKED_STATUSES.includes(existing.status)) {
    return existing.status;
  }
  if (ocrStatus === 'SOLD') return 'SOLD';
  if (existing && existing.status === 'SOLD' && (existing.ownerName || existing.paidAmount > 0)) {
    return 'SOLD';
  }
  if (PLOT_STATUSES.includes(ocrStatus) && ocrStatus !== 'UNKNOWN') return ocrStatus;
  return DEFAULT_STATUS;
}

function looksLikeAreaCode(plotNo, sellableSqYrd, sizeSqft) {
  const n = Number(plotNo);
  if (!Number.isFinite(n) || /[A-Za-z]/.test(String(plotNo))) return false;
  // Only treat as an area label when it clearly matches the extracted area fields.
  // Do NOT blanket-reject n>=50 — real township plot numbers often run into the 100s–200s.
  if (sellableSqYrd && Math.abs(n - sellableSqYrd) < 1) return true;
  if (sizeSqft && Math.abs(n - sizeSqft) < 1) return true;
  return false;
}

function isGarbagePlotNo(rawNo) {
  const text = cleanText(rawNo);
  if (!text) return true;
  if (/sq\.?\s*(yd|yrd|ft)|syd|sft/i.test(text)) return true;
  if (/^[^a-z0-9]+$/i.test(text)) return true;
  return false;
}

function plotArea(plot) {
  return toNumber(plot.sellableSqYrd) || (toNumber(plot.sizeSqft) / SQFT_PER_SQ_YRD);
}

function mergeExtractedPlots(plots) {
  const unique = [];
  plots.forEach((plot) => {
    // percentOrNull: Number(null) === 0 would make every un-located plot a "duplicate" at (0,0)
    const x = percentOrNull(plot.marker?.xPercent) ?? NaN;
    const y = percentOrNull(plot.marker?.yPercent) ?? NaN;
    const size = plotArea(plot);
    const duplicateIndex = unique.findIndex((existing) => {
      const dx = Math.abs((percentOrNull(existing.marker?.xPercent) ?? NaN) - x);
      const dy = Math.abs((percentOrNull(existing.marker?.yPercent) ?? NaN) - y);
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return false;
      if (dx < 2 && dy < 1.05) return true;
      const existingSize = plotArea(existing);
      const sizeClose = size > 0 && existingSize > 0 && (
        Math.abs(size - existingSize) < 8
        || Math.abs(size - existingSize) / Math.max(size, existingSize) < 0.18
      );
      if (sizeClose && size < 300 && dx < 4 && dy < 1.05) return true;
      if (sizeClose && size >= 300 && dx < 8 && dy < 2) return true;
      // The same printed number in one block, sitting on the overlap between two scan tiles.
      const sameNo = cleanText(existing.plotNo).toUpperCase() === cleanText(plot.plotNo).toUpperCase();
      const sameBlock = inferBlock(existing) === inferBlock(plot);
      if (sameNo && sameBlock && cleanText(plot.plotNo) && dx < 10 && dy < 8) return true;
      return false;
    });
    if (duplicateIndex === -1) {
      unique.push(plot);
      return;
    }
    const current = unique[duplicateIndex];
    const currentPrinted = isPrintedPlotNo(current);
    const plotPrinted = isPrintedPlotNo(plot);
    let richer;
    if (currentPrinted !== plotPrinted) richer = plotPrinted ? plot : current;
    else richer = size > plotArea(current) ? plot : current;
    if (!richer.boxPercent && (current.boxPercent || plot.boxPercent)) {
      richer = { ...richer, boxPercent: current.boxPercent || plot.boxPercent };
    }
    if (current.status === 'SOLD' || plot.status === 'SOLD') {
      unique[duplicateIndex] = { ...richer, status: 'SOLD' };
      return;
    }
    unique[duplicateIndex] = richer;
  });
  return unique.sort((a, b) => {
    const ax = Number(a.marker?.xPercent) || 0;
    const bx = Number(b.marker?.xPercent) || 0;
    const col = Math.round(ax / 4) - Math.round(bx / 4);
    if (col !== 0) return col;
    return (Number(a.marker?.yPercent) || 0) - (Number(b.marker?.yPercent) || 0);
  });
}

function inferBlock(plot) {
  const printed = cleanText(plot.plotNo);
  const fromNumber = deriveBlock(printed, '');
  if (fromNumber && fromNumber !== 'A') return fromNumber;
  const explicit = cleanText(plot.block);
  if (explicit) return explicit.toUpperCase();
  return 'A';
}

function isPrintedPlotNo(plot) {
  const printed = cleanText(plot.plotNo);
  if (!printed || isGarbagePlotNo(printed)) return false;
  if (looksLikeAreaCode(printed, plot.sellableSqYrd, plot.sizeSqft)) return false;
  return true;
}

function assignStablePlotNumbers(plots) {
  const counters = {};
  const used = new Set();
  plots.forEach((plot) => {
    if (isPrintedPlotNo(plot)) used.add(cleanText(plot.plotNo).toUpperCase());
  });

  return plots.map((plot) => {
    const block = inferBlock(plot);
    if (isPrintedPlotNo(plot) && !plot.numberNotPrinted) {
      return { ...plot, block, plotNo: cleanText(plot.plotNo) };
    }
    if (plot.numberNotPrinted && cleanText(plot.plotNo)) {
      return { ...plot, block, plotNo: cleanText(plot.plotNo) };
    }
    counters[block] = counters[block] || 0;
    let nextNo = '';
    do {
      counters[block] += 1;
      nextNo = `${block}-${String(counters[block]).padStart(2, '0')}`;
    } while (used.has(nextNo.toUpperCase()));
    used.add(nextNo.toUpperCase());
    return { ...plot, block, plotNo: nextNo, numberNotPrinted: true };
  });
}

function plotBoxOrMarker(plot) {
  const box = plot.boxPercent;
  if (box && Number.isFinite(Number(box.widthPercent)) && Number(box.widthPercent) > 0) {
    return {
      x0: Number(box.xPercent),
      y0: Number(box.yPercent),
      x1: Number(box.xPercent) + Number(box.widthPercent),
      y1: Number(box.yPercent) + Number(box.heightPercent)
    };
  }
  const x = percentOrNull(plot.marker?.xPercent);
  const y = percentOrNull(plot.marker?.yPercent);
  if (x === null || y === null) return null;
  return { x0: x - 1.5, y0: y - 1.5, x1: x + 1.5, y1: y + 1.5 };
}

/**
 * A box with no readable number that sits on top of a numbered plot is a fragment of that plot
 * (cut at a scan-tile edge, or read twice), not a separate plot.
 */
function dropUnnumberedFragments(plots) {
  const numbered = plots.filter(isPrintedPlotNo).map(plotBoxOrMarker).filter(Boolean);
  if (!numbered.length) return plots;
  return plots.filter((plot) => {
    if (isPrintedPlotNo(plot)) return true;
    const own = plotBoxOrMarker(plot);
    if (!own) return false;
    const cx = (own.x0 + own.x1) / 2;
    const cy = (own.y0 + own.y1) / 2;
    const pad = 0.8;
    return !numbered.some((box) => (
      cx >= box.x0 - pad && cx <= box.x1 + pad && cy >= box.y0 - pad && cy <= box.y1 + pad
    ));
  });
}

function plotSequenceKey(plot) {
  const block = cleanText(plot.block).toUpperCase();
  const raw = cleanText(plot.plotNo).toUpperCase();
  const match = raw.match(/(\d+)/);
  const num = match ? parseInt(match[1], 10) : Number.POSITIVE_INFINITY;
  return { block, num, raw };
}

function sortPlotsInSequence(plots) {
  return [...plots].sort((a, b) => {
    const ka = plotSequenceKey(a);
    const kb = plotSequenceKey(b);
    if (ka.block !== kb.block) return ka.block.localeCompare(kb.block);
    if (ka.num !== kb.num) return ka.num - kb.num;
    return ka.raw.localeCompare(kb.raw);
  });
}

function finalizeExtractedPlots(plots, options = {}) {
  const prepared = (plots || []).map((plot) => {
    const sellableSqYrd = sanitizeSellableArea(plot.sellableSqYrd, plot.label || plot.plotNo);
    const sizeSqft = sellableSqYrd
      ? Number((sellableSqYrd * SQFT_PER_SQ_YRD).toFixed(2))
      : toNumber(plot.sizeSqft);
    return {
      ...plot,
      sellableSqYrd,
      sizeSqft,
      status: parseOcrStatus(plot),
      superBuiltUpSqft: toNumber(plot.superBuiltUpSqft) || sizeSqft
    };
  });
  // Re-merging already reviewed rows (approve step) would silently drop plots the admin kept.
  const merged = (options.merge === false ? prepared : dropUnnumberedFragments(mergeExtractedPlots(prepared)))
    .filter((plot) => plotArea(plot) > 0);
  return sortPlotsInSequence(assignStablePlotNumbers(merged));
}

function parseDimensions(raw) {
  const text = cleanText(raw).replace(/\s+/g, '').toLowerCase().replace(/ft|feet|'|"/g, '');
  if (!text) return { dimensions: '', width: 0, depth: 0, sizeSqft: 0 };
  const match = text.match(/(\d+(?:\.\d+)?)[x×*](\d+(?:\.\d+)?)/i);
  if (!match) return { dimensions: cleanText(raw), width: 0, depth: 0, sizeSqft: 0 };
  const width = Number(match[1]);
  const depth = Number(match[2]);
  return {
    dimensions: `${width}x${depth}`,
    width,
    depth,
    sizeSqft: width * depth
  };
}

function deriveBlock(plotNo, block) {
  const explicit = cleanText(block);
  if (explicit) return explicit;
  const no = cleanText(plotNo);
  const match = no.match(/^([A-Za-z]+)/);
  if (match) return match[1].toUpperCase();
  return 'A';
}

function derivePlotType(rawType, facing, plc) {
  const type = cleanText(rawType).toUpperCase().replace(/\s+/g, '_');
  if (type && type !== 'SIMPLE') return type;
  const face = cleanText(facing).toUpperCase();
  if (face.includes('GARDEN')) return 'GARDEN_FACING';
  if (face.includes('PARK')) return 'PARK_FACING';
  if (face.includes('CORNER')) return 'CORNER';
  if (face.includes('ROAD')) return 'ROAD_FACING';
  if (toNumber(plc.plcParkFacing) > 0) return 'PARK_FACING';
  if (toNumber(plc.plcCorner) > 0) return 'CORNER';
  if (toNumber(plc.plc12mtr) > 0 || toNumber(plc.plc9mtr) > 0) return 'ROAD_FACING';
  return 'SIMPLE';
}

function deriveFacing(rawFacing, plc) {
  const facing = cleanText(rawFacing);
  if (facing) return facing;
  if (toNumber(plc.plcParkFacing) > 0) return 'Park / Garden Facing';
  if (toNumber(plc.plcCorner) > 0) return 'Corner Plot';
  if (toNumber(plc.plc12mtr) > 0) return '12m Road Facing';
  if (toNumber(plc.plc9mtr) > 0) return '9m Road Facing';
  return '';
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function markerFromExtracted(plot) {
  const directX = percentOrNull(plot.markerXPercent ?? plot.marker?.xPercent);
  const directY = percentOrNull(plot.markerYPercent ?? plot.marker?.yPercent);
  if (directX !== null && directY !== null) {
    return { xPercent: directX, yPercent: directY };
  }

  const points = plot.polygonPoints || plot.polygon?.points || [];
  if (!Array.isArray(points) || points.length === 0) {
    return { xPercent: null, yPercent: null };
  }

  const percentXs = points.map((pt) => percentOrNull(pt?.xPercent ?? (Number(pt?.x) <= 100 ? pt?.x : null))).filter((n) => n !== null);
  const percentYs = points.map((pt) => percentOrNull(pt?.yPercent ?? (Number(pt?.y) <= 100 ? pt?.y : null))).filter((n) => n !== null);
  if (percentXs.length >= 3 && percentYs.length >= 3) {
    return { xPercent: average(percentXs), yPercent: average(percentYs) };
  }

  const xs = points.map((pt) => toNumber(pt.x));
  const ys = points.map((pt) => toNumber(pt.y));
  const cx = average(xs);
  const cy = average(ys);
  if (cx === null || cy === null) return { xPercent: null, yPercent: null };
  if (cx <= 100 && cy <= 100) return { xPercent: clampPercent(cx), yPercent: clampPercent(cy) };
  return {
    xPercent: clampPercent((cx / CANVAS_WIDTH) * 100),
    yPercent: clampPercent((cy / CANVAS_HEIGHT) * 100)
  };
}

function bboxFromPoints(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const xs = points.map((pt) => toNumber(pt.x ?? pt.xPercent));
  const ys = points.map((pt) => toNumber(pt.y ?? pt.yPercent));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    width: (Math.max(...xs) - minX) || 0,
    height: (Math.max(...ys) - minY) || 0
  };
}

/**
 * Bounding box in % of the full naksha image: { xPercent, yPercent, widthPercent, heightPercent }.
 * Accepts 0–100 percentages, or Gemini-style 0–1000 units (auto-scaled down by 10).
 */
function normalizeBoxPercent(box) {
  if (!box || typeof box !== 'object') return null;
  let x = Number(box.xPercent);
  let y = Number(box.yPercent);
  let w = Number(box.widthPercent);
  let h = Number(box.heightPercent);
  if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return null;
  const maxV = Math.max(Math.abs(x), Math.abs(y), Math.abs(x + w), Math.abs(y + h), Math.abs(w), Math.abs(h));
  if (maxV > 100 && maxV <= 1000) {
    x /= 10;
    y /= 10;
    w /= 10;
    h /= 10;
  }
  x = percentOrNull(x);
  y = percentOrNull(y);
  w = percentOrNull(w);
  h = percentOrNull(h);
  if (x === null || y === null || !w || !h) return null;
  return {
    xPercent: x,
    yPercent: y,
    widthPercent: Math.min(w, 100 - x),
    heightPercent: Math.min(h, 100 - y)
  };
}

function normalizeExtractedPlot(raw = {}, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const label = cleanText(raw.label || raw.areaText || raw.plotNo);
  const plotNo = cleanText(raw.plotNo) || label || `TMP-${index + 1}`;
  if (!plotNo) return null;

  const parsed = parseDimensions(raw.dimensions);
  const fromLabel = parseAreaLabel(label);
  const sellableSqYrd = sanitizeSellableArea(
    toNumber(raw.sellableSqYrd) || fromLabel.sellableSqYrd,
    label
  ) || (toNumber(raw.sizeSqft) || parsed.sizeSqft ? Number(((toNumber(raw.sizeSqft) || parsed.sizeSqft) / SQFT_PER_SQ_YRD).toFixed(2)) : 0);
  const sizeSqft = sellableSqYrd
    ? Number((sellableSqYrd * SQFT_PER_SQ_YRD).toFixed(2))
    : (toNumber(raw.sizeSqft) || parsed.sizeSqft || fromLabel.sizeSqft || 0);
  const plc = {
    plc12mtr: toNumber(raw.plc12mtr),
    plc9mtr: toNumber(raw.plc9mtr),
    plcCorner: toNumber(raw.plcCorner),
    plcParkFacing: toNumber(raw.plcParkFacing)
  };
  const facing = deriveFacing(raw.facing, plc);
  const plotType = derivePlotType(raw.plotType, facing, plc);
  const marker = markerFromExtracted(raw);
  const points = raw.polygonPoints || raw.polygon?.points || [];

  return {
    plotNo,
    block: deriveBlock(plotNo, raw.block),
    status: parseOcrStatus(raw),
    facing,
    plotType,
    dimensions: parsed.dimensions || cleanText(raw.dimensions),
    sizeSqft,
    superBuiltUpSqft: toNumber(raw.superBuiltUpSqft) || sizeSqft,
    sellableSqYrd,
    carpetSqYrd: toNumber(raw.carpetSqYrd),
    plc12mtr: plc.plc12mtr,
    plc9mtr: plc.plc9mtr,
    plcCorner: plc.plcCorner,
    plcParkFacing: plc.plcParkFacing,
    discountedPlc: toNumber(raw.discountedPlc),
    otmc: toNumber(raw.otmc),
    totalCost: toNumber(raw.totalCost),
    marker,
    boxPercent: normalizeBoxPercent(raw.boxPercent),
    polygonPoints: points,
    coordinates: raw.coordinates && raw.coordinates.width ? raw.coordinates : bboxFromPoints(points),
    confidence: toNumber(raw.confidence, 0)
  };
}

function normalizeProjectMeta(raw = {}) {
  const highlights = Array.isArray(raw.highlights) ? raw.highlights.map(cleanText).filter(Boolean) : [];
  const locationAdvantages = Array.isArray(raw.locationAdvantages)
    ? raw.locationAdvantages
      .map((item) => ({
        distance: cleanText(item.distance),
        landmark: cleanText(item.landmark)
      }))
      .filter((item) => item.landmark)
    : [];
  const amenities = Array.isArray(raw.amenities) ? raw.amenities.map(cleanText).filter(Boolean) : [];

  return {
    location: cleanText(raw.location),
    surveyNumber: cleanText(raw.surveyNumber),
    village: cleanText(raw.village),
    highlights,
    locationAdvantages,
    amenities
  };
}

/** Prefer OCR boxPercent (image %) so the public map can draw Hippo-style shapes. */
function resolvePlotCoordinates(normalized = {}) {
  const box = normalizeBoxPercent(normalized.boxPercent);
  if (box) {
    return {
      x: box.xPercent,
      y: box.yPercent,
      width: box.widthPercent,
      height: box.heightPercent
    };
  }
  const c = normalized.coordinates || {};
  const x = toNumber(c.x);
  const y = toNumber(c.y);
  const width = toNumber(c.width);
  const height = toNumber(c.height);
  if (width > 0 && height > 0) return { x, y, width, height };
  return { x: 0, y: 0, width: 0, height: 0 };
}

function buildPricedPlot(normalized, basePricePerSqft = 0) {
  const sellableSqYrd = normalized.sellableSqYrd || 0;
  const baseRatePerSqYrd = sellableSqYrd > 0 ? toNumber(basePricePerSqft) * SQFT_PER_SQ_YRD : 0;
  const pricing = computePricing({
    sellableSqYrd,
    plc12mtr: normalized.plc12mtr,
    plc9mtr: normalized.plc9mtr,
    plcCorner: normalized.plcCorner,
    plcParkFacing: normalized.plcParkFacing,
    discountedPlc: normalized.discountedPlc,
    otmc: normalized.otmc,
    baseRatePerSqYrd
  });
  const fallbackCost = sellableSqYrd > 0 ? pricing.totalCost : (normalized.sizeSqft * toNumber(basePricePerSqft));

  return {
    ...normalized,
    totalPlc: pricing.totalPlc,
    discountedPlc: pricing.discountedPlc,
    gstOnOtherCharges: pricing.gstOnOtherCharges,
    baseRatePerSqYrd,
    totalCost: fallbackCost,
    price: fallbackCost,
    status: normalized.status || DEFAULT_STATUS,
    coordinates: resolvePlotCoordinates(normalized)
  };
}

function mapIncomingPlot(plot, blockName) {
  const areaText = plot.area_text || plot.areaText || plot.label;
  const plotNo = plot.plot_number || plot.plotNo || plot.plot_no;
  const bbox = Array.isArray(plot.bbox) ? plot.bbox : null;
  let markerXPercent = plot.markerXPercent ?? plot.marker?.xPercent;
  let markerYPercent = plot.markerYPercent ?? plot.marker?.yPercent;
  if ((markerXPercent == null || markerYPercent == null) && bbox && bbox.length === 4) {
    const nums = bbox.map(Number);
    if (nums.every((n) => Number.isFinite(n)) && Math.max(...nums) <= 100) {
      markerXPercent = (nums[0] + nums[2]) / 2;
      markerYPercent = (nums[1] + nums[3]) / 2;
    }
  }
  return {
    ...plot,
    plotNo,
    label: areaText || plot.label,
    areaText,
    sellableSqYrd: plot.sellableSqYrd ?? plot.area_sq_yd ?? plot.area_sqyd,
    block: plot.block || blockName,
    status: plot.status,
    markerXPercent,
    markerYPercent
  };
}

function isPlotObject(plot) {
  return Boolean(plot) && typeof plot === 'object' && !Array.isArray(plot);
}

function parseGeminiPayload(parsed) {
  if (Array.isArray(parsed)) {
    return { plots: parsed.filter(isPlotObject).map((plot) => mapIncomingPlot(plot)), projectMeta: {} };
  }
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.blocks)) {
      const plots = parsed.blocks.flatMap((block) =>
        (Array.isArray(block?.plots) ? block.plots : []).filter(isPlotObject).map((plot) => mapIncomingPlot(plot, block.block_name || block.blockName || block.block))
      );
      return { plots, projectMeta: parsed.project || parsed.projectMeta || {} };
    }
    const plots = Array.isArray(parsed.plots)
      ? parsed.plots.filter(isPlotObject).map((plot) => mapIncomingPlot(plot))
      : [];
    return { plots, projectMeta: parsed.projectMeta || parsed.project || {} };
  }
  return { plots: [], projectMeta: {} };
}

module.exports = {
  DEFAULT_STATUS,
  SQFT_PER_SQ_YRD,
  normalizeExtractedPlot,
  normalizeProjectMeta,
  buildPricedPlot,
  parseGeminiPayload,
  markerFromExtracted,
  mergeExtractedPlots,
  assignStablePlotNumbers,
  finalizeExtractedPlots,
  parseAreaLabel,
  sanitizeSellableArea,
  parseOcrStatus,
  resolveApproveStatus
};
