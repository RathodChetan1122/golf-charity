const express = require('express');
const router = express.Router();
const Draw = require('../models/Draw');
const Winner = require('../models/Winner');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const {
  randomDraw, algorithmicDraw, scoreParticipant,
  calculatePrizePool, distributePrizes
} = require('../utils/drawEngine');
const { sendDrawResultEmail } = require('../utils/email');

// ─── GET /api/draws — public: list published draws ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const draws = await Draw.find({ status: 'published' })
      .sort({ year: -1, month: -1 })
      .limit(12)
      .populate('results.fiveMatch.winners', 'firstName lastName')
      .populate('results.fourMatch.winners', 'firstName lastName')
      .populate('results.threeMatch.winners', 'firstName lastName');
    res.json({ success: true, draws });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/draws/latest ────────────────────────────────────────────────────
router.get('/latest', async (req, res) => {
  try {
    const draw = await Draw.findOne({ status: 'published' })
      .sort({ year: -1, month: -1 })
      .populate('results.fiveMatch.winners', 'firstName lastName')
      .populate('results.fourMatch.winners', 'firstName lastName')
      .populate('results.threeMatch.winners', 'firstName lastName');
    res.json({ success: true, draw });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/draws/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id)
      .populate('results.fiveMatch.winners', 'firstName lastName')
      .populate('results.fourMatch.winners', 'firstName lastName')
      .populate('results.threeMatch.winners', 'firstName lastName');
    if (!draw) return res.status(404).json({ success: false, error: 'Draw not found' });
    res.json({ success: true, draw });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: GET /api/draws/admin/all ─────────────────────────────────────────
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const draws = await Draw.find().sort({ year: -1, month: -1 });
    res.json({ success: true, draws });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: POST /api/draws — create draw ─────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, month, year, drawType, scheduledFor, notes } = req.body;
    const existing = await Draw.findOne({ month, year });
    if (existing) return res.status(409).json({ success: false, error: 'Draw for this month/year already exists' });

    const draw = await Draw.create({ title, month, year, drawType: drawType || 'random', scheduledFor, notes });
    res.status(201).json({ success: true, draw });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: POST /api/draws/:id/simulate — simulate without publishing ────────
router.post('/:id/simulate', protect, adminOnly, async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, error: 'Draw not found' });
    if (draw.status === 'published') return res.status(400).json({ success: false, error: 'Draw already published' });

    // Get all active subscribers
    const participants = await User.find({ 'subscription.status': 'active' }).select('scores firstName lastName');
    const monthlyCount = await User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'monthly' });
    const yearlyCount  = await User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'yearly' });

    // Get previous jackpot rollover
    const lastDraw = await Draw.findOne({ status: 'published', 'results.fiveMatch.claimed': false })
      .sort({ year: -1, month: -1 });
    const rolledOver = lastDraw?.prizePool?.jackpot || 0;

    // Generate draw numbers
    const winningNumbers = draw.drawType === 'algorithmic'
      ? algorithmicDraw(participants)
      : randomDraw();

    // Score all participants
    const tierWinners = { fiveMatch: [], fourMatch: [], threeMatch: [] };
    participants.forEach((user) => {
      const { tier } = scoreParticipant(user.scores, winningNumbers);
      if (tier) tierWinners[tier].push(user._id);
    });

    const prizePool = calculatePrizePool(monthlyCount, yearlyCount, rolledOver);
    const prizes    = distributePrizes(prizePool, tierWinners);

    draw.status = 'simulating';
    draw.winningNumbers = winningNumbers;
    draw.prizePool = { ...prizePool, jackpotRolledOver: rolledOver };
    draw.participants = participants.map((p) => p._id);
    draw.participantCount = participants.length;
    draw.results = {
      fiveMatch:  { winners: tierWinners.fiveMatch,  prizePerWinner: prizes.fiveMatch  },
      fourMatch:  { winners: tierWinners.fourMatch,  prizePerWinner: prizes.fourMatch  },
      threeMatch: { winners: tierWinners.threeMatch, prizePerWinner: prizes.threeMatch },
    };

    await draw.save();
    res.json({ success: true, draw, simulation: true, message: 'Simulation complete — review before publishing' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: POST /api/draws/:id/publish ───────────────────────────────────────
router.post('/:id/publish', protect, adminOnly, async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, error: 'Draw not found' });
    if (draw.status === 'published') return res.status(400).json({ success: false, error: 'Already published' });

    // If not yet simulated, run simulation first
    if (!draw.winningNumbers?.length) {
      return res.status(400).json({ success: false, error: 'Run simulation first before publishing' });
    }

    draw.status = 'published';
    draw.publishedAt = new Date();

    // Jackpot rollover — if no 5-match winners
    if (draw.results.fiveMatch.winners.length === 0) {
      draw.isJackpotRollover = true;
    }

    await draw.save();

    // Create Winner records
    const createWinners = async (tier) => {
      const users = draw.results[tier].winners;
      const amount = draw.results[tier].prizePerWinner;
      for (const userId of users) {
        const user = await User.findById(userId);
        if (!user) continue;
        const { matched } = scoreParticipant(user.scores, draw.winningNumbers);
        await Winner.create({ user: userId, draw: draw._id, tier, amount, matchedNumbers: matched });
        user.totalWon += amount;
        await user.save({ validateBeforeSave: false });
      }
    };

    await createWinners('fiveMatch');
    await createWinners('fourMatch');
    await createWinners('threeMatch');

    // Add draw to each participant's history
    await User.updateMany(
      { _id: { $in: draw.participants } },
      { $addToSet: { drawsEntered: draw._id } }
    );

    // Send email notifications (best-effort)
    try {
      const allWinnerIds = [
        ...draw.results.fiveMatch.winners,
        ...draw.results.fourMatch.winners,
        ...draw.results.threeMatch.winners,
      ];
      const winners = await User.find({ _id: { $in: allWinnerIds } });
      for (const w of winners) {
        await sendDrawResultEmail(w, draw);
      }
    } catch (e) {
      console.warn('Email notification error:', e.message);
    }

    res.json({ success: true, draw, message: 'Draw published successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: DELETE /api/draws/:id — reset/cancel ──────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, error: 'Not found' });
    if (draw.status === 'published') return res.status(400).json({ success: false, error: 'Cannot delete a published draw' });
    await draw.deleteOne();
    res.json({ success: true, message: 'Draw deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
