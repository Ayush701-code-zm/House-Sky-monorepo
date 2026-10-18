const path = require('path');
const sharp = require('sharp');
const PlotMap = require('../models/PlotMap');
const { uploadToS3 } = require('./s3Service');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  normalizeExtractedPlot,
  normalizeProjectMeta,
  parseGeminiPayload,
  finalizeExtractedPlots
} = require('../utils/plotFromOcr');
const {
  PLOT_TILE_PROMPT,
  SOLD_STAMP_PROMPT,
  META_PROMPT,
  MAX_OUTPUT_TOKENS
} = require('./ocrPrompts');



/** Simplified grid for faster OCR - covers most standard layouts */
function buildFullCoverageTiles() {
  // Reduced from 4x4 to 3x3 grid (9 tiles instead of 16)
  const steps = [0, 0.33, 0.66];
  const size = 0.40; // Slightly larger tiles
  const labels = ['A', 'B', 'C'];
  const tiles = [];
  for (let r = 0; r < steps.length; r += 1) {
    for (let c = 0; c < steps.length; c += 1) {
      const x0 = steps[c];
      const y0 = steps[r];
      tiles.push({
        id: `${labels[r]}${labels[c]}`,
        x0,
        x1: Math.min(1, x0 + size),
        y0,
        y1: Math.min(1, y0 + size)
      });
    }
  }
  // Only bottom-right edge for plots near corners
  tiles.push({ id: 'ER', x0: 0.65, x1: 1, y0: 0.65, y1: 1 });
  return tiles; // 10 tiles total instead of 19
}
const TILE_ATTEMPTS = 2; // Reduced from 3 to speed up OCR

function mimeFromFileName(fileName, fallback = 'image/jpeg') {
  const ext = path.extname(fileName || '').toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.pdf') return 'application/pdf';
  return fallback;
}

function extractCompleteJsonObjects(text, fromIndex) {
  const objects = [];
  let cursor = fromIndex;
  while (cursor < text.length) {
    const start = text.indexOf('{', cursor);
    if (start === -1) break;
    let depth = 0;
    let end = -1;
    for (let index = start; index < text.length; index += 1) {
      const char = text[index];
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          end = index;
          break;
        }
      }
    }
    if (end === -1) break;
    try {
      objects.push(JSON.parse(text.slice(start, end + 1)));
    } catch (_error) {
      // skip malformed fragment
    }
    cursor = end + 1;
  }
  return objects;
}

function repairTruncatedPlotsJson(responseText) {
  const text = String(responseText || '');
  const plotsKey = text.indexOf('"plots"');
  if (plotsKey === -1) return null;
  const arrayStart = text.indexOf('[', plotsKey);
  if (arrayStart === -1) return null;
  const plots = extractCompleteJsonObjects(text, arrayStart);
  if (!plots.length) return null;
  return { plots };
}

function parseModelJson(responseText) {
  let cleanJson = String(responseText || '').replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const objectStart = cleanJson.indexOf('{');
  const arrayStart = cleanJson.indexOf('[');
  if (objectStart !== -1 && (arrayStart === -1 || objectStart < arrayStart)) {
    const objectEnd = cleanJson.lastIndexOf('}');
    if (objectEnd !== -1) cleanJson = cleanJson.substring(objectStart, objectEnd + 1);
  } else if (arrayStart !== -1) {
    const arrayEnd = cleanJson.lastIndexOf(']');
    if (arrayEnd !== -1) cleanJson = cleanJson.substring(arrayStart, arrayEnd + 1);
  }
  try {
    return JSON.parse(cleanJson);
  } catch (error) {
    const repaired = repairTruncatedPlotsJson(responseText);
    if (repaired) return repaired;
    throw error;
  }
}

function visionModels() {
  const preferredModel = process.env.GEMINI_VISION_MODEL || 'gemini-3.8-flash';
  return Array.from(new Set([
    preferredModel,
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview',
    'gemini-pro-latest',
  ]));
}

function isModelMissingError(error) {
  const message = String(error?.message || '');
  return message.includes('404') ||
         message.includes('400') ||
         message.includes('no longer available') ||
         message.includes('not found') ||
         message.includes('unsupported') ||
         message.includes('not supported') ||
         message.includes('Invalid');
}

function isRateLimitError(error) {
  const message = String(error?.message || '');
  return message.includes('429') || message.includes('Too Many Requests') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateJsonFromImage({ fileBuffer, mimeType, prompt }) {
  let lastError = null;
  for (const modelName of visionModels()) {
    for (let attempt = 1; attempt <= TILE_ATTEMPTS; attempt += 1) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            responseMimeType: 'application/json'
          }
        });
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: fileBuffer.toString('base64'), mimeType } }
        ]);
        return parseModelJson(result.response.text());
      } catch (error) {
        lastError = error;
        console.warn(`[OCR] Gemini (${modelName}) attempt ${attempt}:`, error.message);
        if (isModelMissingError(error)) break;
        if (isRateLimitError(error)) {
          const daily = String(error.message).includes('PerDay') || String(error.message).includes('free_tier_requests');
          if (daily) break;
          const waitMatch = String(error.message).match(/retry in (\d+)/i);
          const waitMs = Math.min(((waitMatch ? Number(waitMatch[1]) : 5) + attempt * 2) * 1000, 15000);
          console.warn(`[OCR] rate limited on ${modelName}, waiting ${waitMs}ms before retrying...`);
          await sleep(waitMs);
        } else {
          await sleep(1000 * attempt);
        }
      }
    }
  }
  throw lastError || new Error('Gemini vision analysis failed after trying all fallback models');
}

/**
 * Coordinate convention (stored on every extracted plot):
 *   marker.xPercent / marker.yPercent  -> plot CENTER, 0-100 % of the full,
 *                                         EXIF-auto-oriented naksha image
 *   boxPercent {xPercent,yPercent,widthPercent,heightPercent}
 *                                      -> plot bounding box (top-left + size), same space
 * Renderers position overlays with CSS percentages relative to the rendered <img> box.
 */
function readNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/** Map a 0-100 % coordinate local to a crop back to 0-100 % of the full image. */
function toGlobalPercent(localPercent, startPx, sizePx, fullPx) {
  const local = readNumber(localPercent);
  if (local === null || !fullPx) return null;
  return ((startPx + (local / 100) * sizePx) / fullPx) * 100;
}

/**
 * Gemini's native detection format is box_2d = [ymin, xmin, ymax, xmax] normalised to 0-1000.
 * Returns the box as 0-100 % of the crop it was produced on, or null.
 */
function localBoxFromModel(plot) {
  const raw = plot && (plot.box_2d || plot.box2d || plot.box_2D);
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const nums = raw.map(readNumber);
  if (nums.some((n) => n === null)) return null;
  const clamp = (n) => Math.min(1000, Math.max(0, n));
  const [y0, x0, y1, x1] = nums.map(clamp);
  const xmin = Math.min(x0, x1);
  const xmax = Math.max(x0, x1);
  const ymin = Math.min(y0, y1);
  const ymax = Math.max(y0, y1);
  if (xmax - xmin <= 0 || ymax - ymin <= 0) return null;
  return { xmin: xmin / 10, ymin: ymin / 10, xmax: xmax / 10, ymax: ymax / 10 };
}

/** Convert a model plot (tile-local coords) into full-image percent marker + box. */
function globalGeometry(plot, rect, imageWidth, imageHeight) {
  const box = localBoxFromModel(plot);
  if (box) {
    const left = toGlobalPercent(box.xmin, rect.left, rect.width, imageWidth);
    const right = toGlobalPercent(box.xmax, rect.left, rect.width, imageWidth);
    const top = toGlobalPercent(box.ymin, rect.top, rect.height, imageHeight);
    const bottom = toGlobalPercent(box.ymax, rect.top, rect.height, imageHeight);
    return {
      markerXPercent: (left + right) / 2,
      markerYPercent: (top + bottom) / 2,
      boxPercent: {
        xPercent: left,
        yPercent: top,
        widthPercent: right - left,
        heightPercent: bottom - top
      }
    };
  }
  const localX = plot.markerXPercent ?? plot.marker?.xPercent;
  const localY = plot.markerYPercent ?? plot.marker?.yPercent;
  return {
    markerXPercent: toGlobalPercent(localX, rect.left, rect.width, imageWidth),
    markerYPercent: toGlobalPercent(localY, rect.top, rect.height, imageHeight),
    boxPercent: null
  };
}

/**
 * Bake EXIF orientation into the pixels. sharp's metadata()/extract() work on the
 * stored (un-rotated) pixel grid while browsers display the EXIF-rotated image, so
 * without this every coordinate from a phone photo lands transposed/mirrored.
 */
async function autoOrient(fileBuffer) {
  const meta = await sharp(fileBuffer).metadata();
  if (!meta.orientation || meta.orientation === 1) {
    return { buffer: fileBuffer, width: meta.width || 1, height: meta.height || 1, rotated: false };
  }
  const { data, info } = await sharp(fileBuffer).rotate().toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width || 1, height: info.height || 1, rotated: true };
}

