const Project = require('../models/Project');
const ProjectSettings = require('../models/ProjectSettings');
const Plot = require('../models/Plot');
const PlotMap = require('../models/PlotMap');
const Property = require('../models/Property');
const { applyProjectMaps } = require('../utils/googleMaps');
const { normalizeExtractedPlot, buildPricedPlot, DEFAULT_STATUS } = require('../utils/plotFromOcr');
const { withFreshProjectMedia } = require('../utils/mediaHydrator');

exports.getProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || null;
    const limit = parseInt(req.query.limit) || null;

    let query = Project.find().sort({ createdAt: -1 });

    const total = await Project.countDocuments();

    if (page && limit) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const projects = await query.lean();

    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const plotCounts = await Plot.aggregate([
          { $match: { projectId: p._id } },
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const statsMap = { AVAILABLE: 0, BOOKED: 0, PENDING: 0, AGREEMENT: 0, SOLD: 0 };
        plotCounts.forEach(item => {
          if (item._id && statsMap[item._id] !== undefined) {
            statsMap[item._id] = item.count;
          }
        });

        const totalPlotsInDB = Object.values(statsMap).reduce((a, b) => a + b, 0);

        const hydrated = await withFreshProjectMedia(p);

        return {
          ...hydrated,
          totalPlots: Math.max(p.totalPlots || 0, totalPlotsInDB),
          availableCount: statsMap.AVAILABLE,
          bookedCount: statsMap.BOOKED,
          pendingCount: statsMap.PENDING,
          agreementCount: statsMap.AGREEMENT,
          soldCount: statsMap.SOLD
        };
      })
    );

    if (page && limit) {
      return res.json({
        data: projectsWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    }

    res.json(projectsWithStats);
  } catch (error) {
    next(error);
  }
};

const { processMapImageFromUrl } = require('../services/ocrPipeline');

exports.createProject = async (req, res, next) => {
  try {
    const maps = applyProjectMaps(req.body);
    const ocrPlots = Array.isArray(req.body.ocrPlots) ? req.body.ocrPlots : [];
    const normalizedPlots = ocrPlots
      .map((plot, index) => normalizeExtractedPlot(plot, index))
      .filter(Boolean);

    const project = await Project.create({
      ...req.body,
      ...maps,
      totalPlots: normalizedPlots.length || Number(req.body.totalPlots) || 0
    });
    await ProjectSettings.create({ projectId: project._id });

    if (normalizedPlots.length > 0) {
      const plotsToInsert = normalizedPlots.map((plot) => {
        const priced = buildPricedPlot(plot, project.basePricePerSqft);
        return {
          projectId: project._id,
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
          coordinates: priced.coordinates || { x: 0, y: 0, width: 0, height: 0 },
          polygon: { points: priced.polygonPoints || [] },
          status: priced.status || DEFAULT_STATUS
        };
      });
      await Plot.insertMany(plotsToInsert);
      project.totalPlots = plotsToInsert.length;
      await project.save();
    }

    if (req.body.mapId) {
      await PlotMap.findByIdAndUpdate(req.body.mapId, {
        projectId: project._id,
        status: 'APPROVED'
      });
    }

    const mapLayoutImage = req.body.mapImageUrl || req.body.bannerImage;
    if (mapLayoutImage && normalizedPlots.length === 0) {
      processMapImageFromUrl({
        projectId: project._id,
        imageUrl: mapLayoutImage,
        mapName: `${project.name} Naksha Layout`
      }).catch((err) => console.error('[OCR] Background auto-analysis task failed:', err));
    }

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Only re-derive map fields when the caller actually sent them; otherwise a
    // partial update would wipe the stored Google Maps URL / embed URL.
    const touchesMaps =
      req.body.googleMapsUrl !== undefined ||
      req.body.mapEmbedUrl !== undefined ||
      req.body.latitude !== undefined ||
      req.body.longitude !== undefined;
    const maps = touchesMaps ? applyProjectMaps(req.body) : {};
    const project = await Project.findByIdAndUpdate(id, { ...req.body, ...maps }, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Plot.deleteMany({ projectId: id });
    await ProjectSettings.deleteMany({ projectId: id });
    // Detach standalone listings so they don't keep a dangling project reference.
    await Property.updateMany({ projectId: id }, { $set: { projectId: null } });
    res.json({ message: 'Project and associated plots deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const rawProject = await Project.findById(req.params.id).lean();
    if (!rawProject) return res.status(404).json({ message: 'Project not found' });
    
    const project = await withFreshProjectMedia(rawProject);
    const settings = await ProjectSettings.findOne({ projectId: rawProject._id });
    const plotCounts = await Plot.aggregate([
      { $match: { projectId: rawProject._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.json({
      project,
      settings,
      plotStats: plotCounts.reduce((acc, c) => {
        acc[c._id] = c.count;
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProjectSettings = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const settings = await ProjectSettings.findOneAndUpdate(
      { projectId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    next(error);
  }
};
