const Payout = require('../models/Payout');
const Commission = require('../models/Commission');
const AgentKyc = require('../models/AgentKyc');
const { sendNotification } = require('../services/notificationService');
const Employee = require('../models/Employee');
const { getDownlineEmployeeIds } = require('../services/mlmEngine');

const KYC_APPROVED = 'APPROVED';
const KYC_REQUIRED_MESSAGE = 'KYC must be approved by a manager or admin before requesting a payout. Complete KYC first.';

exports.getPayouts = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user && !['ADMIN', 'DIRECTOR'].includes(req.user.role)) {
      const loggedInEmp = await Employee.findOne({ userId: req.user._id });
      if (!loggedInEmp) {
        return res.json([]);
      }
      const downlines = await getDownlineEmployeeIds(loggedInEmp._id);
      const allowedIds = [loggedInEmp._id, ...downlines];
      filter = { employeeId: { $in: allowedIds } };
    }

    const payouts = await Payout.find(filter)
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'fullName email phone' }
      })
      .sort({ createdAt: -1 });

    res.json(payouts);
  } catch (error) {
    next(error);
  }
};

exports.requestPayout = async (req, res, next) => {
  try {
    const { employeeId: bodyEmployeeId } = req.body;

    const isAdmin = req.user && ['ADMIN', 'DIRECTOR'].includes(req.user.role);

    // SECURITY: agents can only request a payout for THEMSELVES. Admins may
    // request on behalf of any employee.
    let employeeId = bodyEmployeeId;
    if (!isAdmin) {
      const loggedInEmp = await Employee.findOne({ userId: req.user._id });
      if (!loggedInEmp) {
        return res.status(403).json({ message: 'No employee profile found for your account' });
      }
      employeeId = loggedInEmp._id;
    }
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required' });
    }

    const approvedKyc = await AgentKyc.findOne({ employeeId, status: KYC_APPROVED });
    if (!approvedKyc) {
      return res.status(400).json({ message: KYC_REQUIRED_MESSAGE });
    }

    const bankDetails = {
      accountNumber: approvedKyc.accountNumber,
      ifscCode: approvedKyc.ifscCode,
      bankName: approvedKyc.bankName,
      branchName: approvedKyc.branchName,
      accountHolderName: approvedKyc.accountHolderName
    };

    // Commissions already reserved by an open (not yet completed) payout must
    // not be requested again, otherwise the same commission is paid twice.
    const openPayouts = await Payout.find({
      employeeId,
      status: { $in: ['PENDING', 'PROCESSING'] }
    }).select('commissionIds');
    if (openPayouts.some((p) => !p.commissionIds || p.commissionIds.length === 0)) {
      // Legacy open payout settles ALL outstanding commissions on approval.
      return res.status(400).json({ message: 'A payout request is already pending for this agent' });
    }
    const reservedIds = openPayouts.flatMap((p) => p.commissionIds);

    // Settle exactly the employee's outstanding (unpaid) commissions. The payout
    // amount is derived from those records, never trusted from the request body.
    const outstanding = await Commission.find({
      employeeId,
      status: { $in: ['CALCULATED', 'APPROVED'] },
      _id: { $nin: reservedIds }
    }).select('_id commissionAmount');

    if (outstanding.length === 0) {
      return res.status(400).json({ message: 'No outstanding commissions available for payout' });
    }

    const amount = Math.round(
      outstanding.reduce((sum, c) => sum + (c.commissionAmount || 0), 0) * 100
    ) / 100;
    const commissionIds = outstanding.map((c) => c._id);

    // Collision-resistant reference (countDocuments could race concurrent requests).
    const referenceNo = `PAY-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    const payout = await Payout.create({
      employeeId,
      amount,
      referenceNo,
      bankDetails,
      commissionIds,
      status: 'PENDING'
    });

    res.status(201).json(payout);
  } catch (error) {
    next(error);
  }
};

exports.approvePayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payout = await Payout.findById(id).populate('employeeId');

    if (!payout) return res.status(404).json({ message: 'Payout not found' });

    if (payout.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Payout already completed' });
    }

    // SECURITY: no one may approve their own payout (segregation of duties).
    const approverEmp = req.user ? await Employee.findOne({ userId: req.user._id }) : null;
    if (approverEmp && payout.employeeId && approverEmp._id.toString() === payout.employeeId._id.toString()) {
      return res.status(403).json({ message: 'You cannot approve your own payout' });
    }

    payout.status = 'COMPLETED';
    payout.approvedBy = req.user ? req.user._id : null;
    await payout.save();

    // Mark ONLY the commissions this payout was created to settle as PAID, so
    // payout totals stay reconciled with commission records. Falls back to the
    // legacy behaviour for older payouts that predate commission linking.
    if (payout.commissionIds && payout.commissionIds.length > 0) {
      await Commission.updateMany(
        { _id: { $in: payout.commissionIds }, status: { $in: ['CALCULATED', 'APPROVED'] } },
        { status: 'PAID' }
      );
    } else if (payout.employeeId) {
      await Commission.updateMany(
        { employeeId: payout.employeeId._id, status: { $in: ['CALCULATED', 'APPROVED'] } },
        { status: 'PAID' }
      );
    }

    // Send multi-channel notification (Email + WhatsApp + In-App)
    if (payout.employeeId && payout.employeeId.userId) {
      const msg = `Congratulations! Your payout of ₹${payout.amount.toLocaleString()} (Ref: ${payout.referenceNo}) has been approved and processed.`;
      try {
        await sendNotification({
          userId: payout.employeeId.userId,
          title: 'Payout Disbursement Successful',
          message: msg,
          channel: 'WHATSAPP'
        });
        await sendNotification({
          userId: payout.employeeId.userId,
          title: 'Payout Disbursement Successful',
          message: msg,
          channel: 'IN_APP'
        });
      } catch (notifyErr) {
        // Payout is already completed — a notification failure must not 500.
        console.error('[Payout] notification failed:', notifyErr.message);
      }
    }

    res.json({ message: 'Payout approved and completed', payout });
  } catch (error) {
    next(error);
  }
};
