const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const EmployeeHierarchy = require('../models/EmployeeHierarchy');

// House & Sky Business Promotion Plan. One table. Ordered highest -> lowest.
// commissionPercent is the differential ladder rate, except Core Member: that
// 5% is a separate turnover royalty and is not a step above 20%.
// Senior Sales Manager must reach 50 team plots within 90 days of joining.
// Sales Director must reach 100 team plots within 100 days of joining.
// Core Member also needs 2 downline Sales Directors (the poster’s “+ 2”).
const RANK_RULES = [
  {
    rank: 'Core Member',
    commissionPercent: 5,
    turnoverPercent: 5,
    minSelfSales: 1,
    minTeamSales: 500,
    minLegs: 0,
    minSalesDirectors: 2,
    timeLimitDays: null,
    rankOrder: 7,
    assignedOnly: false
  },
  {
    rank: 'Sales Director',
    commissionPercent: 20,
    minSelfSales: 1,
    minTeamSales: 100,
    minLegs: 0,
    minSalesDirectors: 0,
    timeLimitDays: 100,
    rankOrder: 6,
    assignedOnly: false
  },
  {
    rank: 'Senior Sales Manager',
    commissionPercent: 18,
    minSelfSales: 1,
    minTeamSales: 50,
    minLegs: 0,
    minSalesDirectors: 0,
    timeLimitDays: 90,
    rankOrder: 5,
    assignedOnly: false
  },
  {
    rank: 'Sales Manager',
    commissionPercent: 15,
    minSelfSales: 1,
    minTeamSales: 20,
    minLegs: 0,
    minSalesDirectors: 0,
    timeLimitDays: null,
    rankOrder: 4,
    assignedOnly: false
  },
  {
    rank: 'Business Development Manager',
    commissionPercent: 12,
    minSelfSales: 1,
    minTeamSales: 8,
    minLegs: 0,
    minSalesDirectors: 0,
    timeLimitDays: null,
    rankOrder: 3,
    assignedOnly: false
  },
  {
    rank: 'Senior Team Leader',
    commissionPercent: 10,
    minSelfSales: 1,
    minTeamSales: 4,
    minLegs: 0,
    minSalesDirectors: 0,
    timeLimitDays: null,
    rankOrder: 2,
    assignedOnly: false
  },
  {
    rank: 'Team Leader',
    commissionPercent: 8,
    minSelfSales: 1,
    minTeamSales: 2,
    minLegs: 0,
    minSalesDirectors: 0,
    timeLimitDays: null,
    rankOrder: 1,
    assignedOnly: false
  },
  {
    rank: 'Advisor',
    commissionPercent: 5,
    minSelfSales: 1,
    minTeamSales: 0,
    minLegs: 0,
    minSalesDirectors: 0,
    timeLimitDays: null,
    rankOrder: 0,
    assignedOnly: false
  }
];

const ENTRY_RANK = 'Advisor';
const SALES_DIRECTOR_RANKS = ['Sales Director', 'Core Member'];

/**
 * Is an employee genuinely qualified for a rank given their live metrics?
 * Used by the commission engine so an under-qualified member (e.g. 0 self
 * sales but labelled Advisor) never absorbs a commission slice.
 * assignedOnly ranks, if any, are always considered qualified.
 */
function isRankQualified(rankName, metrics) {
  const rule = RANK_RULES.find((r) => r.rank === rankName);
  if (!rule) return false;
  if (rule.assignedOnly) return true;
  return (
    (metrics.selfSalesCount || 0) >= rule.minSelfSales &&
    (metrics.teamSalesCount || 0) >= rule.minTeamSales &&
    (metrics.activeLegsCount || 0) >= rule.minLegs &&
    (metrics.salesDirectorCount || 0) >= (rule.minSalesDirectors || 0)
  );
}

/** Downline members already at Sales Director or Core Member. */
async function countSeniorSalesDirectors(employeeId) {
  const ids = await getDownlineEmployeeIds(employeeId);
  if (!ids.length) return 0;
  return Employee.countDocuments({
    _id: { $in: ids },
    currentRank: { $in: SALES_DIRECTOR_RANKS }
  });
}

/**
 * Get all downline employee IDs recursively for a given employee.
 * `visited` guards against a corrupted parentId cycle (A -> B -> A) that
 * would otherwise cause infinite recursion.
 */
async function getDownlineEmployeeIds(employeeId, visited = new Set()) {
  const key = employeeId.toString();
  if (visited.has(key)) return [];
  visited.add(key);

  const children = await Employee.find({ parentId: employeeId }).select('_id');
  let allDownlineIds = [];

  for (const child of children) {
    if (visited.has(child._id.toString())) continue;
    allDownlineIds.push(child._id);
    const subDownline = await getDownlineEmployeeIds(child._id, visited);
    allDownlineIds = allDownlineIds.concat(subDownline);
  }
  return allDownlineIds;
}

/**
 * Calculate team sales & active legs for an employee
 */