async function cropTile(fileBuffer, tile, imageWidth, imageHeight) {
  const left = Math.max(0, Math.round(tile.x0 * imageWidth));
  const top = Math.max(0, Math.round(tile.y0 * imageHeight));
  const width = Math.max(1, Math.min(imageWidth - left, Math.round((tile.x1 - tile.x0) * imageWidth)));
  const height = Math.max(1, Math.min(imageHeight - top, Math.round((tile.y1 - tile.y0) * imageHeight)));
  const zoomed = await sharp(fileBuffer)
    .extract({ left, top, width, height })
    .resize({ width: Math.min(2000, width * 2), withoutEnlargement: false })
    .jpeg({ quality: 90 })
    .toBuffer();
  // rect = exact pixel window that was cropped; model coords are relative to it
  return { buffer: zoomed, rect: { left, top, width, height } };
}

async function extractPlotsFromTiles(rawBuffer) {
  const { buffer: fileBuffer, width: imageWidth, height: imageHeight } = await autoOrient(rawBuffer);
  const allPlots = [];
  const failedTiles = [];
  const warnings = [];
  const tiles = buildFullCoverageTiles();

  // Sequential tiles: paid/free quota bursts kill parallel 3-wide batches on Gemini.
  for (let i = 0; i < tiles.length; i += 1) {
    const tile = tiles[i];
    try {
      const { buffer: tileBuffer, rect } = await cropTile(fileBuffer, tile, imageWidth, imageHeight);
      const parsed = await generateJsonFromImage({
        fileBuffer: tileBuffer,
        mimeType: 'image/jpeg',
        prompt: PLOT_TILE_PROMPT
      });
      const payload = parseGeminiPayload(parsed);
      const mapped = payload.plots.map((plot, index) => normalizeExtractedPlot({
        ...plot,
        ...globalGeometry(plot, rect, imageWidth, imageHeight)
      }, index)).filter(Boolean);
      console.log(`[OCR] tile ${tile.id} extracted ${mapped.length} plots`);
      allPlots.push(...mapped);
    } catch (error) {
      failedTiles.push(tile.id);
      console.warn(`[OCR] tile ${tile.id} failed:`, error.message);
    }
    if (i + 1 < tiles.length) await sleep(800);
  }

  if (failedTiles.length >= 3) {
    const error = new Error(`OCR incomplete (${failedTiles.join(', ')} failed). Wait a minute and analyze again so inventory is not overwritten.`);
    error.statusCode = 429;
    throw error;
  }
  if (failedTiles.length) {
    warnings.push(`Some naksha tiles failed (${failedTiles.join(', ')}). Plot count may be incomplete — review before saving.`);
  }

  const merged = finalizeExtractedPlots(allPlots);
  let soldPassFailed = false;
  const stamped = await applySoldStamps(fileBuffer, merged, {
    onError: () => { soldPassFailed = true; }
  });
  if (soldPassFailed) {
    warnings.push('SOLD stamp pass failed. Mark sold plots in the review table or on the admin map.');
  }
  return { plots: stamped, warnings };
}

async function applySoldStamps(rawBuffer, plots, options = {}) {
  try {
    const { buffer: fileBuffer, width: imageWidth, height: imageHeight } = await autoOrient(rawBuffer);
    const zone = { x0: 0, y0: 0, x1: 1, y1: 1 };
    const { buffer: zoneBuffer, rect } = await cropTile(fileBuffer, zone, imageWidth, imageHeight);
    const parsed = await generateJsonFromImage({
      fileBuffer: zoneBuffer,
      mimeType: 'image/jpeg',
      prompt: SOLD_STAMP_PROMPT
    });
    const solds = parseGeminiPayload(parsed).plots
      .map((plot) => normalizeExtractedPlot({
        ...plot,
        status: 'SOLD',
        ...globalGeometry(plot, rect, imageWidth, imageHeight)
      }))
      .filter((plot) => plot && readNumber(plot.marker?.xPercent) !== null && readNumber(plot.marker?.yPercent) !== null);

    if (!solds.length) {
      console.log('[OCR] sold-stamp pass found 0 SOLD plots');
      return plots;
    }

    let marked = 0;
    const next = plots.map((plot) => {
      const px = readNumber(plot.marker?.xPercent);
      const py = readNumber(plot.marker?.yPercent);
      if (px === null || py === null) return plot;
      const match = solds.find((sold) => {
        const dx = Math.abs(Number(sold.marker.xPercent) - px);
        const dy = Math.abs(Number(sold.marker.yPercent) - py);
        return dx < 3.2 && dy < 2.4;
      });
      if (!match) return plot;
      marked += 1;
      return { ...plot, status: 'SOLD' };
    });
    console.log(`[OCR] sold-stamp pass marked ${marked} plots SOLD`);
    return next;
  } catch (error) {
    console.warn('[OCR] sold-stamp pass failed:', error.message);
    if (typeof options.onError === 'function') options.onError(error);
    return plots;
  }
}

