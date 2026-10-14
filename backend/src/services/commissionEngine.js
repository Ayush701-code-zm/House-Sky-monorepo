const Employee = require('../models/Employee');
const ProjectSettings = require('../models/ProjectSettings');
const Commission = require('../models/Commission');
const Transaction = require('../models/Transaction');
const Plot = require('../models/Plot');
const { RANK_RULES, isRankQualified, evaluateAndUpgradeRank } = require('./mlmEngine');

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
async function getEmployeeEffectiveRate(employee, projectId = null) {
  const metrics = {
    selfSalesCount: employee.selfSalesCount || 0,
    teamSalesCount: employee.teamSalesCount || 0,
    activeLegsCount: employee.activeLegsCount || 0
  };
  if (!isRankQualified(employee.currentRank, metrics)) return 0;
  return getRankCommissionRate(employee.currentRank, projectId);
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

    if (differentialRate > 0) {
      const commissionAmount = roundMoney((transaction.amount * differentialRate) / 100);

      const commRecord = await Commission.create({
        transactionId: transaction._id,
        plotId: plot._id,
        employeeId: currentEmp._id,
        rankAtSale: currentEmp.currentRank,
        saleAmount: transaction.amount,
        commissionRate: empRankRate,
        differentialRate: differentialRate,
        commissionAmount: commissionAmount,
        levelDepth: depth,
        status: 'CALCULATED',
        calculatedAt: new Date()
      });

      createdCommissions.push(commRecord);
      previousMaxRate = empRankRate;
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
  processDifferentialCommission
};
