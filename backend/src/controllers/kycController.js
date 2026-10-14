const AgentKyc = require('../models/AgentKyc');
const Employee = require('../models/Employee');
const { getDownlineEmployeeIds } = require('../services/mlmEngine');
const { sendNotification } = require('../services/notificationService');
const { getPresignedUrl } = require('../services/s3Service');

const STATUS_DRAFT = 'DRAFT';
const STATUS_SUBMITTED = 'SUBMITTED';
const STATUS_APPROVED = 'APPROVED';
const STATUS_REJECTED = 'REJECTED';
const REVIEWER_ROLES = ['ADMIN', 'DIRECTOR', 'MANAGER'];
const FULL_ACCESS_ROLES = ['ADMIN', 'DIRECTOR'];
const EDITABLE_STATUSES = [STATUS_DRAFT, STATUS_REJECTED];
const UNIQUE_CHECK_STATUSES = [STATUS_SUBMITTED, STATUS_APPROVED];

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_PATTERN = /^[0-9]{12}$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_PATTERN = /^[0-9]{9,18}$/;
const MOBILE_PATTERN = /^[0-9]{10}$/;

const REQUIRED_ON_SUBMIT = [
  'firstName',
  'surname',
  'dateOfBirth',
  'address',
  'mobile',
  'panNumber',
  'aadhaarNumber',
  'accountHolderName',
  'accountNumber',
  'ifscCode',
  'bankName',
  'branchName',
  'panDocUrl',
  'aadhaarDocUrl'
];

const EDITABLE_FIELDS = [
  'firstName',
  'middleName',
  'surname',
  'dateOfBirth',
  'address',
  'mobile',
  'alternatePhone',
  'email',
  'panNumber',
  'aadhaarNumber',
  'accountHolderName',
  'accountNumber',
  'ifscCode',
  'bankName',
  'branchName',
  'nomineeName',
  'nomineeDob',
  'nomineeAddress',
  'nomineeRelation',
  'panDocUrl',
  'panDocS3Key',
  'aadhaarDocUrl',
  'aadhaarDocS3Key'
];

const DATE_FIELDS = ['dateOfBirth', 'nomineeDob'];

function splitFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', middleName: '', surname: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', surname: '' };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', surname: parts[1] };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    surname: parts[parts.length - 1]
  };
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizePan(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

function normalizeIfsc(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

function parseOptionalDate(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function joiningUnderPayload(employee) {
  const parent = employee && employee.parentId;
  if (!parent || typeof parent !== 'object') {
    return { employeeCode: '', name: 'Root / Company' };
  }
  return {
    employeeCode: parent.employeeCode || '',
    name: parent.userId && parent.userId.fullName ? parent.userId.fullName : parent.employeeCode
  };
}

function emptyKycFromUser(user) {
  const names = splitFullName(user && user.fullName);
  return {
    firstName: names.firstName,
    middleName: names.middleName,
    surname: names.surname,
    dateOfBirth: null,
    address: '',
    mobile: digitsOnly(user && user.phone),
    alternatePhone: '',
    email: (user && user.email) || '',
    panNumber: '',
    aadhaarNumber: '',
    accountHolderName: (user && user.fullName) || '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    nomineeName: '',
    nomineeDob: null,
    nomineeAddress: '',
    nomineeRelation: '',
    panDocUrl: '',
    panDocS3Key: '',
    aadhaarDocUrl: '',
    aadhaarDocS3Key: '',
    status: STATUS_DRAFT,
    rejectionReason: ''
  };
}

function applyNormalizedFields(target, source) {
  EDITABLE_FIELDS.forEach((field) => {
    if (source[field] === undefined) return;
    if (DATE_FIELDS.includes(field)) {
      target[field] = parseOptionalDate(source[field]);
      return;
    }
    target[field] = source[field];
  });

  target.panNumber = normalizePan(target.panNumber);
  target.ifscCode = normalizeIfsc(target.ifscCode);
  target.aadhaarNumber = digitsOnly(target.aadhaarNumber);
  target.accountNumber = digitsOnly(target.accountNumber);
  target.mobile = digitsOnly(target.mobile);
  target.alternatePhone = digitsOnly(target.alternatePhone);
  target.email = String(target.email || '').trim().toLowerCase();
}

function validateForSubmit(kyc) {
  const errors = {};

  REQUIRED_ON_SUBMIT.forEach((field) => {
    const value = kyc[field];
    const missing = value === undefined || value === null || String(value).trim() === '';
    if (missing) {
      errors[field] = `${field} is required to submit KYC`;
    }
  });

  if (kyc.panNumber && !PAN_PATTERN.test(kyc.panNumber)) {
    errors.panNumber = 'PAN must be in format ABCDE1234F';
  }
  if (kyc.aadhaarNumber && !AADHAAR_PATTERN.test(kyc.aadhaarNumber)) {
    errors.aadhaarNumber = 'Aadhaar must be 12 digits';
  }
  if (kyc.ifscCode && !IFSC_PATTERN.test(kyc.ifscCode)) {
    errors.ifscCode = 'IFSC must be in format HDFC0001234';
  }
  if (kyc.accountNumber && !ACCOUNT_PATTERN.test(kyc.accountNumber)) {
    errors.accountNumber = 'Account number must be 9 to 18 digits';
  }
  if (kyc.mobile && !MOBILE_PATTERN.test(kyc.mobile)) {
    errors.mobile = 'Mobile number must be 10 digits';
  }
  if (kyc.alternatePhone && kyc.alternatePhone.length > 0 && !MOBILE_PATTERN.test(kyc.alternatePhone)) {
    errors.alternatePhone = 'Alternate number must be 10 digits';
  }

  return errors;
}

async function loadEmployeeForUser(userId) {
  return Employee.findOne({ userId }).populate({
    path: 'parentId',
    populate: { path: 'userId', select: 'fullName' }
  });
}

function kycEmployeeObjectId(kyc) {
  if (!kyc || !kyc.employeeId) return null;
  return kyc.employeeId._id ? kyc.employeeId._id : kyc.employeeId;
}

async function canReviewEmployee(req, employeeId) {
  if (!req.user || !REVIEWER_ROLES.includes(req.user.role)) return false;
  if (FULL_ACCESS_ROLES.includes(req.user.role)) return true;

  const managerEmp = await Employee.findOne({ userId: req.user._id });
  if (!managerEmp) return false;
  if (managerEmp._id.toString() === employeeId.toString()) return true;

  const downlines = await getDownlineEmployeeIds(managerEmp._id);
  return downlines.some((id) => id.toString() === employeeId.toString());
}

async function reviewerListFilter(req) {
  if (FULL_ACCESS_ROLES.includes(req.user.role)) return {};

  const managerEmp = await Employee.findOne({ userId: req.user._id });
  if (!managerEmp) {
    return { employeeId: { $in: [] } };
  }
  const downlines = await getDownlineEmployeeIds(managerEmp._id);
  return { employeeId: { $in: [managerEmp._id, ...downlines] } };
}

/**
 * Uploaded PAN/Aadhaar URLs are pre-signed and expire after 7 days, so a
 * stored URL is dead by the time a reviewer opens an older KYC. Re-sign from
 * the stored S3 key whenever a KYC record is returned.
 */
async function hydrateKycDocs(kyc) {
  if (!kyc || typeof kyc.toJSON !== 'function') return kyc;
  const obj = kyc.toJSON();
  if (obj.panDocS3Key) {
    const fresh = await getPresignedUrl(obj.panDocS3Key);
    if (fresh) obj.panDocUrl = fresh;
  }
  if (obj.aadhaarDocS3Key) {
    const fresh = await getPresignedUrl(obj.aadhaarDocS3Key);
    if (fresh) obj.aadhaarDocUrl = fresh;
  }
  return obj;
}

async function notifySafely(payload) {
  try {
    await sendNotification(payload);
  } catch (err) {
    // The KYC decision is already saved — never fail the request over a notification.
    console.error('[KYC] notification failed:', err.message);
  }
}

function populateKycQuery(query) {
  return query
    .populate({
      path: 'employeeId',
      populate: { path: 'userId', select: 'fullName email phone role' }
    })
    .populate('reviewedBy', 'fullName email');
}

exports.getMyKyc = async (req, res, next) => {
  try {
    const employee = await loadEmployeeForUser(req.user._id);
    if (!employee) {
      return res.status(403).json({ message: 'No employee profile found for your account' });
    }

    const existing = await AgentKyc.findOne({ employeeId: employee._id });
    const kyc = existing ? await hydrateKycDocs(existing) : emptyKycFromUser(req.user);
    const status = existing ? existing.status : STATUS_DRAFT;

    res.json({
      kyc,
      canEdit: EDITABLE_STATUSES.includes(status),
      payoutEligible: status === STATUS_APPROVED,
      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        currentRank: employee.currentRank
      },
      joiningUnder: joiningUnderPayload(employee)
    });
  } catch (error) {
    next(error);
  }
};

exports.saveMyKyc = async (req, res, next) => {
  try {
    const employee = await loadEmployeeForUser(req.user._id);
    if (!employee) {
      return res.status(403).json({ message: 'No employee profile found for your account' });
    }

    const shouldSubmit = Boolean(req.body && req.body.submit);
    let kyc = await AgentKyc.findOne({ employeeId: employee._id });

    if (!kyc) {
      kyc = new AgentKyc({ employeeId: employee._id, status: STATUS_DRAFT });
      applyNormalizedFields(kyc, emptyKycFromUser(req.user));
    }

    if (!EDITABLE_STATUSES.includes(kyc.status)) {
      return res.status(400).json({
        message: kyc.status === STATUS_APPROVED
          ? 'Approved KYC cannot be edited. Ask a manager if details need to change.'
          : 'KYC is already submitted and waiting for manager/admin approval.'
      });
    }

    applyNormalizedFields(kyc, req.body || {});

    if (shouldSubmit) {
      const errors = validateForSubmit(kyc);
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: 'Please complete all required KYC fields', errors });
      }

      const panClash = await AgentKyc.findOne({
        panNumber: kyc.panNumber,
        _id: { $ne: kyc._id },
        status: { $in: UNIQUE_CHECK_STATUSES }
      });
      if (panClash) {
        return res.status(400).json({ message: 'This PAN is already used on another submitted KYC' });
      }

      const aadhaarClash = await AgentKyc.findOne({
        aadhaarNumber: kyc.aadhaarNumber,
        _id: { $ne: kyc._id },
        status: { $in: UNIQUE_CHECK_STATUSES }
      });
      if (aadhaarClash) {
        return res.status(400).json({ message: 'This Aadhaar is already used on another submitted KYC' });
      }

      kyc.status = STATUS_SUBMITTED;
      kyc.submittedAt = new Date();
      kyc.rejectionReason = '';
      kyc.reviewedBy = null;
      kyc.reviewedAt = null;
    } else {
      kyc.status = STATUS_DRAFT;
    }

    await kyc.save();

    res.json({
      kyc: await hydrateKycDocs(kyc),
      canEdit: EDITABLE_STATUSES.includes(kyc.status),
      payoutEligible: kyc.status === STATUS_APPROVED,
      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        currentRank: employee.currentRank
      },
      joiningUnder: joiningUnderPayload(employee)
    });
  } catch (error) {
    next(error);
  }
};

