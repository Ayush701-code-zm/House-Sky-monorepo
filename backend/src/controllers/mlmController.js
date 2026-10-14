const { getMLMTree, evaluateAndUpgradeRank, getDownlineEmployeeIds, RANK_RULES } = require('../services/mlmEngine');
const Employee = require('../models/Employee');

exports.getTree = async (req, res, next) => {
  try {
    let effectiveRootId = req.query.rootId || null;

    if (req.user && !['ADMIN', 'DIRECTOR'].includes(req.user.role)) {
      const loggedInEmp = await Employee.findOne({ userId: req.user._id });
      if (!loggedInEmp) {
        return res.json(null);
      }
      const downlines = await getDownlineEmployeeIds(loggedInEmp._id);
      const allowedIds = [loggedInEmp._id.toString(), ...downlines.map(d => d.toString())];

      if (!effectiveRootId || !allowedIds.includes(effectiveRootId)) {
        effectiveRootId = loggedInEmp._id.toString();
      }
    }

    const treeData = await getMLMTree(effectiveRootId);
    res.json(treeData);
  } catch (error) {
    next(error);
  }
};

exports.evaluateRank = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const evaluation = await evaluateAndUpgradeRank(employeeId);
    res.json(evaluation);
  } catch (error) {
    next(error);
  }
};

exports.getRankRules = async (req, res, next) => {
  try {
    res.json(RANK_RULES);
  } catch (error) {
    next(error);
  }
};

exports.getMLMSummary = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const rankCounts = await Employee.aggregate([
      { $group: { _id: "$currentRank", count: { $sum: 1 } } }
    ]);

    const totalSales = await Employee.aggregate([
      { $group: { _id: null, total: { $sum: "$selfSalesCount" } } }
    ]);

    res.json({
      totalEmployees,
      totalSalesCount: totalSales.length > 0 ? totalSales[0].total : 0,
      rankBreakdown: rankCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
};
