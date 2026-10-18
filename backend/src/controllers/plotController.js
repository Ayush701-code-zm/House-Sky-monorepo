const Plot = require('../models/Plot');
const PlotDocument = require('../models/PlotDocument');
const Transaction = require('../models/Transaction');
const Employee = require('../models/Employee');
const { processDifferentialCommission } = require('../services/commissionEngine');
const { computePricing, deriveBaseRatePerSqYrd } = require('../services/pricingEngine');
const { queryString, containsRegex } = require('../utils/queryUtils');

const PLOT_STATUSES = ['AVAILABLE', 'BOOKED', 'PENDING', 'SOLD'];

exports.getPlots = async (req, res, next) => {
  try {
    const projectId = queryString(req.query.projectId);
    const block = queryString(req.query.block);
    const status = queryString(req.query.status);
    const search = queryString(req.query.search);
    const page = parseInt(req.query.page) || null;
    const limit = parseInt(req.query.limit) || null;

    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (block) filter.block = block;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { plotNo: containsRegex(search) },
        { block: containsRegex(search) }
      ];
    }

    const total = await Plot.countDocuments(filter);
    // Stable order so skip/limit pages don't overlap or drop plots.
    let query = Plot.find(filter).sort({ _id: 1 }).populate('ownerId', 'fullName email phone');

    if (page && limit) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const plots = await query;

    if (page && limit) {
      return res.json({
        data: plots,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    }

    res.json(plots);
  } catch (error) {
    next(error);
  }
};

