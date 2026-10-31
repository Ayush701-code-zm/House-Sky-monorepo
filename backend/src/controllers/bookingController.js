const Booking = require('../models/Booking');
const { LOCKING_STATUSES } = require('../models/Booking');
const Plot = require('../models/Plot');
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SystemSetting = require('../models/SystemSetting');
const { getDownlineEmployeeIds } = require('../services/mlmEngine');
const { notifyAdmins } = require('../services/notificationService');
const { processDifferentialCommission } = require('../services/commissionEngine');
const { containsRegex, queryString } = require('../utils/queryUtils');

const STAFF = ['ADMIN', 'DIRECTOR'];
const POPULATE = [
  { path: 'projectId', select: 'name code location paymentQrUrl bankDetails' },
  { path: 'plotId', select: 'plotNo block status price totalCost sizeSqft superBuiltUpSqft dimensions plotType totalPlc registryStatus facing' },
  { path: 'agentEmployeeId', select: 'employeeCode currentRank bankName bankAccountName bankAccountNumber bankIfsc yearlyTargetPlots yearlyTargetAmount', populate: { path: 'userId', select: 'fullName email phone' } }
];

function isStaff(user) {
  return user && STAFF.includes(user.role);
}

async function callerEmployee(req) {
  if (!req.user) return null;
  return Employee.findOne({ userId: req.user._id });
}

async function allowedEmployeeIds(req) {
  if (isStaff(req.user)) return null;
  const me = await callerEmployee(req);
  if (!me) return [];
  const down = await getDownlineEmployeeIds(me._id);
  return [me._id, ...down];
}

function canTouch(allowed, employeeId) {
  if (allowed === null) return true;
  return allowed.some((id) => id.toString() === String(employeeId));
}

async function loadBooking(id) {
  return Booking.findById(id).populate(POPULATE);
}

function applyCustomerToPlot(plot, booking) {
  plot.ownerName = booking.customerName || '';
  plot.ownerPhone = booking.mobile || '';
  plot.ownerEmail = booking.email || '';
  plot.bookingDate = booking.bookingDate || plot.bookingDate || new Date();
  plot.paidAmount = Number(booking.bookingAmount) || 0;
  const total = plot.totalCost || plot.price || 0;
  plot.dueBalance = Math.max(0, total - plot.paidAmount);
}

async function releasePlot(plot) {
  if (!plot || plot.status === 'SOLD') return;
  plot.status = 'AVAILABLE';
  plot.ownerName = '';
  plot.ownerPhone = '';
  plot.ownerEmail = '';
  plot.bookingDate = null;
  plot.paidAmount = 0;
  plot.dueBalance = 0;
  await plot.save();
}

