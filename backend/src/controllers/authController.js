const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/jwt');
const { resolvePublicSponsor, generateEmployeeCode, findUserByPhone, sponsorCodeCandidates } = require('../utils/agentInvite');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, tv: user.tokenVersion || 0 }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 1. Direct Registration (e.g. from Admin/Agent portal or internal creation)
exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, parentEmployeeId, role, currentRank } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    if (phone && await findUserByPhone(phone)) {
      return res.status(400).json({ message: 'An account with this mobile number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role || 'AGENT';
    const isAdminRole = ['ADMIN', 'DIRECTOR'].includes(userRole);
    const vToken = generateRandomToken();

    user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      fullName,
      phone,
      role: userRole,
      isActive: true,
      approvalStatus: 'APPROVED',
      isVerified: isAdminRole ? true : false,
      verificationToken: isAdminRole ? null : vToken,
      verificationTokenExpires: isAdminRole ? null : new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    let employee;
    try {
      employee = await Employee.create({
        userId: user._id,
        employeeCode: await generateEmployeeCode(),
        joiningDate: new Date(),
        currentRank: currentRank || 'Business Executive',
        parentId: parentEmployeeId || null
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id });
      throw err;
    }

    // Send verification email if not admin
    if (!isAdminRole) {
      const clientOrigin = req.headers.origin || req.headers.referer;
      sendVerificationEmail({
        toEmail: user.email,
        fullName: user.fullName,
        token: vToken,
        clientOrigin,
        role: user.role
      }).catch(err => console.error('Failed to send verification email:', err.message));
    }

    const token = generateToken(user);

    res.status(201).json({
      message: isAdminRole
        ? 'User created successfully.'
        : 'Account created! A verification email has been sent to your email address. Please verify before logging in.',
      token,
      isVerified: user.isVerified,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        approvalStatus: user.approvalStatus,
        isVerified: user.isVerified
      },
      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        currentRank: employee.currentRank
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Public Agent Application Registration
exports.registerPublicAgent = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, inviteCode, sponsorCode } = req.body;

    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({ message: 'Full name, email, phone, and password are required' });
    }

    const sponsorResult = await resolvePublicSponsor({ sponsorCode, inviteCode });
    if (!sponsorResult.sponsor) {
      return res.status(400).json({ message: sponsorResult.message });
    }
    const sponsor = sponsorResult.sponsor;

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    if (await findUserByPhone(phone)) {
      return res.status(400).json({ message: 'An account with this mobile number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const vToken = generateRandomToken();

    user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      fullName,
      phone,
      role: 'AGENT',
      isActive: false,
      approvalStatus: 'PENDING_APPROVAL',
      isVerified: false,
      verificationToken: vToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    let employeeCode = '';
    try {
      employeeCode = await generateEmployeeCode();
      await Employee.create({
        userId: user._id,
        employeeCode,
        joiningDate: new Date(),
        currentRank: 'Business Executive',
        parentId: sponsor._id
      });
    } catch (err) {
      // Don't leave an orphan user that blocks this email from re-registering.
      await User.deleteOne({ _id: user._id });
      throw err;
    }

    // Send verification email
    const clientOrigin = req.headers.origin || req.headers.referer;
    sendVerificationEmail({
      toEmail: user.email,
      fullName: user.fullName,
      token: vToken,
      clientOrigin,
      role: user.role
    }).catch(err => console.error('Failed to send verification email:', err.message));

    res.status(201).json({
      message: '🎉 Agent application submitted! Check your email to verify your address. Account activation is subject to Admin approval.',
      employeeCode,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        approvalStatus: user.approvalStatus,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. User & Agent Login with Email Verification & Approval Guards
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const identifier = (email || '').toLowerCase().trim();
    const cleanPhone = identifier.replace(/[\s\-+]/g, '');

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Mobile number and password are required' });
    }

    let user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
        { phone: cleanPhone }
      ]
    });
    if (!user) {
      const codes = sponsorCodeCandidates(identifier);
      if (codes.length) {
        const byCode = await Employee.findOne({ employeeCode: { $in: codes } });
        if (byCode) user = await User.findById(byCode.userId);
      }
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isAdmin = ['ADMIN', 'DIRECTOR'].includes(user.role);

    // Email verification check (Exempt for ADMIN / DIRECTOR)
    if (!isAdmin && !user.isVerified) {
      return res.status(403).json({
        message: 'Your email is not verified yet. Please check your inbox for the verification email or click Resend Verification.',
        isVerified: false,
        email: user.email
      });
    }

    if (user.approvalStatus === 'PENDING_APPROVAL') {
      return res.status(403).json({
        message: 'Your Agent Application is currently PENDING Admin/Manager approval. Please wait for activation before logging in.'
      });
    }

    if (user.approvalStatus === 'REJECTED' || user.isActive === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated or rejected by Admin. Please contact support.'
      });
    }

    const employee = await Employee.findOne({ userId: user._id });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        approvalStatus: user.approvalStatus,
        isVerified: user.isVerified
      },
      employee: employee ? {
        id: employee._id,
        employeeCode: employee.employeeCode,
        currentRank: employee.currentRank,
        selfSalesCount: employee.selfSalesCount,
        teamSalesCount: employee.teamSalesCount,
        activeLegsCount: employee.activeLegsCount
      } : null
    });
  } catch (error) {
    next(error);
  }
};

