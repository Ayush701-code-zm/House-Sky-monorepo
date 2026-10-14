const Commission = require('../models/Commission');
const Transaction = require('../models/Transaction');
const Employee = require('../models/Employee');
const Payout = require('../models/Payout');
const Plot = require('../models/Plot');
const Report = require('../models/Report');

/** Escape a value for a CSV cell. */
function csvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers, rows) {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(','));
  }
  return lines.join('\n');
}

async function sendCsv(res, req, { reportType, title, filename, headers, rows, filters }) {
  // Record the generation for auditability (best-effort, never blocks the download).
  try {
    await Report.create({
      title,
      reportType,
      filters: filters || {},
      generatedBy: req.user ? req.user._id : null
    });
  } catch (e) {
    // ignore audit write failure
  }

  const csv = toCsv(headers, rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.status(200).send('﻿' + csv); // BOM so Excel reads UTF-8
}

const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/** Differential commission audit trail — the full upline payout breakdown. */
exports.commissionAuditReport = async (req, res, next) => {
  try {
    const commissions = await Commission.find()
      .populate({ path: 'employeeId', populate: { path: 'userId', select: 'fullName' } })
      .populate('plotId', 'plotNo')
      .sort({ createdAt: -1 });

    const headers = [
      'S.No', 'Date', 'Employee', 'Rank At Sale', 'Plot No', 'Sale Amount',
      'Commission Rate %', 'Differential %', 'Commission Amount', 'Level Depth', 'Status'
    ];
    const rows = commissions.map((c, i) => [
      i + 1,
      fmtDate(c.calculatedAt || c.createdAt),
      c.employeeId && c.employeeId.userId ? c.employeeId.userId.fullName : (c.employeeId ? c.employeeId.employeeCode : ''),
      c.rankAtSale,
      c.plotId ? c.plotId.plotNo : '',
      c.saleAmount,
      c.commissionRate,
      c.differentialRate,
      c.commissionAmount,
      c.levelDepth,
      c.status
    ]);

    await sendCsv(res, req, {
      reportType: 'COMMISSION',
      title: 'Differential Commission Audit',
      filename: `commission_audit_${fmtDate(Date.now())}.csv`,
      headers, rows
    });
  } catch (error) {
    next(error);
  }
};

/** Revenue & sales — every completed sale transaction. */
exports.revenueReport = async (req, res, next) => {
  try {
    const txns = await Transaction.find({ status: 'COMPLETED' })
      .populate({ path: 'plotId', select: 'plotNo projectId', populate: { path: 'projectId', select: 'name code' } })
      .populate({ path: 'sellerEmployeeId', populate: { path: 'userId', select: 'fullName' } })
      .sort({ transactionDate: -1 });

    const headers = ['S.No', 'Date', 'Project', 'Plot No', 'Buyer', 'Seller', 'Amount', 'Payment Mode'];
    const rows = txns.map((t, i) => [
      i + 1,
      fmtDate(t.transactionDate || t.createdAt),
      t.plotId && t.plotId.projectId ? t.plotId.projectId.name : '',
      t.plotId ? t.plotId.plotNo : '',
      t.buyerName || '',
      t.sellerEmployeeId && t.sellerEmployeeId.userId ? t.sellerEmployeeId.userId.fullName : '',
      t.amount,
      t.paymentMode || ''
    ]);

    await sendCsv(res, req, {
      reportType: 'REVENUE',
      title: 'Revenue & Sales Report',
      filename: `revenue_report_${fmtDate(Date.now())}.csv`,
      headers, rows
    });
  } catch (error) {
    next(error);
  }
};

/** MLM downline performance — every agent's rank & sales metrics. */
exports.mlmPerformanceReport = async (req, res, next) => {
  try {
    const employees = await Employee.find()
      .populate('userId', 'fullName email phone')
      .populate({ path: 'parentId', populate: { path: 'userId', select: 'fullName' } })
      .sort({ selfSalesCount: -1 });

    const headers = ['S.No', 'Code', 'Name', 'Email', 'Rank', 'Self Sales', 'Team Sales', 'Active Legs', 'Sponsor'];
    const rows = employees.map((e, i) => [
      i + 1,
      e.employeeCode,
      e.userId ? e.userId.fullName : '',
      e.userId ? e.userId.email : '',
      e.currentRank,
      e.selfSalesCount || 0,
      e.teamSalesCount || 0,
      e.activeLegsCount || 0,
      e.parentId && e.parentId.userId ? e.parentId.userId.fullName : '—'
    ]);

    await sendCsv(res, req, {
      reportType: 'MLM_HIERARCHY',
      title: 'MLM Downline Performance',
      filename: `mlm_performance_${fmtDate(Date.now())}.csv`,
      headers, rows
    });
  } catch (error) {
    next(error);
  }
};

/** Payout disbursement log — every requested/approved payout. */
exports.payoutSummaryReport = async (req, res, next) => {
  try {
    const payouts = await Payout.find()
      .populate({ path: 'employeeId', populate: { path: 'userId', select: 'fullName' } })
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 });

    const headers = ['S.No', 'Reference', 'Date', 'Employee', 'Amount', 'Status', 'Approved By', 'Commissions Settled'];
    const rows = payouts.map((p, i) => [
      i + 1,
      p.referenceNo,
      fmtDate(p.payoutDate || p.createdAt),
      p.employeeId && p.employeeId.userId ? p.employeeId.userId.fullName : '',
      p.amount,
      p.status,
      p.approvedBy ? p.approvedBy.fullName : '',
      p.commissionIds ? p.commissionIds.length : 0
    ]);

    await sendCsv(res, req, {
      reportType: 'PAYOUT_SUMMARY',
      title: 'Payout Disbursement Log',
      filename: `payout_summary_${fmtDate(Date.now())}.csv`,
      headers, rows
    });
  } catch (error) {
    next(error);
  }
};

/** Plot inventory ledger — the client 15-column pricing format. */
exports.plotLedgerReport = async (req, res, next) => {
  try {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const filter = projectId ? { projectId } : {};
    const plots = await Plot.find(filter).sort({ plotNo: 1 });

    const headers = [
      'S.No', 'Plot No', 'Sellable Sq Yrd', 'Carpet Sq Yrd', '12mtr', '9Mtr', 'Corner',
      'Park Facing', 'Total PLC', 'Discounted PLC', 'OTMC', 'GST on other charges',
      'Total Cost', 'Status', 'Owner'
    ];
    const rows = plots.map((p, i) => [
      i + 1,
      p.plotNo || '',
      p.sellableSqYrd || 0,
      p.carpetSqYrd || 0,
      p.plc12mtr || '-',
      p.plc9mtr || '-',
      p.plcCorner || '-',
      p.plcParkFacing || '-',
      p.totalPlc || 0,
      p.discountedPlc || 0,
      p.otmc || 0,
      p.gstOnOtherCharges || 0,
      p.totalCost || p.price || 0,
      p.status || 'AVAILABLE',
      p.ownerName || ''
    ]);

    await sendCsv(res, req, {
      reportType: 'PLOT_SALES',
      title: 'Plot Inventory Ledger',
      filename: `plot_ledger_${fmtDate(Date.now())}.csv`,
      headers, rows, filters: { projectId }
    });
  } catch (error) {
    next(error);
  }
};
