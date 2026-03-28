const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ─── PUT /api/users/charity ── update charity selection ───────────────────────
router.put('/charity', protect, async (req, res) => {
  try {
    const { charityId, charityContribution } = req.body;
    const pct = Math.min(100, Math.max(10, Number(charityContribution) || 10));
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { selectedCharity: charityId || null, charityContribution: pct },
      { new: true }
    ).populate('selectedCharity', 'name logo slug');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/users/participation ── draw participation summary ───────────────
router.get('/participation', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('drawsEntered', 'title month year status winningNumbers publishedAt')
      .select('drawsEntered totalWon');
    res.json({ success: true, drawsEntered: user.drawsEntered, totalWon: user.totalWon });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