async function processMapImageOCR({ projectId, mapName, fileBuffer, fileName, mimeType }) {
  if (!fileBuffer) {
    const error = new Error('Naksha image file is required for OCR');
    error.statusCode = 400;
    throw error;
  }

  const resolvedMime = mimeType || mimeFromFileName(fileName);
  if (resolvedMime === 'application/pdf') {
    const error = new Error('Upload a JPG or PNG naksha. PDF is not supported for plot OCR.');
    error.statusCode = 400;
    throw error;
  }
  // Store the EXIF-oriented pixels so the displayed image and the OCR coordinates
  // always refer to the exact same pixel grid (no reliance on browser EXIF handling).
  let displayBuffer = fileBuffer;
  try {
    const oriented = await autoOrient(fileBuffer);
    displayBuffer = oriented.buffer;
  } catch (error) {
    const invalid = new Error('Could not read this image. Upload a valid JPG or PNG naksha.');
    invalid.statusCode = 400;
    throw invalid;
  }
  const uploadResult = await uploadToS3(displayBuffer, fileName, resolvedMime, 'naksa_layouts');
  const s3ImageUrl = typeof uploadResult === 'string' ? uploadResult : (uploadResult?.url || '');
  const imageS3Key = typeof uploadResult === 'string' ? '' : (uploadResult?.key || '');

  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured. OCR cannot invent plot inventory.');
    error.statusCode = 503;
    throw error;
  }

  let projectMeta = {};
  try {
    const metaParsed = await generateJsonFromImage({
      fileBuffer,
      mimeType: resolvedMime === 'application/pdf' ? 'application/pdf' : resolvedMime,
      prompt: META_PROMPT
    });
    projectMeta = normalizeProjectMeta(metaParsed.projectMeta || metaParsed);
  } catch (error) {
    console.warn('[OCR] project meta pass failed:', error.message);
  }

  const { plots: extractedPlots, warnings: ocrWarnings } = await extractPlotsFromTiles(displayBuffer);
  if (extractedPlots.length === 0) {
    const error = new Error('AI could not read plot boxes from this naksha. Upload a clearer layout image.');
    error.statusCode = 422;
    throw error;
  }

  const confidenceScore = ocrWarnings.length ? 0.6 : 0.8;
  const plotMapRecord = await PlotMap.create({
    projectId: projectId || undefined,
    mapName: mapName || fileName || 'Site Layout Plan',
    imageUrl: s3ImageUrl,
    imageS3Key,
    vectorOverlayData: extractedPlots,
    extractedProjectMeta: projectMeta,
    confidenceScore,
    status: 'PENDING_REVIEW'
  });

  console.log(`[OCR] merged ${extractedPlots.length} unique plots from tiles`);

  return {
    mapId: plotMapRecord._id,
    mapName: plotMapRecord.mapName,
    imageUrl: plotMapRecord.imageUrl,
    imageS3Key,
    confidenceScore,
    requiresHumanReview: true,
    usedAI: true,
    isSample: false,
    extractedPlots,
    ocrWarnings,
    projectMeta
  };
}

async function processMapImageFromUrl({ projectId, imageUrl, mapName }) {
  if (!imageUrl) return null;
  try {
    console.log(`[OCR] Auto-triggering Gemini Pro analysis for project ${projectId} from image URL: ${imageUrl}`);
    let buffer;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to download image from URL: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      return null;
    }

    let format = 'jpeg';
    try {
      format = (await sharp(buffer).metadata()).format || 'jpeg';
    } catch (_error) {
      // processMapImageOCR reports unreadable images
    }
    const ext = format === 'jpeg' ? 'jpg' : format;
    const result = await processMapImageOCR({
      projectId,
      mapName: mapName || 'Site Layout Plan',
      fileBuffer: buffer,
      fileName: `naksha_auto_analysis.${ext}`,
      mimeType: mimeFromFileName(`x.${ext}`)
    });

    if (result && result.mapId && projectId) {
      const { approveMapOverlay } = require('../controllers/ocrController');
      await approveMapOverlay(
        { params: { mapId: result.mapId }, body: { updatedVectorOverlayData: result.extractedPlots } },
        { json: () => {}, status: () => ({ json: () => {} }) },
        (err) => { if (err) console.error('[OCR] Auto-approve background error:', err); }
      );
    }
    return result;
  } catch (error) {
    console.error(`[OCR] Auto-analysis background task failed for project ${projectId}:`, error.message);
    return null;
  }
}

module.exports = {
  processMapImageOCR,
  processMapImageFromUrl,
  applySoldStamps
};
