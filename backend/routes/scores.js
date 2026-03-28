const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, requireSubscription } = require('../middleware/auth');

// All score routes require auth + active subscription
router.use(protect);

// ─── GET /api/scores ─── get my scores ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('scores');
    const scores = [...user.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, scores });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/scores ─── add a score ─────────────────────────────────────────
router.post(
  '/',
  requireSubscription,
  [
    body('value').isInt({ min: 1, max: 45 }).withMessage('Score must be 1–45 (Stableford)'),
    body('date').isISO8601().withMessage('Valid date required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const user = await User.findById(req.user._id);
      const newScore = { value: req.body.value, date: new Date(req.body.date) };

      // Insert — pre-save hook enforces 5-score rolling window + sort
      user.scores.push(newScore);
      await user.save();

      const scores = [...user.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
      res.status(201).json({ success: true, scores, message: 'Score added successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─── PUT /api/scores/:scoreId ─── edit a score ────────────────────────────────
router.put(
  '/:scoreId',
  requireSubscription,
  [
    body('value').optional().isInt({ min: 1, max: 45 }),
    body('date').optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      const score = user.scores.id(req.params.scoreId);
      if (!score) return res.status(404).json({ success: false, error: 'Score not found' });

      if (req.body.value !== undefined) score.value = req.body.value;
      if (req.body.date !== undefined) score.date = new Date(req.body.date);

      await user.save();
      const scores = [...user.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
      res.json({ success: true, scores, message: 'Score updated' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─── DELETE /api/scores/:scoreId ─── remove a score ──────────────────────────
router.delete('/:scoreId', requireSubscription, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const score = user.scores.id(req.params.scoreId);
    if (!score) return res.status(404).json({ success: false, error: 'Score not found' });

    score.deleteOne();
    await user.save();
    const scores = [...user.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, scores, message: 'Score deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