exports.listKyc = async (req, res, next) => {
  try {
    const filter = await reviewerListFilter(req);
    const status = req.query.status;
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (req.query.employeeId) {
      const requestedId = req.query.employeeId;
      const allowed = await canReviewEmployee(req, requestedId);
      if (!allowed) {
        return res.status(403).json({ message: 'You cannot view this agent KYC' });
      }
      filter.employeeId = requestedId;
    }

    const records = await populateKycQuery(AgentKyc.find(filter)).sort({ submittedAt: -1, updatedAt: -1 });
    res.json(await Promise.all(records.map(hydrateKycDocs)));
  } catch (error) {
    next(error);
  }
};

exports.getKycById = async (req, res, next) => {
  try {
    const kyc = await populateKycQuery(AgentKyc.findById(req.params.id));
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    const employeeId = kycEmployeeObjectId(kyc);
    const allowed = await canReviewEmployee(req, employeeId);
    if (!allowed) {
      return res.status(403).json({ message: 'You can only review KYC for your downline' });
    }

    res.json(await hydrateKycDocs(kyc));
  } catch (error) {
    next(error);
  }
};

exports.getKycByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const loggedInEmp = await Employee.findOne({ userId: req.user._id });
    const isSelf = Boolean(loggedInEmp && loggedInEmp._id.toString() === String(employeeId));

    if (!isSelf) {
      const allowed = await canReviewEmployee(req, employeeId);
      if (!allowed) {
        return res.status(403).json({ message: 'You cannot view this agent KYC' });
      }
    }

    const kyc = await populateKycQuery(AgentKyc.findOne({ employeeId }));
    if (!kyc) {
      return res.json({
        kyc: null,
        payoutEligible: false,
        canEdit: isSelf,
        message: 'KYC has not been submitted yet'
      });
    }

    res.json({
      kyc: await hydrateKycDocs(kyc),
      payoutEligible: kyc.status === STATUS_APPROVED,
      canEdit: isSelf && EDITABLE_STATUSES.includes(kyc.status)
    });
  } catch (error) {
    next(error);
  }
};

