const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Protect — verify JWT and attach user ─────────────────────────────────────
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorised — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('selectedCharity', 'name logo slug');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User not found or deactivated' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token invalid or expired' });
  }
};

// ─── Require active subscription ─────────────────────────────────────────────
exports.requireSubscription = (req, res, next) => {
  if (req.user.subscription.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: 'Active subscription required to access this feature',
      subscriptionRequired: true,
    });
  }
  next();
};

// ─── Admin only ───────────────────────────────────────────────────────────────
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

// ─── Generate JWT ─────────────────────────────────────────────────────────────
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};
