process.env.JWT_SECRET = 'test';
jest.mock('../services/emailService', () => ({ sendVerificationEmail: jest.fn(), sendPasswordResetEmail: jest.fn() }));
const path = require('path');
const root = path.join(__dirname, '..');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require(path.join(root, 'models/User'));
const { protect } = require(path.join(root, 'middleware/auth'));
const auth = require(path.join(root, 'controllers/authController'));

const mkRes = () => { const r = { code: 200 }; r.status = c => (r.code = c, r); r.json = b => (r.body = b, r); return r; };

test('token version revocation + change password', async () => {
  const user = { _id: 'u1', password: bcrypt.hashSync('oldpass', 4), tokenVersion: 0, isActive: true, approvalStatus: 'APPROVED', save: jest.fn() };
  User.findById = jest.fn(() => { const q = Promise.resolve(user); q.select = () => Promise.resolve(user); return q; });

  const legacy = jwt.sign({ id: 'u1' }, 'test'); // token issued before this change (no tv)
  let next = jest.fn(); let res = mkRes();
  await protect({ headers: { authorization: `Bearer ${legacy}` } }, res, next);
  expect(next).toHaveBeenCalled(); // existing sessions keep working

  // wrong current password -> 400, not 401
  res = mkRes();
  await auth.changePassword({ user, body: { currentPassword: 'nope', newPassword: 'newpass1' } }, res, jest.fn());
  expect(res.code).toBe(400);

  res = mkRes();
  await auth.changePassword({ user, body: { currentPassword: 'oldpass', newPassword: 'newpass1' } }, res, jest.fn());
  expect(res.code).toBe(200);
  expect(user.tokenVersion).toBe(1);
  expect(bcrypt.compareSync('newpass1', user.password)).toBe(true);

  // old token now rejected
  next = jest.fn(); res = mkRes();
  await protect({ headers: { authorization: `Bearer ${legacy}` } }, res, next);
  expect(next).not.toHaveBeenCalled(); expect(res.code).toBe(401);

  // fresh token from response works
  next = jest.fn(); res = mkRes();
  const fresh = (await (async () => { const r = mkRes(); user.password = bcrypt.hashSync('newpass1', 4); await auth.changePassword({ user, body: { currentPassword: 'newpass1', newPassword: 'third33' } }, r, jest.fn()); return r.body.token; })());
  await protect({ headers: { authorization: `Bearer ${fresh}` } }, res, next);
  expect(next).toHaveBeenCalled();
});

test('reset password bumps token version', async () => {
  const user = { _id: 'u2', password: 'x', tokenVersion: 3, save: jest.fn() };
  User.findOne = jest.fn(async () => user);
  const res = mkRes();
  await auth.resetPassword({ body: { resetToken: 'abc', newPassword: 'brandnew' } }, res, jest.fn());
  expect(res.code).toBe(200);
  expect(user.tokenVersion).toBe(4);
});