exports.getPlotById = async (req, res, next) => {
  try {
    const plot = await Plot.findById(req.params.id)
      .populate('projectId')
      .populate('ownerId', 'fullName email phone');

    if (!plot) return res.status(404).json({ message: 'Plot not found' });

    const documents = await PlotDocument.find({ plotId: plot._id });
    const transactions = await Transaction.find({ plotId: plot._id }).populate('sellerEmployeeId');

    const breakdown = computePricing(plot);

    res.json({
      plot,
      breakdown,
      documents,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePlotStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      ownerName, 
      ownerPhone, 
      ownerEmail, 
      sellerEmployeeId, 
      paymentMode,
      paidAmount,
      registryDate,
      registryStatus,
      paymentMilestones
    } = req.body;

    const plot = await Plot.findById(id);
    if (!plot) return res.status(404).json({ message: 'Plot not found' });

    const prevStatus = plot.status;
    const isAdminOrManager = req.user && ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(req.user.role);

    if (req.body.inventoryOnly && isAdminOrManager) {
      if (!PLOT_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid plot status' });
      }
      plot.status = status;
      if (req.body.sellableSqYrd !== undefined) plot.sellableSqYrd = Number(req.body.sellableSqYrd) || 0;
      if (req.body.sizeSqft !== undefined) plot.sizeSqft = Number(req.body.sizeSqft) || plot.sizeSqft;
      if (req.body.plotNo !== undefined && String(req.body.plotNo).trim()) plot.plotNo = String(req.body.plotNo).trim();
      if (req.body.block !== undefined && String(req.body.block).trim()) plot.block = String(req.body.block).trim();
      if (req.body.dimensions !== undefined) plot.dimensions = req.body.dimensions;
      await plot.save();
      return res.json(plot);
    }

    // Non-admin users may only place a booking/sale request on an AVAILABLE plot.
    // They must never be able to release (AVAILABLE) or overwrite a plot that is
    // already booked/sold — that would wipe the buyer's ownership & payment data.
    if (!isAdminOrManager) {
      if (!['BOOKED', 'SOLD', 'PENDING'].includes(status)) {
        return res.status(403).json({ message: 'Only admins can change this plot to the requested status' });
      }
      if (prevStatus !== 'AVAILABLE') {
        return res.status(409).json({ message: `Plot is already ${prevStatus} and cannot be requested` });
      }
    }

    // Business Logic: If an Agent or Customer requests to purchase/book, set to PENDING (Hold) pending Admin approval!
    let targetStatus = status;
    let targetApprovalStatus = 'APPROVED';

    if (!isAdminOrManager) {
      targetStatus = 'PENDING';
      targetApprovalStatus = 'PENDING_APPROVAL';
    }

    plot.status = targetStatus;
    plot.approvalStatus = targetApprovalStatus;
    if (req.user) plot.requestedByRole = req.user.role;

    if (ownerName !== undefined) plot.ownerName = ownerName;
    if (ownerPhone !== undefined) plot.ownerPhone = ownerPhone;
    if (ownerEmail !== undefined) plot.ownerEmail = ownerEmail;
    if (paidAmount !== undefined) plot.paidAmount = Number(paidAmount) || 0;
    if (registryDate !== undefined) plot.registryDate = registryDate ? new Date(registryDate) : null;
    if (registryStatus !== undefined) plot.registryStatus = registryStatus;
    if (Array.isArray(paymentMilestones)) plot.paymentMilestones = paymentMilestones;
    if (req.body.plotType !== undefined) plot.plotType = req.body.plotType;
    if (req.body.facing !== undefined) plot.facing = req.body.facing;
    if (req.body.dimensions !== undefined) plot.dimensions = req.body.dimensions;
    if (req.body.superBuiltUpSqft !== undefined) plot.superBuiltUpSqft = Number(req.body.superBuiltUpSqft) || 0;

    const totalPlotPrice = plot.totalCost || plot.price || 0;
    plot.dueBalance = Math.max(0, totalPlotPrice - (plot.paidAmount || 0));

    if (targetStatus === 'BOOKED' || targetStatus === 'SOLD') {
      if (!plot.bookingDate) plot.bookingDate = new Date();
    } else if (targetStatus === 'AVAILABLE') {
      plot.ownerName = '';
      plot.ownerPhone = '';
      plot.ownerEmail = '';
      plot.bookingDate = null;
      plot.paidAmount = 0;
      plot.dueBalance = 0;
      plot.registryDate = null;
      plot.registryStatus = 'NOT_REGISTERED';
      plot.paymentMilestones = [];
    }

    await plot.save();

    // If status updated to SOLD and APPROVED, assign ownership & calculate MLM differential commission!
    if (targetStatus === 'SOLD' && targetApprovalStatus === 'APPROVED' && prevStatus !== 'SOLD') {
      let resolvedSellerId = null;

      if (sellerEmployeeId && sellerEmployeeId !== 'DIRECT' && sellerEmployeeId !== 'NONE') {
        resolvedSellerId = sellerEmployeeId;
      } else if (!sellerEmployeeId && req.user) {
        const loggedInEmp = await Employee.findOne({ userId: req.user._id });
        if (loggedInEmp) resolvedSellerId = loggedInEmp._id;
      }

      const existingSale = await Transaction.findOne({
        plotId: plot._id,
        status: 'COMPLETED'
      });

      if (!existingSale) {
        const transaction = await Transaction.create({
          plotId: plot._id,
          buyerName: plot.ownerName || ownerName || 'Customer',
          buyerPhone: plot.ownerPhone || ownerPhone || '',
          buyerEmail: plot.ownerEmail || ownerEmail || '',
          sellerEmployeeId: resolvedSellerId || null,
          amount: plot.totalCost || plot.price || 0,
          paymentMode: paymentMode || 'NET_BANKING',
          status: 'COMPLETED',
          transactionDate: new Date()
        });

        if (resolvedSellerId) {
          await processDifferentialCommission(transaction._id);
        }
      }
    }

    res.json(plot);
  } catch (error) {
    next(error);
  }
};

const MARKER_MIN = 0;
const MARKER_MAX = 100;

function clampPercent(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return Math.min(MARKER_MAX, Math.max(MARKER_MIN, num));
}

exports.updatePlotMarker = async (req, res, next) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) return res.status(404).json({ message: 'Plot not found' });

    const xPercent = clampPercent(req.body.xPercent);
    const yPercent = clampPercent(req.body.yPercent);
    if (xPercent === null || yPercent === null) {
      return res.status(400).json({ message: 'xPercent and yPercent are required (0-100)' });
    }

    plot.marker = { xPercent, yPercent };
    await plot.save();
    res.json(plot);
  } catch (error) {
    next(error);
  }
};