exports.approveKyc = async (req, res, next) => {
  try {
    const kyc = await populateKycQuery(AgentKyc.findById(req.params.id));
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }
    if (kyc.status === STATUS_APPROVED) {
      return res.status(400).json({ message: 'KYC is already approved' });
    }
    if (kyc.status !== STATUS_SUBMITTED) {
      return res.status(400).json({ message: 'Only submitted KYC can be approved' });
    }

    const employeeId = kycEmployeeObjectId(kyc);
    const allowed = await canReviewEmployee(req, employeeId);
    if (!allowed) {
      return res.status(403).json({ message: 'You can only approve KYC for your downline' });
    }

    const reviewerEmp = await Employee.findOne({ userId: req.user._id });
    if (reviewerEmp && reviewerEmp._id.toString() === employeeId.toString()) {
      return res.status(403).json({ message: 'You cannot approve your own KYC' });
    }

    kyc.status = STATUS_APPROVED;
    kyc.reviewedBy = req.user._id;
    kyc.reviewedAt = new Date();
    kyc.rejectionReason = '';
    await kyc.save();

    const agentUserId = kyc.employeeId && kyc.employeeId.userId
      ? kyc.employeeId.userId._id || kyc.employeeId.userId
      : null;
    if (agentUserId) {
      await notifySafely({
        userId: agentUserId,
        title: 'KYC Approved',
        message: 'Your KYC is approved. You can now request commission payouts.',
        channel: 'IN_APP'
      });
    }

    res.json({ message: 'KYC approved. Agent can now request payouts.', kyc });
  } catch (error) {
    next(error);
  }
};

exports.rejectKyc = async (req, res, next) => {
  try {
    const reason = String((req.body && req.body.reason) || '').trim();
    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const kyc = await populateKycQuery(AgentKyc.findById(req.params.id));
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }
    if (kyc.status !== STATUS_SUBMITTED) {
      return res.status(400).json({ message: 'Only submitted KYC can be rejected' });
    }

    const employeeId = kycEmployeeObjectId(kyc);
    const allowed = await canReviewEmployee(req, employeeId);
    if (!allowed) {
      return res.status(403).json({ message: 'You can only reject KYC for your downline' });
    }

    const reviewerEmp = await Employee.findOne({ userId: req.user._id });
    if (reviewerEmp && reviewerEmp._id.toString() === employeeId.toString()) {
      return res.status(403).json({ message: 'You cannot reject your own KYC' });
    }

    kyc.status = STATUS_REJECTED;
    kyc.reviewedBy = req.user._id;
    kyc.reviewedAt = new Date();
    kyc.rejectionReason = reason;
    await kyc.save();

    const agentUserId = kyc.employeeId && kyc.employeeId.userId
      ? kyc.employeeId.userId._id || kyc.employeeId.userId
      : null;
    if (agentUserId) {
      await notifySafely({
        userId: agentUserId,
        title: 'KYC Needs Correction',
        message: `Your KYC was sent back. Reason: ${reason}`,
        channel: 'IN_APP'
      });
    }

    res.json({ message: 'KYC rejected. Agent can edit and resubmit.', kyc });
  } catch (error) {
    next(error);
  }
};