exports.getHome = async (req, res, next) => {
  try {
    const me = await callerEmployee(req);
    if (!me) return res.status(404).json({ message: 'No agent profile is linked to this login.' });
    const down = await getDownlineEmployeeIds(me._id);
    const user = await User.findById(me.userId).select('fullName email phone');
    const sold = await Booking.countDocuments({
      agentEmployeeId: me._id,
      status: 'CONFIRMED',
    });
    const soldPlots = await Booking.find({ agentEmployeeId: me._id, status: 'CONFIRMED' }).select('plotId');
    const soldIds = soldPlots.map((b) => b.plotId);
    const plotSold = soldIds.length
      ? await Plot.countDocuments({ _id: { $in: soldIds }, status: 'SOLD' })
      : 0;
    const setting = await SystemSetting.findOne({ key: 'COMPANY_INFO' });
    const phone = setting?.jsonValue?.phone || '+91 93112 27789';
    res.json({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      employeeCode: me.employeeCode,
      currentRank: me.currentRank,
      employeeId: me._id,
      executives: down.length,
      plotsSold: plotSold,
      confirmedBookings: sold,
      companyPhone: phone,
      yearlyTargetPlots: me.yearlyTargetPlots || 0,
      yearlyTargetAmount: me.yearlyTargetAmount || 0,
      bankName: me.bankName || '',
      bankAccountName: me.bankAccountName || '',
      bankAccountNumber: me.bankAccountNumber || '',
      bankIfsc: me.bankIfsc || ''
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const me = await callerEmployee(req);
    if (!me) return res.status(404).json({ message: 'No agent profile is linked to this login.' });
    const { fullName, phone } = req.body;
    if (fullName || phone) {
      await User.findByIdAndUpdate(me.userId, {
        ...(fullName && { fullName: String(fullName).trim() }),
        ...(phone && { phone: String(phone).trim() })
      });
    }
    res.json({ message: 'Profile updated.' });
  } catch (error) {
    next(error);
  }
};

exports.updateBank = async (req, res, next) => {
  try {
    const me = await callerEmployee(req);
    if (!me) return res.status(404).json({ message: 'No agent profile is linked to this login.' });
    const { bankName, bankAccountName, bankAccountNumber, bankIfsc } = req.body;
    if (bankName !== undefined) me.bankName = String(bankName);
    if (bankAccountName !== undefined) me.bankAccountName = String(bankAccountName);
    if (bankAccountNumber !== undefined) me.bankAccountNumber = String(bankAccountNumber);
    if (bankIfsc !== undefined) me.bankIfsc = String(bankIfsc).toUpperCase();
    await me.save();
    res.json({
      bankName: me.bankName,
      bankAccountName: me.bankAccountName,
      bankAccountNumber: me.bankAccountNumber,
      bankIfsc: me.bankIfsc
    });
  } catch (error) {
    next(error);
  }
};

exports.updateYearlyTarget = async (req, res, next) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Only an admin can set a yearly target.' });
    const employee = await Employee.findById(req.body.employeeId);
    if (!employee) return res.status(404).json({ message: 'Agent not found.' });
    if (req.body.yearlyTargetPlots !== undefined) employee.yearlyTargetPlots = Number(req.body.yearlyTargetPlots) || 0;
    if (req.body.yearlyTargetAmount !== undefined) employee.yearlyTargetAmount = Number(req.body.yearlyTargetAmount) || 0;
    await employee.save();
    res.json({ yearlyTargetPlots: employee.yearlyTargetPlots, yearlyTargetAmount: employee.yearlyTargetAmount });
  } catch (error) {
    next(error);
  }
};

exports.getYearlyPlan = async (req, res, next) => {
  try {
    const me = await callerEmployee(req);
    if (!me) return res.status(404).json({ message: 'No agent profile is linked to this login.' });
    const start = new Date(new Date().getFullYear(), 0, 1);
    const bookings = await Booking.find({
      agentEmployeeId: me._id,
      status: 'CONFIRMED',
      createdAt: { $gte: start }
    });
    const amount = bookings.reduce((sum, b) => sum + (Number(b.bookingAmount) || 0), 0);
    res.json({
      year: new Date().getFullYear(),
      targetPlots: me.yearlyTargetPlots || 0,
      targetAmount: me.yearlyTargetAmount || 0,
      achievedPlots: bookings.length,
      achievedAmount: amount
    });
  } catch (error) {
    next(error);
  }
};

function dateRange(query) {
  const filter = {};
  const from = queryString(query.from);
  const to = queryString(query.to);
  if (from) {
    const start = new Date(from);
    if (!Number.isNaN(start.getTime())) filter.$gte = start;
  }
  if (to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      filter.$lte = end;
    }
  }
  return Object.keys(filter).length ? filter : null;
}

exports.getTeamSales = async (req, res, next) => {
  try {
    const allowed = await allowedEmployeeIds(req);
    const requested = queryString(req.query.employeeId);
    if (requested && !canTouch(allowed, requested)) {
      return res.status(403).json({ message: 'That executive is outside your team.' });
    }
    const ids = requested ? [requested] : (allowed === null ? null : allowed);
    const filter = { status: { $in: ['CONFIRMED', 'CANCEL_REQUESTED'] } };
    if (ids) filter.agentEmployeeId = { $in: ids };
    const range = dateRange(req.query);
    if (range) filter.bookingDate = range;
    const rows = await Booking.find(filter).populate(POPULATE).sort({ bookingDate: -1 }).limit(200);
    const amount = rows.reduce((sum, b) => sum + (Number(b.bookingAmount) || 0), 0);
    res.json({ totalPlots: rows.length, totalAmount: amount, bookings: rows });
  } catch (error) {
    next(error);
  }
};

