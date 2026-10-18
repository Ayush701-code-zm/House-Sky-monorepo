const { processMapImageOCR } = require('../services/ocrPipeline');
const PlotMap = require('../models/PlotMap');
const Plot = require('../models/Plot');
const Project = require('../models/Project');
const {
  normalizeExtractedPlot,
  normalizeProjectMeta,
  buildPricedPlot,
  finalizeExtractedPlots,
  resolveApproveStatus,
  DEFAULT_STATUS
} = require('../utils/plotFromOcr');

function mergeProjectMeta(existing, meta) {
  const next = {};
  if (meta.location && !existing.location) next.location = meta.location;
  if (meta.surveyNumber) next.surveyNumber = meta.surveyNumber;
  if (meta.village) next.village = meta.village;
  if (meta.highlights.length && !(existing.highlights || []).length) next.highlights = meta.highlights;
  if (meta.amenities.length && !(existing.amenities || []).length) next.amenities = meta.amenities;
  if (meta.locationAdvantages.length && !(existing.locationAdvantages || []).length) {
    next.locationAdvantages = meta.locationAdvantages;
  }
  return next;
}

exports.analyzeMap = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Upload a naksha image to extract plot details' });
    }

    const result = await processMapImageOCR({
      projectId: req.body.projectId || null,
      mapName: req.body.mapName || req.file.originalname,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype
    });

    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

