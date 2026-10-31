const crypto = require('crypto');
const Employee = require('../models/Employee');
const User = require('../models/User');

const INVITE_CODE_BYTES = 6;
const APPROVED_STATUS = 'APPROVED';
const RANK_BY_ROLE = {
  ADMIN: 'Advisor',
  DIRECTOR: 'Advisor',
  MANAGER: 'Advisor',
  EMPLOYEE: 'Advisor',
  AGENT: 'Advisor'
};
const DEFAULT_RANK = 'Advisor';
const EMPLOYEE_CODE_PREFIX = 'H&S-';
const EMPLOYEE_CODE_START = 1000;

function normalizeInviteCode(value) {
  return String(value || '').trim().toUpperCase();
}

async function createUniqueInviteCode() {
  let code = '';
  let exists = true;
  while (exists) {
    code = crypto.randomBytes(INVITE_CODE_BYTES).toString('hex').toUpperCase();
    exists = Boolean(await Employee.exists({ inviteCode: code }));
  }
  return code;
}

async function ensureInviteCode(employee) {
  if (employee.inviteCode) return employee.inviteCode;
  const code = await createUniqueInviteCode();
  employee.inviteCode = code;
  await employee.save();
  return code;
}

/**
 * Next free employee code (H&S-1001, H&S-1002, ...). Starts from the document
 * count like before, but skips codes already taken — a plain count collides
 * with existing codes after any employee is deleted (unique index violation).
 */
async function generateEmployeeCode() {
  let next = EMPLOYEE_CODE_START + (await Employee.countDocuments()) + 1;
  while (await Employee.exists({ employeeCode: `${EMPLOYEE_CODE_PREFIX}${next}` })) {
    next += 1;
  }
  return `${EMPLOYEE_CODE_PREFIX}${next}`;
}

async function findOrCreateSponsorEmployee(user) {
  if (!user?._id) return null;
  let employee = await Employee.findOne({ userId: user._id }).populate(
    'userId',
    'fullName isActive approvalStatus role'
  );
  if (employee) return employee;

  // Only MLM roles get an auto-created sponsor profile; public USER /
  // PROPERTY_OWNER accounts must never be inserted into the hierarchy.
  if (!RANK_BY_ROLE[user.role]) return null;

  const employeeCode = await generateEmployeeCode();
  const created = await Employee.create({
    userId: user._id,
    employeeCode,
    joiningDate: new Date(),
    currentRank: RANK_BY_ROLE[user.role] || DEFAULT_RANK,
    parentId: null
  });
  return Employee.findById(created._id).populate(
    'userId',
    'fullName isActive approvalStatus role'
  );
}

async function resolveSponsorByInviteCode(inviteCode) {
  const code = normalizeInviteCode(inviteCode);
  if (!code) return null;
  const sponsor = await Employee.findOne({ inviteCode: code }).populate(
    'userId',
    'fullName isActive approvalStatus role'
  );
  if (!sponsor || !sponsor.userId) return null;
  if (sponsor.userId.isActive === false) return null;
  if (sponsor.userId.approvalStatus && sponsor.userId.approvalStatus !== APPROVED_STATUS) {
    return null;
  }
  return sponsor;
}

function publicSponsorPayload(sponsor) {
  return {
    inviteCode: sponsor.inviteCode,
    sponsorName: sponsor.userId?.fullName || 'House & Sky Agent',
    employeeCode: sponsor.employeeCode,
    currentRank: sponsor.currentRank
  };
}

function publicSponsorLookupPayload(sponsor) {
  return {
    sponsorName: sponsor.userId?.fullName || 'House & Sky Agent',
    employeeCode: sponsor.employeeCode,
    currentRank: sponsor.currentRank
  };
}

