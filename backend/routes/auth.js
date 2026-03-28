const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/email');

// ─── POST /api/auth/register ───────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { firstName, lastName, email, password, selectedCharity, charityContribution } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }

      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        selectedCharity: selectedCharity || null,
        charityContribution: charityContribution || 10,
      });

      try { await sendWelcomeEmail(user); } catch (e) { console.warn('Email send failed:', e.message); }

      const token = generateToken(user._id);
      res.status(201).json({ success: true, token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password').populate('selectedCharity', 'name logo slug');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
      if (!user.isActive) {
        return res.status(403).json({ success: false, error: 'Account deactivated' });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const token = generateToken(user._id);
      res.json({ success: true, token, user });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('selectedCharity', 'name logo slug description')
      .populate('drawsEntered', 'title month year status winningNumbers');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/auth/update-profile ─────────────────────────────────────────────
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, emailNotifications } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, emailNotifications },
      { new: true, runValidators: true }
    ).populate('selectedCharity', 'name logo slug');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/auth/change-password ────────────────────────────────────────────
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const user = await User.findById(req.user._id).select('+password');
      if (!(await user.comparePassword(req.body.currentPassword))) {
        return res.status(401).json({ success: false, error: 'Current password incorrect' });
      }
      user.password = req.body.newPassword;
      await user.save();
      res.json({ success: true, message: 'Password updated' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