exports.approveMapOverlay = async (req, res, next) => {
  try {
    const { mapId } = req.params;
    const { updatedVectorOverlayData } = req.body;

    const plotMap = await PlotMap.findById(mapId);
    if (!plotMap) return res.status(404).json({ message: 'Plot Map not found' });
    if (!plotMap.projectId) {
      return res.status(400).json({ message: 'This OCR result is not linked to a project yet' });
    }

    const project = await Project.findById(plotMap.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const reviewed = Array.isArray(updatedVectorOverlayData) && updatedVectorOverlayData.length > 0;
    const rawPlots = reviewed ? updatedVectorOverlayData : (plotMap.vectorOverlayData || []);

    // Rows were already de-duplicated by the OCR pipeline; merging again by position
    // would drop plots the reviewer explicitly kept (and collapse un-pinned plots).
    const normalizedPlots = finalizeExtractedPlots(
      rawPlots
        .map((plot, index) => normalizeExtractedPlot(plot, index))
        .filter(Boolean),
      { merge: false }
    );

    // #region agent log
    const __dbg = (hypothesisId, message, data) => { try { require('fs').appendFileSync('/Users/ayushanand/Developer/Autoroma-perume/.cursor/debug-e67702.log', JSON.stringify({ sessionId: 'e67702', runId: 'approve-post-fix', hypothesisId, location: 'ocrController.js:approveMapOverlay', message, data, timestamp: Date.now() }) + '\n'); } catch (_) {} };
    __dbg('F', 'approve input', { mapId, reviewed, rawCount: rawPlots.length, normalizedCount: normalizedPlots.length, droppedByNormalize: rawPlots.length - normalizedPlots.length, sampleRaw: rawPlots.slice(0, 3).map((p) => ({ plotNo: p.plotNo, block: p.block, sellableSqYrd: p.sellableSqYrd, hasMarker: Boolean(p.marker || p.markerXPercent) })) });
    // #endregion
    if (normalizedPlots.length === 0) {
      // #region agent log
      __dbg('F', '422 no readable plots', { rawCount: rawPlots.length });
      // #endregion
      return res.status(422).json({ message: 'No readable plots to approve. Re-upload a clearer naksha.' });
    }

    // A plot is identified by block + plotNo (Plot schema unique index), because
    // nakshas restart numbering per block (Block A plot 7 and Block B plot 7 coexist).
    const plotKey = (plot) => `${String(plot.block || '').toUpperCase()}|${String(plot.plotNo).toUpperCase()}`;
    const plotLabel = (plot) => (plot.block ? `${plot.block}-${plot.plotNo}` : String(plot.plotNo));
    if (reviewed) {
      const seen = new Set();
      const duplicates = new Map();
      normalizedPlots.forEach((plot) => {
        const key = plotKey(plot);
        if (seen.has(key)) duplicates.set(key, plotLabel(plot));
        seen.add(key);
      });
      // #region agent log
      __dbg('G', 'duplicate check (block+plotNo)', { duplicates: Array.from(duplicates.values()), dupDetails: normalizedPlots.filter((p) => duplicates.has(plotKey(p))).map((p) => ({ plotNo: p.plotNo, block: p.block, sellableSqYrd: p.sellableSqYrd, x: p.marker && p.marker.xPercent, y: p.marker && p.marker.yPercent })) });
      // #endregion
      if (duplicates.size) {
        return res.status(422).json({
          message: `Duplicate plots in the same block: ${Array.from(duplicates.values()).join(', ')}. Fix the block or plot number of these rows before saving.`
        });
      }
    }

    plotMap.status = 'APPROVED';
    plotMap.vectorOverlayData = normalizedPlots;
    await plotMap.save();

    const projectPatch = {
      mapImageUrl: plotMap.imageUrl,
      totalPlots: normalizedPlots.length
    };
    if (!project.bannerImage) {
      projectPatch.bannerImage = plotMap.imageUrl;
    }
    if (plotMap.imageS3Key) {
      projectPatch.mapImageS3Key = plotMap.imageS3Key;
      if (!project.bannerImageS3Key) {
        projectPatch.bannerImageS3Key = plotMap.imageS3Key;
      }
    }
    Object.assign(projectPatch, mergeProjectMeta(project, normalizeProjectMeta(plotMap.extractedProjectMeta || {})));
    await Project.findByIdAndUpdate(plotMap.projectId, projectPatch);

    const keptPlotIds = [];
    for (const plotData of normalizedPlots) {
      const priced = buildPricedPlot(plotData, project.basePricePerSqft);
      const identity = { projectId: plotMap.projectId, block: priced.block, plotNo: priced.plotNo };
      const existing = await Plot.findOne(identity);
      const nextStatus = resolveApproveStatus(existing, priced.status || DEFAULT_STATUS);
      const saved = await Plot.findOneAndUpdate(
        identity,
        {
          projectId: plotMap.projectId,
          block: priced.block,
          plotNo: priced.plotNo,
          sizeSqft: priced.sizeSqft,
          sellableSqYrd: priced.sellableSqYrd,
          carpetSqYrd: priced.carpetSqYrd,
          plc12mtr: priced.plc12mtr,
          plc9mtr: priced.plc9mtr,
          plcCorner: priced.plcCorner,
          plcParkFacing: priced.plcParkFacing,
          totalPlc: priced.totalPlc,
          discountedPlc: priced.discountedPlc,
          otmc: priced.otmc,
          baseRatePerSqYrd: priced.baseRatePerSqYrd,
          gstOnOtherCharges: priced.gstOnOtherCharges,
          totalCost: priced.totalCost,
          price: priced.price,
          plotType: priced.plotType,
          facing: priced.facing,
          dimensions: priced.dimensions,
          superBuiltUpSqft: priced.superBuiltUpSqft,
          marker: priced.marker,
          coordinates: priced.coordinates,
          polygon: { points: priced.polygonPoints },
          status: nextStatus
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      keptPlotIds.push(saved._id);
    }

    await Plot.deleteMany({
      projectId: plotMap.projectId,
      status: DEFAULT_STATUS,
      _id: { $nin: keptPlotIds }
    });

    // #region agent log
    __dbg('G', 'approve saved', { plotCount: keptPlotIds.length });
    // #endregion
    res.json({
      message: 'Naksha approved. Plot inventory synced from AI extraction.',
      plotCount: keptPlotIds.length,
      plotMap
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectMapOverlay = async (req, res, next) => {
  try {
    const { mapId } = req.params;
    const plotMap = await PlotMap.findById(mapId);
    if (!plotMap) return res.status(404).json({ message: 'Plot Map not found' });

    plotMap.status = 'REJECTED';
    await plotMap.save();

    res.json({ message: 'Map overlay rejected', plotMap });
  } catch (error) {
    next(error);
  }
};

exports.getLatestMapByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const plotMap = await PlotMap.findOne({ projectId }).sort({ createdAt: -1 });
    if (!plotMap) return res.status(404).json({ message: 'No OCR map found for this project' });
    res.json({
      mapId: plotMap._id,
      mapName: plotMap.mapName,
      imageUrl: plotMap.imageUrl,
      imageS3Key: plotMap.imageS3Key,
      extractedPlots: plotMap.vectorOverlayData || [],
      projectMeta: plotMap.extractedProjectMeta || {},
      confidenceScore: plotMap.confidenceScore || 0,
      requiresHumanReview: true,
      usedAI: true,
      isSample: false,
      status: plotMap.status,
      createdAt: plotMap.createdAt
    });
  } catch (error) {
    next(error);
  }
};