exports.getUserProperties = async (req, res, next) => {
  try {
    // Always scope to the authenticated user — never trust ?email= (IDOR).
    const userEmail = req.user && req.user.email;
    if (!userEmail) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const plots = await Plot.find({ ownerEmail: userEmail }).populate('projectId');
    const transactions = await Transaction.find({ buyerEmail: userEmail })
      .populate('sellerEmployeeId')
      .populate('plotId');

    res.json({
      plots,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

exports.computePricePreview = async (req, res, next) => {
  try {
    const breakdown = computePricing(req.body || {});
    res.json(breakdown);
  } catch (error) {
    next(error);
  }
};

const { uploadToS3 } = require('../services/s3Service');

exports.uploadPlotDocument = async (req, res, next) => {
  try {
    const { plotId } = req.params;
    const { documentType, title } = req.body;
    let fileUrl = req.body.fileUrl;

    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'plot_documents'
      );
      // uploadToS3 returns { url, key } with pre-signed URL
      fileUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult?.url;
    }

    const doc = await PlotDocument.create({
      plotId,
      documentType: documentType || 'AGREEMENT',
      title: title || (req.file ? req.file.originalname : 'Document'),
      fileUrl: fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedBy: req.user ? req.user._id : null
    });

    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
};

exports.exportPlotsCSV = async (req, res, next) => {
  try {
    const projectId = queryString(req.query.projectId);
    const filter = projectId ? { projectId } : {};
    const plots = await Plot.find(filter).sort({ plotNo: 1 });
    const quote = (v) => `"${String(v || '').replace(/"/g, '""')}"`;

    const headers = [
      'S.No', 'Plot No', 'Sellable Sq Yrd', 'Carpet Sq Yrd',
      '12mtr', '9Mtr', 'Corner', 'Park Facing',
      'Total PLC', 'Discounted PLC', 'OTMC',
      'GST on other cahrges', 'Total Cost', 'Status', 'Owner'
    ];

    const rows = plots.map((p, idx) => [
      idx + 1,
      quote(p.plotNo),
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
      quote(p.status || 'AVAILABLE'),
      quote(p.ownerName)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=plot_ledger_report.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

exports.importPlotsCSV = async (req, res, next) => {
  try {
    const { projectId, plotsData } = req.body;
    if (!projectId || !Array.isArray(plotsData)) {
      return res.status(400).json({ message: 'projectId and plotsData array are required' });
    }

    const importedPlots = [];
    for (const item of plotsData) {
      const rawPlotNo = item['Plot No'] || item.plotNo;
      if (rawPlotNo === undefined || rawPlotNo === null || !String(rawPlotNo).trim()) continue;
      const plotNo = String(rawPlotNo).trim();

      const block = plotNo.split('-')[0] || 'E5';
      const sellableSqYrd = parseFloat(item['Sellable Sq Yrd'] || item.sellableSqYrd || 0);
      const carpetSqYrd = parseFloat(item['Carpet Sq Yrd'] || item.carpetSqYrd || 0);
      const plc12mtr = parseFloat(item['12mtr'] || item.plc12mtr || 0) || 0;
      const plc9mtr = parseFloat(item['9Mtr'] || item.plc9mtr || 0) || 0;
      const plcCorner = parseFloat(item['Corner'] || item.plcCorner || 0) || 0;
      const plcParkFacing = parseFloat(item['Park Facing'] || item.plcParkFacing || 0) || 0;
      const discountedPlc = parseFloat(item['Discounted PLC'] || item.discountedPlc || 0);
      const otmc = parseFloat(item['OTMC'] || item.otmc || 0);
      const providedTotalCost = parseFloat(item['Total Cost'] || item.totalCost || item.price || 0);
      const status = String(item['Status'] || item.status || 'AVAILABLE').toUpperCase();
      const ownerName = item['Owner'] || item.ownerName || '';

      const priceInputs = {
        sellableSqYrd, plc12mtr, plc9mtr, plcCorner, plcParkFacing,
        discountedPlc, otmc, totalCost: providedTotalCost
      };
      const baseRatePerSqYrd = deriveBaseRatePerSqYrd(priceInputs);
      const pricing = computePricing({ ...priceInputs, baseRatePerSqYrd });
      const finalTotalCost = baseRatePerSqYrd > 0 ? pricing.totalCost : providedTotalCost;

      const updatedPlot = await Plot.findOneAndUpdate(
        { projectId, plotNo },
        {
          projectId,
          block,
          plotNo,
          sellableSqYrd,
          carpetSqYrd,
          plc12mtr,
          plc9mtr,
          plcCorner,
          plcParkFacing,
          totalPlc: pricing.totalPlc,
          discountedPlc,
          otmc,
          baseRatePerSqYrd,
          gstOnOtherCharges: pricing.gstOnOtherCharges,
          totalCost: finalTotalCost,
          price: finalTotalCost || 0,
          sizeSqft: sellableSqYrd ? sellableSqYrd * 9 : 1800,
          status: ['AVAILABLE', 'BOOKED', 'PENDING', 'SOLD'].includes(status) ? status : 'AVAILABLE',
          ownerName
        },
        { upsert: true, new: true }
      );
      importedPlots.push(updatedPlot);
    }

    res.json({
      message: `Successfully imported ${importedPlots.length} plot records!`,
      importedCount: importedPlots.length,
      plots: importedPlots
    });
  } catch (error) {
    next(error);
  }
};
