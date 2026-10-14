const crypto = require('crypto');
const Employee = require('../models/Employee');

const INVITE_CODE_BYTES = 6;
const APPROVED_STATUS = 'APPROVED';
const RANK_BY_ROLE = {
  ADMIN: 'Director Sales',
  DIRECTOR: 'Director Sales',
  MANAGER: 'Business Development Manager',
  EMPLOYEE: 'Business Executive',
  AGENT: 'Business Executive'
};
const DEFAULT_RANK = 'Business Executive';
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

module.exports = {
  normalizeInviteCode,
  generateEmployeeCode,
  ensureInviteCode,
  findOrCreateSponsorEmployee,
  resolveSponsorByInviteCode,
  publicSponsorPayload
};
