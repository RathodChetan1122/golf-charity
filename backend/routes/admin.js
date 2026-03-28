const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Charity = require('../models/Charity');
const Draw = require('../models/Draw');
const Winner = require('../models/Winner');
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// ─── GET /api/admin/stats — dashboard stats ───────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, activeSubscribers, monthlySubCount, yearlySubCount,
      totalCharities, totalDraws, pendingWinners, totalPayments,
    ] = await Promise.all([
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ 'subscription.status': 'active' }),
      User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'monthly' }),
      User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'yearly' }),
      Charity.countDocuments({ isActive: true }),
      Draw.countDocuments({ status: 'published' }),
      Winner.countDocuments({ verificationStatus: 'submitted' }),
      Payment.aggregate([{ $match: { status: 'succeeded' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    const totalRevenue = totalPayments[0]?.total || 0;

    const latestDraw = await Draw.findOne({ status: 'published' }).sort({ year: -1, month: -1 });

    // Monthly growth — last 6 months signups
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: 'user' } },
      { $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Charity contribution totals
    const charityStats = await User.aggregate([
      { $match: { 'subscription.status': 'active', selectedCharity: { $ne: null } } },
      { $group: { _id: '$selectedCharity', count: { $sum: 1 }, avgContribution: { $avg: '$charityContribution' } } },
      { $lookup: { from: 'charities', localField: '_id', foreignField: '_id', as: 'charity' } },
      { $unwind: '$charity' },
      { $project: { name: '$charity.name', count: 1, avgContribution: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeSubscribers,
        monthlySubCount,
        yearlySubCount,
        totalCharities,
        totalDraws,
        pendingWinners,
        totalRevenue: totalRevenue / 100, // convert pence to pounds
        latestDraw: latestDraw ? { month: latestDraw.month, year: latestDraw.year, prizePool: latestDraw.prizePool } : null,
        monthlyGrowth,
        charityStats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search, status, plan, page = 1, limit = 20 } = req.query;
    const filter = { role: 'user' };
    if (status) filter['subscription.status'] = status;
    if (plan)   filter['subscription.plan']   = plan;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('selectedCharity', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password');

    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('selectedCharity', 'name logo')
      .populate('drawsEntered', 'title month year status')
      .select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/admin/users/:id ─────────────────────────────────────────────────
router.put('/users/:id', async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'email', 'isActive', 'subscription', 'scores', 'selectedCharity', 'charityContribution'];
    const update  = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/admin/users/:id/scores ─── admin edit user scores ───────────────
router.put('/users/:id/scores', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Not found' });
    user.scores = req.body.scores;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
