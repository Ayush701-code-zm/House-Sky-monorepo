const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/jwt');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
      }
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (req.user.isActive === false || req.user.approvalStatus === 'REJECTED') {
        return res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
      }
      // Token issued before the last password change/reset — session revoked.
      if ((decoded.tv || 0) !== (req.user.tokenVersion || 0)) {
        return res.status(401).json({ message: 'Your password was changed. Please log in again.' });
      }
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
    return next();
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user ? req.user.role : 'GUEST'}' is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };
