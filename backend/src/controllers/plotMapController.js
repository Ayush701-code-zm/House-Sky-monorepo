const PlotMap = require('../models/PlotMap');

exports.getPlotMaps = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const filter = projectId ? { projectId } : {};
    const maps = await PlotMap.find(filter).populate('projectId');
    res.json(maps);
  } catch (error) {
    next(error);
  }
};

exports.getPlotMapById = async (req, res, next) => {
  try {
    const map = await PlotMap.findById(req.params.id).populate('projectId');
    if (!map) return res.status(404).json({ message: 'Plot Map not found' });
    res.json(map);
  } catch (error) {
    next(error);
  }
};
