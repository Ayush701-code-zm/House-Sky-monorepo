const Employee = require('../models/Employee');
const ProjectSettings = require('../models/ProjectSettings');
const Commission = require('../models/Commission');
const Transaction = require('../models/Transaction');
const Plot = require('../models/Plot');
const { RANK_RULES, isRankQualified, evaluateAndUpgradeRank, countSeniorSalesDirectors } = require('./mlmEngine');

const CORE_RANK = 'Core Member';
const LADDER_CAP_RANK = 'Sales Director';

/** Round a rupee amount to whole paise (2 decimals) to avoid float drift. */
function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Table commission rate for a rank, honouring per-project overrides
 * (ProjectSettings.rankOverrides) which carry the project's business-plan table.
 */
async function getRankCommissionRate(rankName, projectId = null) {
  let baseRate = 0;
  const standardRule = RANK_RULES.find((r) => r.rank === rankName);
  if (standardRule) {
    baseRate = standardRule.commissionPercent;
  }

  if (projectId) {
    const projSettings = await ProjectSettings.findOne({ projectId });
    if (projSettings && projSettings.rankOverrides && projSettings.rankOverrides.length > 0) {
      const override = projSettings.rankOverrides.find((o) => o.rank === rankName);
      if (override && override.commissionPercent !== undefined && override.commissionPercent !== null) {
        return override.commissionPercent;
      }
    }
  }

  return baseRate;
}

/**
 * Effective rate an employee actually earns: the project rate for their rank,
 * but 0 if they do not currently meet that rank's qualification criteria (so an
 * under-qualified sponsor never swallows a differential slice).
 */
async function qualificationMetrics(employee) {
  const metrics = {
    selfSalesCount: employee.selfSalesCount || 0,
    teamSalesCount: employee.teamSalesCount || 0,
    activeLegsCount: employee.activeLegsCount || 0,
    salesDirectorCount: 0
  };
  if (employee.currentRank === CORE_RANK) {
    metrics.salesDirectorCount = await countSeniorSalesDirectors(employee._id);
  }
  return metrics;
}

/**
 * Differential ladder rate. A qualified Core Member sits at the Sales Director
 * cap (20%) so the unpaid gap still reaches them. Their poster 5% is turnover
 * and is added beside that cap, not instead of a higher ladder step.
 */
async function getEmployeeEffectiveRate(employee, projectId = null) {
  const metrics = await qualificationMetrics(employee);
  if (!isRankQualified(employee.currentRank, metrics)) return 0;
  if (employee.currentRank === CORE_RANK) {
    return getRankCommissionRate(LADDER_CAP_RANK, projectId);
  }
  return getRankCommissionRate(employee.currentRank, projectId);
}

async function getTurnoverRate(employee, projectId = null) {
  if (employee.currentRank !== CORE_RANK) return 0;
  const metrics = await qualificationMetrics(employee);
  if (!isRankQualified(employee.currentRank, metrics)) return 0;
  const rule = RANK_RULES.find((item) => item.rank === CORE_RANK);
  const tableRate = await getRankCommissionRate(CORE_RANK, projectId);
  return tableRate || (rule && rule.turnoverPercent) || 0;
}

/**
 * Process differential commissions for a completed plot transaction.
 * Idempotent: a transaction already carrying commissions is never re-paid.
 */
async function processDifferentialCommission(transactionId) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  // Idempotency guard — never pay the same transaction twice.
  const existing = await Commission.find({ transactionId: transaction._id });
  if (existing.length > 0) return existing;

  const plot = await Plot.findById(transaction.plotId);
  if (!plot) throw new Error('Plot not found');

  const sellerEmployee = await Employee.findById(transaction.sellerEmployeeId);
  if (!sellerEmployee) throw new Error('Selling employee not found');

  // Count the sale for the seller, then re-evaluate their rank.
  sellerEmployee.selfSalesCount += 1;
  await sellerEmployee.save();
  await evaluateAndUpgradeRank(sellerEmployee._id);

  const createdCommissions = [];
  let previousMaxRate = 0;
  let currentEmp = await Employee.findById(sellerEmployee._id);
  let depth = 0;
  const visited = new Set(); // guard against parentId cycles

  // Ascend the upline sponsor chain distributing differential commission.
  while (currentEmp && !visited.has(currentEmp._id.toString())) {
    visited.add(currentEmp._id.toString());

    // Re-evaluate this member so their metrics/rank are current, then re-fetch.
    await evaluateAndUpgradeRank(currentEmp._id);
    currentEmp = await Employee.findById(currentEmp._id);

    const empRankRate = await getEmployeeEffectiveRate(currentEmp, plot.projectId);
    const differentialRate = Math.max(0, empRankRate - previousMaxRate);
    const turnoverRate = await getTurnoverRate(currentEmp, plot.projectId);
    const gapAmount = differentialRate > 0 ? roundMoney((transaction.amount * differentialRate) / 100) : 0;
    const turnoverAmount = turnoverRate > 0 ? roundMoney((transaction.amount * turnoverRate) / 100) : 0;

    if (gapAmount > 0 || turnoverAmount > 0) {
      const commRecord = await Commission.create({
        transactionId: transaction._id,
        plotId: plot._id,
        employeeId: currentEmp._id,
        rankAtSale: currentEmp.currentRank,
        saleAmount: transaction.amount,
        commissionRate: gapAmount > 0 ? empRankRate : turnoverRate,
        differentialRate: gapAmount > 0 ? differentialRate : turnoverRate,
        turnoverAmount,
        commissionAmount: roundMoney(gapAmount + turnoverAmount),
        levelDepth: depth,
        status: 'CALCULATED',
        calculatedAt: new Date()
      });

      createdCommissions.push(commRecord);
      if (gapAmount > 0) previousMaxRate = empRankRate;
    }

    if (!currentEmp.parentId) break;
    currentEmp = await Employee.findById(currentEmp.parentId);
    depth++;
  }

  return createdCommissions;
}

module.exports = {
  roundMoney,
  getRankCommissionRate,
  getEmployeeEffectiveRate,
  getTurnoverRate,
  processDifferentialCommission
};