exports.listBookings = async (req, res, next) => {
  try {
    const allowed = await allowedEmployeeIds(req);
    const filter = {};
    if (allowed) filter.agentEmployeeId = { $in: allowed };
    const status = queryString(req.query.status);
    const projectId = queryString(req.query.projectId);
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;
    const q = (queryString(req.query.q) || '').trim();
    if (q) {
      const or = [
        { customerName: containsRegex(q) },
        { mobile: containsRegex(q) },
        { phone: containsRegex(q) }
      ];
      const plots = await Plot.find({ plotNo: containsRegex(q) }).select('_id').limit(40);
      if (plots.length) or.push({ plotId: { $in: plots.map((item) => item._id) } });
      const agents = await Employee.find({ employeeCode: containsRegex(q.toUpperCase()) }).select('_id').limit(20);
      if (agents.length) or.push({ agentEmployeeId: { $in: agents.map((item) => item._id) } });
      filter.$or = or;
    }
    const rows = await Booking.find(filter).populate(POPULATE).sort({ createdAt: -1 }).limit(200);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await loadBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    const allowed = await allowedEmployeeIds(req);
    if (!canTouch(allowed, booking.agentEmployeeId?._id || booking.agentEmployeeId)) {
      return res.status(403).json({ message: 'You cannot open this booking.' });
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const me = await callerEmployee(req);
    if (!me) return res.status(403).json({ message: 'Only an agent profile can submit a booking.' });
    const body = req.body || {};
    if (!body.termsAccepted) return res.status(400).json({ message: 'Accept the booking terms before submitting.' });
    if (!body.customerName || !body.mobile) return res.status(400).json({ message: 'Customer name and mobile number are required.' });
    if (!body.plotId || !body.projectId) return res.status(400).json({ message: 'Choose a project and a plot.' });

    const plot = await Plot.findById(body.plotId);
    if (!plot) return res.status(404).json({ message: 'Plot not found.' });
    if (String(plot.projectId) !== String(body.projectId)) {
      return res.status(400).json({ message: 'That plot is not in the selected project.' });
    }
    if (plot.status !== 'AVAILABLE') {
      return res.status(409).json({ message: 'This plot is not available.' });
    }
    const existing = await Booking.findOne({ plotId: plot._id, status: { $in: LOCKING_STATUSES } });
    if (existing) return res.status(409).json({ message: 'This plot already has a booking.' });

    const booking = await Booking.create({
      projectId: body.projectId,
      plotId: plot._id,
      agentEmployeeId: me._id,
      floorNo: body.floorNo || '',
      plotType: body.plotType || plot.plotType || '',
      superBuiltUpSqft: Number(body.superBuiltUpSqft) || plot.superBuiltUpSqft || 0,
      buildUpArea: Number(body.buildUpArea) || plot.sizeSqft || 0,
      dimensions: body.dimensions || plot.dimensions || '',
      bookingAmount: Number(body.bookingAmount) || 0,
      depositPhotoUrl: body.depositPhotoUrl || '',
      bookingDate: body.bookingDate ? new Date(body.bookingDate) : new Date(),
      gender: body.gender || '',
      passportPhotoUrl: body.passportPhotoUrl || '',
      customerName: body.customerName,
      fatherOrHusbandName: body.fatherOrHusbandName || '',
      presentAddress: body.presentAddress || '',
      city: body.city || '',
      pinCode: body.pinCode || '',
      addressProofUrl: body.addressProofUrl || '',
      permanentAddress: body.permanentAddress || '',
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      age: body.age || '',
      mobile: body.mobile,
      phone: body.phone || '',
      email: body.email || '',
      education: body.education || '',
      occupation: body.occupation || '',
      panNumber: body.panNumber || '',
      idNumber: body.idNumber || '',
      idDocUrls: Array.isArray(body.idDocUrls) ? body.idDocUrls.filter(Boolean) : [],
      income: body.income || '',
      futurePlan: body.futurePlan || '',
      nomineeName: body.nomineeName || '',
      nomineeDob: body.nomineeDob ? new Date(body.nomineeDob) : undefined,
      nomineeAddress: body.nomineeAddress || '',
      nomineeRelation: body.nomineeRelation || '',
      nomineePan: body.nomineePan || '',
      nomineeAadhaar: body.nomineeAadhaar || '',
      termsAccepted: true,
      payments: body.depositPhotoUrl ? [{
        amount: Number(body.bookingAmount) || 0,
        note: 'Deposit photo',
        receiptUrl: body.depositPhotoUrl
      }] : []
    });

    plot.status = 'BOOKED';
    plot.approvalStatus = 'APPROVED';
    applyCustomerToPlot(plot, booking);
    try {
      await plot.save();
    } catch (saveError) {
      await Booking.deleteOne({ _id: booking._id });
      throw saveError;
    }

    const project = await Project.findById(plot.projectId).select('name');
    notifyAdmins({
      title: 'New plot booking',
      message: `${body.customerName} — plot ${plot.plotNo}${project ? ` in ${project.name}` : ''}. Waiting for verification.`,
      category: 'BOOKING',
      meta: { bookingId: booking._id, plotId: plot._id }
    });

    res.status(201).json(await loadBooking(booking._id));
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'This plot already has a booking.' });
    }
    next(error);
  }
};

