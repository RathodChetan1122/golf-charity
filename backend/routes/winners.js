const express = require('express');
const router = express.Router();
const Winner = require('../models/Winner');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload dir exists
const uploadDir = 'uploads/proofs';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `proof-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── GET /api/winners/my ─── user's winnings ──────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const winners = await Winner.find({ user: req.user._id })
      .populate('draw', 'title month year winningNumbers')
      .sort({ createdAt: -1 });
    res.json({ success: true, winners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/winners/:id/upload-proof ───────────────────────────────────────
router.post('/:id/upload-proof', protect, upload.single('proof'), async (req, res) => {
  try {
    const winner = await Winner.findOne({ _id: req.params.id, user: req.user._id });
    if (!winner) return res.status(404).json({ success: false, error: 'Winner record not found' });
    if (winner.verificationStatus === 'approved') {
      return res.status(400).json({ success: false, error: 'Already approved' });
    }
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    winner.proofImageUrl = `/uploads/proofs/${req.file.filename}`;
    winner.proofSubmittedAt = new Date();
    winner.verificationStatus = 'submitted';
    await winner.save();

    res.json({ success: true, winner, message: 'Proof submitted for review' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: GET /api/winners ──────────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const total = await Winner.countDocuments(filter);
    const winners = await Winner.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('draw', 'title month year')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, winners, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: PUT /api/winners/:id/verify ──────────────────────────────────────
router.put('/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    const winner = await Winner.findById(req.params.id);
    if (!winner) return res.status(404).json({ success: false, error: 'Not found' });

    winner.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
    winner.reviewedAt = new Date();
    winner.reviewedBy = req.user._id;
    if (action === 'reject' && rejectionReason) winner.rejectionReason = rejectionReason;

    await winner.save();
    res.json({ success: true, winner });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: PUT /api/winners/:id/mark-paid ───────────────────────────────────
router.put('/:id/mark-paid', protect, adminOnly, async (req, res) => {
  try {
    const { paymentRef, paymentNotes } = req.body;
    const winner = await Winner.findById(req.params.id);
    if (!winner) return res.status(404).json({ success: false, error: 'Not found' });

    winner.paymentStatus = 'paid';
    winner.paidAt = new Date();
    winner.paymentRef = paymentRef || '';
    winner.paymentNotes = paymentNotes || '';
    await winner.save();

    res.json({ success: true, winner, message: 'Marked as paid' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
