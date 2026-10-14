const Transaction = require('../models/Transaction');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Plot = require('../models/Plot');
const Commission = require('../models/Commission');
const Payout = require('../models/Payout');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const totalProjects = await Project.countDocuments();

    // Plot counts by status
    const plotStatsArray = await Plot.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const plotStats = {
      total: 0,
      AVAILABLE: 0,
      BOOKED: 0,
      PENDING: 0,
      SOLD: 0
    };

    plotStatsArray.forEach(item => {
      if (item._id && plotStats[item._id] !== undefined) plotStats[item._id] = item.count;
      plotStats.total += item.count;
    });

    // Total Revenue from completed transactions
    const revenueAgg = await Transaction.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Monthly Revenue (Current Month)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyRevAgg = await Transaction.aggregate([
      // Use transactionDate (the sale date) — same field as the revenue trend chart.
      { $match: { status: 'COMPLETED', transactionDate: { $gte: startOfMonth } } },
      { $group: { _id: null, monthlyRevenue: { $sum: "$amount" } } }
    ]);
    const monthlyRevenue = monthlyRevAgg.length > 0 ? monthlyRevAgg[0].monthlyRevenue : 0;

    // Total Commissions
    const commAgg = await Commission.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalCommissions: { $sum: "$commissionAmount" } } }
    ]);
    const totalCommissions = commAgg.length > 0 ? commAgg[0].totalCommissions : 0;

    // Total Payouts
    const payoutAgg = await Payout.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, totalPayouts: { $sum: "$amount" } } }
    ]);
    const totalPayouts = payoutAgg.length > 0 ? payoutAgg[0].totalPayouts : 0;

    // Revenue Trend Chart — real aggregation of the last 6 months of sales.
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const trendAgg = await Transaction.aggregate([
      { $match: { status: 'COMPLETED', transactionDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { y: { $year: '$transactionDate' }, m: { $month: '$transactionDate' } },
          revenue: { $sum: '$amount' },
          sales: { $sum: 1 }
        }
      }
    ]);

    const trendMap = {};
    trendAgg.forEach((t) => { trendMap[`${t._id.y}-${t._id.m}`] = t; });

    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const entry = trendMap[key];
      revenueTrend.push({
        month: monthLabels[d.getMonth()],
        revenue: entry ? entry.revenue : 0,
        sales: entry ? entry.sales : 0
      });
    }

    // Top Employees Leaderboard
    const topEmployees = await Employee.find()
      .sort({ selfSalesCount: -1 })
      .limit(5)
      .populate('userId', 'fullName email avatar');

    // Project Revenue Breakdown — real revenue per project from completed sales.
    const projectRevenues = await Project.find().select('name code basePricePerSqft totalPlots');
    const projectRevAgg = await Transaction.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $lookup: { from: 'plots', localField: 'plotId', foreignField: '_id', as: 'plot' } },
      { $unwind: '$plot' },
      { $group: { _id: '$plot.projectId', revenue: { $sum: '$amount' }, sales: { $sum: 1 } } }
    ]);
    // Live plot counts per project (stored totalPlots is not updated by CSV import / OCR).
    const plotsPerProjectAgg = await Plot.aggregate([
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]);
    const plotsPerProject = {};
    plotsPerProjectAgg.forEach((r) => { plotsPerProject[String(r._id)] = r.count; });
    const projectRevMap = {};
    projectRevAgg.forEach((r) => { projectRevMap[String(r._id)] = r; });

    res.json({
      kpi: {
        totalRevenue,
        monthlyRevenue,
        totalEmployees,
        totalProjects,
        totalPlots: plotStats.total,
        availablePlots: plotStats.AVAILABLE,
        bookedPlots: plotStats.BOOKED,
        pendingPlots: plotStats.PENDING,
        soldPlots: plotStats.SOLD,
        totalCommissions,
        totalPayouts
      },
      charts: {
        revenueTrend,
        plotStatusDistribution: [
          { name: 'Available', value: plotStats.AVAILABLE, color: '#22C55E' },
          { name: 'Booked', value: plotStats.BOOKED, color: '#3B82F6' },
          { name: 'Pending', value: plotStats.PENDING, color: '#FACC15' },
          { name: 'Sold', value: plotStats.SOLD, color: '#EF4444' }
        ],
        topEmployees: topEmployees.map(e => ({
          name: e.userId ? e.userId.fullName : e.employeeCode,
          rank: e.currentRank,
          sales: e.selfSalesCount,
          teamSales: e.teamSalesCount
        })),
        projectRevenue: projectRevenues.map(p => ({
          name: p.name,
          plots: Math.max(p.totalPlots || 0, plotsPerProject[String(p._id)] || 0),
          soldPlots: projectRevMap[String(p._id)] ? projectRevMap[String(p._id)].sales : 0,
          revenue: projectRevMap[String(p._id)] ? projectRevMap[String(p._id)].revenue : 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