// 4. Verify Email Token
exports.verifyEmail = async (req, res, next) => {
  try {
    const token = req.body.token || req.query.token;

    // Must be a plain string — an object like { $ne: null } would be treated as a
    // Mongo query operator and match arbitrary users.
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token. Please request a new verification email.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({
      success: true,
      message: '✅ Email verified successfully! You can now log in to your account.'
    });
  } catch (error) {
    next(error);
  }
};

// 5. Resend Verification Email
exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const identifier = (email || '').toLowerCase().trim();
    const cleanPhone = identifier.replace(/[\s\-+]/g, '');

    if (!identifier) {
      return res.status(400).json({ message: 'Email address or mobile number is required' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
        { phone: cleanPhone }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address or mobile number' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Your email address is already verified. You can log in.' });
    }

    const vToken = generateRandomToken();
    user.verificationToken = vToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const clientOrigin = req.headers.origin || req.headers.referer;
    await sendVerificationEmail({
      toEmail: user.email,
      fullName: user.fullName,
      token: vToken,
      clientOrigin,
      role: user.role
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully! Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
};

// 6. Forgot Password (Request Reset Link)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const identifier = (email || '').toLowerCase().trim();
    const cleanPhone = identifier.replace(/[\s\-+]/g, '');

    if (!identifier) {
      return res.status(400).json({ message: 'Email address or mobile number is required' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
        { phone: cleanPhone }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address or mobile number' });
    }

    const rToken = generateRandomToken();
    user.resetPasswordToken = rToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientOrigin = req.headers.origin || req.headers.referer;
    await sendPasswordResetEmail({
      toEmail: user.email,
      fullName: user.fullName,
      token: rToken,
      clientOrigin,
      role: user.role
    });

    res.json({
      success: true,
      message: 'Password reset link sent to your email address! Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
};

// 7. Reset Password with Token
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, token, newPassword } = req.body;
    const activeToken = resetToken || token;

    if (!activeToken || !newPassword || typeof activeToken !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      resetPasswordToken: activeToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset link. Please request a new password reset.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // log out all existing sessions
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 400 (not 401) so the client doesn't treat a typo as an expired session.
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: 'New password must be different from the current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // log out every other session
    await user.save();

    // Fresh token so the session that made the change stays logged in.
    res.json({
      success: true,
      message: 'Password changed successfully. All other sessions have been logged out.',
      token: generateToken(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const employee = await Employee.findOne({ userId: user._id }).populate('parentId');

    res.json({
      user,
      employee
    });
  } catch (error) {
    next(error);
  }
};

exports.registerPropertyOwner = async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'Full name, email, phone, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists. Please login.' });
    }
    if (await findUserByPhone(phone)) {
      return res.status(400).json({ message: 'An account with this mobile number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const vToken = generateRandomToken();

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      role: 'PROPERTY_OWNER',
      isActive: true,
      approvalStatus: 'APPROVED',
      isVerified: false,
      verificationToken: vToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const clientOrigin = req.headers.origin || req.headers.referer;
    sendVerificationEmail({
      toEmail: user.email,
      fullName: user.fullName,
      token: vToken,
      clientOrigin,
      role: user.role
    }).catch(err => console.error('Failed to send verification email:', err.message));

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your address before logging in.',
      isVerified: false,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};
