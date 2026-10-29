const Employee = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { calculateEmployeeSalesMetrics, evaluateAndUpgradeRank, getDownlineEmployeeIds } = require('../services/mlmEngine');
const { ensureInviteCode, findOrCreateSponsorEmployee, resolveSponsorByInviteCode, publicSponsorPayload, generateEmployeeCode } = require('../utils/agentInvite');

const FULL_ACCESS_ROLES = ['ADMIN', 'DIRECTOR'];
const SENSITIVE_USER_FIELDS = ['password', 'verificationToken', 'verificationTokenExpires', 'resetPasswordToken', 'resetPasswordExpires'];

// Never echo password hashes / auth tokens back in API responses.
function safeUser(user) {
  if (!user) return user;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  SENSITIVE_USER_FIELDS.forEach((field) => delete obj[field]);
  return obj;
}

// Non-admin reviewers (e.g. MANAGER) may only act on their own downline.
async function isInCallerDownline(req, employeeId) {
  if (req.user && FULL_ACCESS_ROLES.includes(req.user.role)) return true;
  const callerEmp = await Employee.findOne({ userId: req.user._id });
  if (!callerEmp) return false;
  const downlines = await getDownlineEmployeeIds(callerEmp._id);
  return downlines.some((id) => id.toString() === employeeId.toString());
}