exports.confirmBooking = async (req, res, next) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Only an admin can confirm a booking.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ message: 'Only a pending booking can be confirmed.' });
    }
    booking.status = 'CONFIRMED';
    await booking.save();
    const plot = await Plot.findById(booking.plotId);
    if (plot && plot.status !== 'SOLD' && plot.status !== 'AGREEMENT') {
      plot.status = 'BOOKED';
      applyCustomerToPlot(plot, booking);
      await plot.save();
    }
    res.json(await loadBooking(booking._id));
  } catch (error) {
    next(error);
  }
};

exports.rejectBooking = async (req, res, next) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Only an admin can reject a booking.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (!['PENDING_VERIFICATION', 'CANCEL_REQUESTED'].includes(booking.status)) {
      return res.status(400).json({ message: 'This booking can no longer be rejected.' });
    }
    booking.status = 'REJECTED';
    booking.rejectionReason = req.body.reason || '';
    await booking.save();
    const plot = await Plot.findById(booking.plotId);
    await releasePlot(plot);
    res.json(await loadBooking(booking._id));
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    const allowed = await allowedEmployeeIds(req);
    if (!canTouch(allowed, booking.agentEmployeeId)) {
      return res.status(403).json({ message: 'You cannot cancel this booking.' });
    }
    const plot = await Plot.findById(booking.plotId);
    if (plot && plot.status === 'SOLD') {
      return res.status(400).json({ message: 'A sold plot stays in the ledger. Ask an admin to change it from plot inventory.' });
    }
    booking.cancelReason = req.body.reason || '';
    if (booking.status === 'PENDING_VERIFICATION') {
      booking.status = 'CANCELLED';
      await booking.save();
      await releasePlot(plot);
    } else if (booking.status === 'CONFIRMED' || (plot && plot.status === 'AGREEMENT')) {
      booking.status = 'CANCEL_REQUESTED';
      await booking.save();
      notifyAdmins({
        title: 'Cancellation requested',
        message: `${booking.customerName} asked to cancel a confirmed booking.`,
        category: 'BOOKING',
        meta: { bookingId: booking._id }
      });
    } else {
      return res.status(400).json({ message: 'This booking cannot be cancelled.' });
    }
    res.json(await loadBooking(booking._id));
  } catch (error) {
    next(error);
  }
};

