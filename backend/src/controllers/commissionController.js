const Commission = require('../models/Commission');
const Employee = require('../models/Employee');
const { getDownlineEmployeeIds } = require('../services/mlmEngine');
const { runCommissionCalculation } = require('../services/commissionCron');

exports.getCommissions = async (req, res, next) => {
  try {
    const { employeeId, status } = req.query;
    const filter = {};

    if (req.user && !['ADMIN', 'DIRECTOR'].includes(req.user.role)) {
      const loggedInEmp = await Employee.findOne({ userId: req.user._id });
      if (!loggedInEmp) {
        return res.json([]);
      }
      const downlines = await getDownlineEmployeeIds(loggedInEmp._id);
      const allowedIds = [loggedInEmp._id.toString(), ...downlines.map(d => d.toString())];

      if (employeeId) {
        if (!allowedIds.includes(employeeId.toString())) {
          return res.json([]);
        }
        filter.employeeId = employeeId;
      } else {
        filter.employeeId = { $in: allowedIds };
      }
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status) filter.status = status;

    const commissions = await Commission.find(filter)
      .populate('plotId')
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'fullName email' }
      })
      .populate('transactionId')
      .sort({ createdAt: -1 });

    res.json(commissions);
  } catch (error) {
    next(error);
  }
};

exports.getCommissionSummary = async (req, res, next) => {
  try {
    // MANAGERs only see totals for themselves + their downline (same scope as
    // the commission list); ADMIN/DIRECTOR see company-wide totals.
    const scope = {};
    if (req.user && !['ADMIN', 'DIRECTOR'].includes(req.user.role)) {
      const loggedInEmp = await Employee.findOne({ userId: req.user._id });
      const downlines = loggedInEmp ? await getDownlineEmployeeIds(loggedInEmp._id) : [];
      scope.employeeId = { $in: loggedInEmp ? [loggedInEmp._id, ...downlines] : [] };
    }

    const summary = await Commission.aggregate([
      { $match: scope },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$commissionAmount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCommissionsPaid = await Commission.aggregate([
      { $match: { ...scope, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
    ]);

    const totalCommissionsPending = await Commission.aggregate([
      { $match: { ...scope, status: { $in: ['CALCULATED', 'APPROVED'] } } },
      { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
    ]);

    res.json({
      breakdown: summary,
      totalPaid: totalCommissionsPaid.length > 0 ? totalCommissionsPaid[0].total : 0,
      totalPending: totalCommissionsPending.length > 0 ? totalCommissionsPending[0].total : 0
    });
  } catch (error) {
    next(error);
  }
};

exports.runCommissionCalculation = async (req, res, next) => {
  try {
    const result = await runCommissionCalculation();
    res.json(result);
  } catch (error) {
    next(error);
  }
};