/** H&S-1001, h&s1001, and 1001 all point at the same member ID. */
function sponsorCodeCandidates(raw) {
  const trimmed = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!trimmed || trimmed.length > 40) return [];
  const candidates = new Set([trimmed]);
  if (/^\d{1,8}$/.test(trimmed)) {
    candidates.add(`${EMPLOYEE_CODE_PREFIX}${trimmed}`);
  }
  const houseCode = trimmed.match(/^H&S-?(\d{1,8})$/);
  if (houseCode) {
    candidates.add(`${EMPLOYEE_CODE_PREFIX}${houseCode[1]}`);
  }
  return [...candidates];
}

async function resolveSponsorByEmployeeCode(raw) {
  const candidates = sponsorCodeCandidates(raw);
  if (!candidates.length) return null;
  const sponsor = await Employee.findOne({ employeeCode: { $in: candidates } }).populate(
    'userId',
    'fullName isActive approvalStatus role'
  );
  if (!sponsor || !sponsor.userId) return null;
  if (sponsor.userId.isActive === false) return null;
  if (sponsor.userId.approvalStatus && sponsor.userId.approvalStatus !== APPROVED_STATUS) {
    return null;
  }
  return sponsor;
}

/**
 * Public registration must name a real sponsor. A typed member ID wins over
 * an invite link so the visitor can correct a prefilled sponsor before submit.
 */
async function resolvePublicSponsor({ sponsorCode, inviteCode } = {}) {
  const typed = String(sponsorCode || '').trim();
  if (typed) {
    const sponsor = await resolveSponsorByEmployeeCode(typed);
    return sponsor
      ? { sponsor }
      : { message: 'Sponsor ID not found.' };
  }
  const invite = String(inviteCode || '').trim();
  if (invite) {
    const sponsor = await resolveSponsorByInviteCode(invite);
    return sponsor
      ? { sponsor }
      : { message: 'This invite link is invalid. Ask your sponsor for a fresh link.' };
  }
  return { message: 'A sponsor ID is required.' };
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/** Same digits with spaces or a leading + still count as one mobile number. */
function phoneFilter(phone) {
  const digits = phoneDigits(phone);
  if (digits.length < 5 || digits.length > 20) return null;
  return { phone: { $regex: `^\\D*${digits.split('').join('\\D*')}\\D*$` } };
}

async function findUserByPhone(phone) {
  const filter = phoneFilter(phone);
  if (!filter) return null;
  return User.findOne(filter).select('_id');
}

const MAX_AGENT_IDS_PER_CONTACT = 3;

/**
 * One email together with one mobile may belong to three AGENT member IDs.
 * A fourth ID, a different pairing, or a staff login on that contact is refused.
 * Returns an error message, or null when another agent ID is allowed.
 */
async function agentContactSlot(email, phone) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const digits = phoneDigits(phone);
  const byEmail = normalizedEmail ? await User.find({ email: normalizedEmail }) : [];
  const phoneQuery = phoneFilter(phone);
  const byPhone = phoneQuery ? await User.find(phoneQuery) : [];
  const seen = new Map();
  [...byEmail, ...byPhone].forEach((user) => seen.set(String(user._id), user));
  const users = [...seen.values()];
  if (!users.length) return null;
  if (users.some((user) => user.role !== 'AGENT')) {
    return 'This email or mobile already belongs to a staff login.';
  }
  const samePair = users.every((user) => user.email === normalizedEmail && phoneDigits(user.phone) === digits);
  if (!samePair) {
    return 'This email and mobile are already used on different member IDs.';
  }
  if (users.length >= MAX_AGENT_IDS_PER_CONTACT) {
    return 'This email and mobile already have 3 member IDs.';
  }
  return null;
}

module.exports = {
  normalizeInviteCode,
  generateEmployeeCode,
  ensureInviteCode,
  findOrCreateSponsorEmployee,
  resolveSponsorByInviteCode,
  resolveSponsorByEmployeeCode,
  resolvePublicSponsor,
  findUserByPhone,
  agentContactSlot,
  MAX_AGENT_IDS_PER_CONTACT,
  publicSponsorPayload,
  publicSponsorLookupPayload,
  sponsorCodeCandidates
};