async function calculateEmployeeSalesMetrics(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new Error('Employee not found');

  const directLegs = await Employee.find({ parentId: employeeId });
  let activeLegsCount = 0;
  let totalTeamSalesCount = 0;

  for (const leg of directLegs) {
    const legDownlines = await getDownlineEmployeeIds(leg._id);
    const legAllEmployeeIds = [leg._id, ...legDownlines];

    const legEmployees = await Employee.find({ _id: { $in: legAllEmployeeIds } });
    const legTotalSales = legEmployees.reduce((sum, emp) => sum + emp.selfSalesCount, 0);

    totalTeamSalesCount += legTotalSales;

    if (legTotalSales > 0 || leg.selfSalesCount > 0) {
      activeLegsCount++;
    }
  }

  employee.teamSalesCount = totalTeamSalesCount;
  employee.activeLegsCount = activeLegsCount;
  await employee.save();

  return {
    selfSalesCount: employee.selfSalesCount,
    teamSalesCount: totalTeamSalesCount,
    activeLegsCount: activeLegsCount,
    joiningDate: employee.joiningDate
  };
}

/**
 * Evaluate and promote employee rank based on criteria
 */
async function evaluateAndUpgradeRank(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new Error('Employee not found');

  const metrics = await calculateEmployeeSalesMetrics(employeeId);

  const daysSinceJoining = Math.floor(
    (Date.now() - new Date(metrics.joiningDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Highest rank this member qualifies for. Time windows block promotion only.
  // A rank already earned is never removed after the window closes.
  const salesDirectorCount = await countSeniorSalesDirectors(employeeId);
  let candidate = null;
  for (const rule of RANK_RULES) {
    if (rule.assignedOnly) continue;
    if (metrics.selfSalesCount < rule.minSelfSales) continue;
    if (metrics.teamSalesCount < rule.minTeamSales) continue;
    if (metrics.activeLegsCount < rule.minLegs) continue;
    if ((rule.minSalesDirectors || 0) > salesDirectorCount) continue;
    if (rule.timeLimitDays !== null && daysSinceJoining > rule.timeLimitDays) continue;

    candidate = rule;
    break; // RANK_RULES is ordered highest -> lowest
  }

  const previousRank = employee.currentRank;
  const currentRule = RANK_RULES.find((r) => r.rank === employee.currentRank);
  const currentOrder = currentRule ? currentRule.rankOrder : -1;

  // Promotion-only: upgrade if the qualified rank is strictly higher than the
  // current one. Never auto-demote (protects earned ranks, owner's DS, and an
  // ASD who crossed the 60-day window).
  if (candidate && candidate.rankOrder > currentOrder) {
    employee.currentRank = candidate.rank;
    await employee.save();
  }

  const effectiveRule = RANK_RULES.find((r) => r.rank === employee.currentRank);
  const commissionRate = isRankQualified(employee.currentRank, metrics)
    ? (effectiveRule ? effectiveRule.commissionPercent : 0)
    : 0;

  return {
    employeeId: employee._id,
    currentRank: employee.currentRank,
    previousRank,
    upgraded: employee.currentRank !== previousRank,
    newRank: employee.currentRank,
    qualified: isRankQualified(employee.currentRank, metrics),
    commissionRate,
    metrics
  };
}

/**
 * Build recursive downline tree for visual rendering.
 * Safely handles rootEmployeeId (ObjectId or fallback).
 */
async function getMLMTree(rootEmployeeId = null) {
  let root = null;

  if (rootEmployeeId && mongoose.Types.ObjectId.isValid(rootEmployeeId)) {
    root = await Employee.findById(rootEmployeeId).populate('userId', 'fullName email phone avatar');
  }

  // If no valid root found by ID, try finding by employeeCode or top level CEO (parentId: null)
  if (!root) {
    // Oldest top-level member = company root. Without a sort Mongo may return
    // any parentless member (e.g. an unsponsored public applicant).
    root = await Employee.findOne({ parentId: null }).sort({ createdAt: 1 }).populate('userId', 'fullName email phone avatar');
  }

  // Final fallback to any employee
  if (!root) {
    root = await Employee.findOne().populate('userId', 'fullName email phone avatar');
  }

  if (!root) return null;

  const visited = new Set();

  async function buildNode(emp) {
    visited.add(emp._id.toString());
    const children = await Employee.find({ parentId: emp._id }).populate('userId', 'fullName email phone avatar');
    const childNodes = [];

    for (const child of children) {
      if (visited.has(child._id.toString())) continue; // guard against parentId cycles
      const childTree = await buildNode(child);
      childNodes.push(childTree);
    }

    const rule = RANK_RULES.find(r => r.rank === emp.currentRank) || RANK_RULES[RANK_RULES.length - 1];

    return {
      id: emp._id.toString(),
      employeeCode: emp.employeeCode,
      name: emp.userId ? emp.userId.fullName : 'Employee',
      email: emp.userId ? emp.userId.email : '',
      phone: emp.userId ? emp.userId.phone : '',
      avatar: emp.userId ? emp.userId.avatar : '',
      currentRank: emp.currentRank,
      commissionPercent: rule.commissionPercent,
      selfSalesCount: emp.selfSalesCount,
      teamSalesCount: emp.teamSalesCount,
      activeLegsCount: emp.activeLegsCount,
      parentId: emp.parentId ? emp.parentId.toString() : null,
      // legNumber: which numbered direct-child slot under the parent (1, 2, 3...)
      // Falls back to the legacy position field for migrated records that have it.
      legNumber: emp.legNumber || (emp.position === 'RIGHT' ? 2 : 1),
      children: childNodes
    };
  }

  return await buildNode(root);
}

module.exports = {
  RANK_RULES,
  ENTRY_RANK,
  SALES_DIRECTOR_RANKS,
  isRankQualified,
  countSeniorSalesDirectors,
  calculateEmployeeSalesMetrics,
  evaluateAndUpgradeRank,
  getDownlineEmployeeIds,
  getMLMTree
};