exports.getEmployees = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user && !['ADMIN', 'DIRECTOR'].includes(req.user.role)) {
      const loggedInEmp = await Employee.findOne({ userId: req.user._id });
      if (!loggedInEmp) {
        return res.json([]);
      }
      const downlines = await getDownlineEmployeeIds(loggedInEmp._id);
      const allowedIds = [loggedInEmp._id, ...downlines];
      filter = { _id: { $in: allowedIds } };
    }

    const employees = await Employee.find(filter)
      .populate('userId', 'fullName email phone role avatar approvalStatus isActive')
      .populate({
        path: 'parentId',
        populate: { path: 'userId', select: 'fullName' }
      })
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, parentId, legNumber, joiningDate, currentRank } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const isAdmin = req.user && ['ADMIN', 'DIRECTOR'].includes(req.user.role);
    const loggedInEmployee = req.user ? await Employee.findOne({ userId: req.user._id }) : null;

    // SECURITY: only an admin may assign a privileged role. Agents can only ever
    // create AGENT accounts, and only attach them directly under themselves.
    const safeRole = isAdmin ? (role || 'AGENT') : 'AGENT';

    let sponsorParentId;
    if (isAdmin) {
      sponsorParentId = parentId || (loggedInEmployee ? loggedInEmployee._id : null);
      if (parentId && !(await Employee.exists({ _id: parentId }))) {
        return res.status(400).json({ message: 'Selected sponsor (parent) agent does not exist' });
      }
    } else {
      if (!loggedInEmployee) {
        return res.status(403).json({ message: 'No employee profile found for your account' });
      }
      sponsorParentId = loggedInEmployee._id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'Password123!', salt);

    // Note: Direct onboarding by an existing agent or admin creates an immediately APPROVED & ACTIVE agent!
    user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      role: safeRole,
      isActive: true,
      approvalStatus: 'APPROVED'
    });

    // Admins may pick the starting rank in the onboarding form; agents cannot.
    const initialRank = isAdmin && Employee.RANKS.includes(currentRank) ? currentRank : 'Business Executive';
    const parsedLeg = parseInt(legNumber, 10);

    let employee;
    try {
      const employeeCode = await generateEmployeeCode();
      employee = await Employee.create({
        userId: user._id,
        employeeCode,
        joiningDate: joiningDate || new Date(),
        currentRank: initialRank,
        parentId: sponsorParentId,
        legNumber: Number.isNaN(parsedLeg) ? 1 : Math.max(1, parsedLeg)
      });
    } catch (empErr) {
      // Roll back the user so a failed onboarding never leaves an orphan login
      // that blocks re-registration with the same email.
      await User.findByIdAndDelete(user._id).catch(() => {});
      throw empErr;
    }

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('userId', 'fullName email phone role avatar approvalStatus isActive')
      .populate({
        path: 'parentId',
        populate: { path: 'userId', select: 'fullName' }
      });

    res.status(201).json({
      message: 'Direct agent onboarding successful!',
      employee: populatedEmployee,
      user: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const { fullName, phone, currentRank, parentId, legNumber } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const isAdmin = req.user && FULL_ACCESS_ROLES.includes(req.user.role);
    if (!isAdmin) {
      // Non-admins may only edit themselves or their downline, and may not
      // change rank / sponsor / leg placement (MLM structure is admin-only).
      const callerEmp = await Employee.findOne({ userId: req.user._id });
      const isSelf = Boolean(callerEmp && callerEmp._id.toString() === employee._id.toString());
      if (!isSelf && !(await isInCallerDownline(req, employee._id))) {
        return res.status(403).json({ message: 'You can only edit yourself or agents in your downline' });
      }
      const currentParent = employee.parentId ? employee.parentId.toString() : '';
      const rankChanged = currentRank && currentRank !== employee.currentRank;
      const parentChanged = parentId !== undefined && String(parentId || '') !== currentParent;
      const legChanged = legNumber !== undefined && parseInt(legNumber, 10) !== (employee.legNumber || 1);
      if (rankChanged || parentChanged || legChanged) {
        return res.status(403).json({ message: 'Only an admin or director can change rank, sponsor or leg placement' });
      }
    }

    if (parentId) {
      // Prevent hierarchy cycles: an agent cannot be placed under itself or
      // under anyone in its own downline.
      if (parentId.toString() === employee._id.toString()) {
        return res.status(400).json({ message: 'An agent cannot be their own sponsor' });
      }
      if (!(await Employee.exists({ _id: parentId }))) {
        return res.status(400).json({ message: 'Selected sponsor (parent) agent does not exist' });
      }
      const downlines = await getDownlineEmployeeIds(employee._id);
      if (downlines.some((id) => id.toString() === parentId.toString())) {
        return res.status(400).json({ message: 'Cannot move an agent under someone in their own downline' });
      }
    }

    if (fullName || phone) {
      await User.findByIdAndUpdate(employee.userId, {
        ...(fullName && { fullName }),
        ...(phone && { phone })
      });
    }

    if (currentRank) employee.currentRank = currentRank;
    if (parentId !== undefined) employee.parentId = parentId || null;
    if (legNumber !== undefined && !Number.isNaN(parseInt(legNumber, 10))) {
      employee.legNumber = Math.max(1, parseInt(legNumber, 10));
    }

    await employee.save();

    const updated = await Employee.findById(employee._id)
      .populate('userId', 'fullName email phone role avatar approvalStatus isActive')
      .populate({
        path: 'parentId',
        populate: { path: 'userId', select: 'fullName' }
      });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Re-attach direct downline to the deleted agent's sponsor so their
    // subtree is not orphaned under a dangling parentId.
    await Employee.updateMany({ parentId: employee._id }, { parentId: employee.parentId || null });

    await User.findByIdAndDelete(employee.userId);
    await Employee.findByIdAndDelete(req.params.id);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'fullName email phone role avatar approvalStatus isActive')
      .populate('parentId');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (req.user && !['ADMIN', 'DIRECTOR'].includes(req.user.role)) {
      const loggedInEmp = await Employee.findOne({ userId: req.user._id });
      if (!loggedInEmp) {
        return res.status(403).json({ message: 'Access denied: No employee profile found' });
      }
      const downlines = await getDownlineEmployeeIds(loggedInEmp._id);
      const allowedIds = [loggedInEmp._id.toString(), ...downlines.map(d => d.toString())];
      if (!allowedIds.includes(employee._id.toString())) {
        return res.status(403).json({ message: 'Access denied: You can only view details of yourself or employees under your hierarchy' });
      }
    }

    const metrics = await calculateEmployeeSalesMetrics(employee._id);

    res.json({
      employee,
      metrics
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployeeRank = async (req, res, next) => {
  try {
    const result = await evaluateAndUpgradeRank(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Approval Actions for Public Agent Applications
exports.approveAgent = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Agent record not found' });
    if (!(await isInCallerDownline(req, employee._id))) {
      return res.status(403).json({ message: 'You can only approve agents in your downline' });
    }

    const user = await User.findById(employee.userId);
    if (!user) return res.status(404).json({ message: 'User record not found' });

    const parentId = req.body?.parentId || employee.parentId;
    if (!parentId) {
      return res.status(400).json({ message: 'Choose a sponsoring agent before approving' });
    }
    if (parentId.toString() === employee._id.toString()) {
      return res.status(400).json({ message: 'An agent cannot be their own sponsor' });
    }
    if (!(await Employee.exists({ _id: parentId }))) {
      return res.status(400).json({ message: 'Selected sponsoring agent does not exist' });
    }
    const downlines = await getDownlineEmployeeIds(employee._id);
    if (downlines.some((id) => id.toString() === parentId.toString())) {
      return res.status(400).json({ message: 'Cannot place an agent under someone in their own downline' });
    }
    employee.parentId = parentId;
    await employee.save();

    user.approvalStatus = 'APPROVED';
    user.isActive = true;
    await user.save();

    res.json({
      message: `🎉 Agent ${user.fullName} (${employee.employeeCode}) has been APPROVED & Activated!`,
      employee,
      user: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyInviteLink = async (req, res, next) => {
  try {
    if (req.user?.isActive === false || req.user?.approvalStatus === 'PENDING_APPROVAL') {
      return res.status(403).json({ message: 'Your account must be approved before you can invite agents' });
    }
    const employee = await findOrCreateSponsorEmployee(req.user);
    if (!employee) {
      return res.status(403).json({ message: 'Your account type cannot invite agents' });
    }
    const inviteCode = await ensureInviteCode(employee);
    res.json({
      inviteCode,
      ...publicSponsorPayload({ ...employee.toObject(), inviteCode })
    });
  } catch (error) {
    next(error);
  }
};

exports.getPublicInvite = async (req, res, next) => {
  try {
    const sponsor = await resolveSponsorByInviteCode(req.params.code);
    if (!sponsor) {
      return res.status(404).json({ message: 'This invite link is invalid or expired' });
    }
    res.json(publicSponsorPayload(sponsor));
  } catch (error) {
    next(error);
  }
};

exports.rejectAgent = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Agent record not found' });
    if (!(await isInCallerDownline(req, employee._id))) {
      return res.status(403).json({ message: 'You can only reject agents in your downline' });
    }

    const user = await User.findById(employee.userId);
    if (!user) return res.status(404).json({ message: 'User record not found' });

    user.approvalStatus = 'REJECTED';
    user.isActive = false;
    await user.save();

    res.json({
      message: `Agent application for ${user.fullName} has been rejected.`,
      employee,
      user: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
};