exports.acceptCancel = async (req, res, next) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Only an admin can accept a cancellation.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status !== 'CANCEL_REQUESTED') {
      return res.status(400).json({ message: 'There is no cancellation waiting on this booking.' });
    }
    const plot = await Plot.findById(booking.plotId);
    if (plot && plot.status === 'SOLD') {
      return res.status(400).json({ message: 'A sold plot stays in the ledger. Change it from plot inventory.' });
    }
    booking.status = 'CANCELLED';
    await booking.save();
    await releasePlot(plot);
    res.json(await loadBooking(booking._id));
  } catch (error) {
    next(error);
  }
};

exports.markAgreement = async (req, res, next) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Only an admin can mark an agreement.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Confirm the booking before marking an agreement.' });
    }
    const plot = await Plot.findById(booking.plotId);
    if (!plot) return res.status(404).json({ message: 'Plot not found.' });
    if (plot.status === 'SOLD') return res.status(400).json({ message: 'This plot is already sold.' });
    plot.status = 'AGREEMENT';
    applyCustomerToPlot(plot, booking);
    await plot.save();
    res.json(await loadBooking(booking._id));
  } catch (error) {
    next(error);
  }
};

exports.markSold = async (req, res, next) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Only an admin can mark a plot sold.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Confirm the booking before marking it sold.' });
    }
    const plot = await Plot.findById(booking.plotId);
    if (!plot) return res.status(404).json({ message: 'Plot not found.' });
    const prev = plot.status;
    plot.status = 'SOLD';
    plot.approvalStatus = 'APPROVED';
    applyCustomerToPlot(plot, booking);
    await plot.save();

    if (prev !== 'SOLD') {
      const existingSale = await Transaction.findOne({ plotId: plot._id, status: 'COMPLETED' });
      if (!existingSale) {
        const transaction = await Transaction.create({
          plotId: plot._id,
          buyerName: booking.customerName || 'Customer',
          buyerPhone: booking.mobile || '',
          buyerEmail: booking.email || '',
          sellerEmployeeId: booking.agentEmployeeId,
          amount: plot.totalCost || plot.price || booking.bookingAmount || 0,
          paymentMode: 'NET_BANKING',
          status: 'COMPLETED',
          transactionDate: new Date()
        });
        await processDifferentialCommission(transaction._id);
      }
    }
    res.json(await loadBooking(booking._id));
  } catch (error) {
    next(error);
  }
};

exports.addDocument = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    const allowed = await allowedEmployeeIds(req);
    if (!canTouch(allowed, booking.agentEmployeeId)) {
      return res.status(403).json({ message: 'You cannot add a file to this booking.' });
    }
    if (!req.body.url) return res.status(400).json({ message: 'Upload the file first.' });
    booking.extraDocs.push({ title: req.body.title || 'Customer document', url: req.body.url });
    await booking.save();
    res.json(await loadBooking(booking._id));
  } catch (error) {
    next(error);
  }
};

exports.report = async (req, res, next) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Only an admin can open sales reports.' });
    const match = { status: { $in: ['CONFIRMED', 'CANCEL_REQUESTED'] } };
    const range = dateRange(req.query);
    if (range) match.bookingDate = range;
    const byProject = queryString(req.query.group) === 'project';
    const group = byProject ? '$projectId' : '$agentEmployeeId';
    const rows = await Booking.aggregate([
      { $match: match },
      { $group: { _id: group, bookings: { $sum: 1 }, amount: { $sum: '$bookingAmount' } } },
      { $sort: { amount: -1 } },
      { $limit: 50 }
    ]);
    const ids = rows.map((row) => row._id).filter(Boolean);
    const labels = new Map();
    if (byProject) {
      const projects = await Project.find({ _id: { $in: ids } }).select('name');
      projects.forEach((item) => labels.set(String(item._id), item.name));
    } else {
      const employees = await Employee.find({ _id: { $in: ids } }).select('employeeCode userId').populate('userId', 'fullName');
      employees.forEach((item) => labels.set(String(item._id), `${item.userId?.fullName || 'Agent'} (${item.employeeCode})`));
    }
    res.json(rows.map((row) => ({
      ...row,
      label: labels.get(String(row._id)) || (byProject ? 'Unknown project' : 'Unknown agent')
    })));
  } catch (error) {
    next(error);
  }
};
