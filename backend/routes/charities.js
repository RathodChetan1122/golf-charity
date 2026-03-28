const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Charity = require('../models/Charity');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/charities'),
  filename:    (req, file, cb) => cb(null, `charity-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
}});

// ─── GET /api/charities ─── public list ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, category, featured, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;

    const total = await Charity.countDocuments(filter);
    const charities = await Charity.find(filter)
      .sort({ isFeatured: -1, order: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, charities, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/charities/featured ─────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const charities = await Charity.find({ isActive: true, isFeatured: true }).limit(3);
    res.json({ success: true, charities });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/charities/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const charity = await Charity.findOne({
      $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { slug: req.params.id }],
      isActive: true,
    });
    if (!charity) return res.status(404).json({ success: false, error: 'Charity not found' });
    res.json({ success: true, charity });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/charities/select ─── user selects charity ──────────────────────
router.put('/select', protect, async (req, res) => {
  try {
    const { charityId, contribution } = req.body;
    const charity = await Charity.findById(charityId);
    if (!charity) return res.status(404).json({ success: false, error: 'Charity not found' });

    const pct = Math.min(100, Math.max(10, Number(contribution) || 10));
    await User.findByIdAndUpdate(req.user._id, {
      selectedCharity: charityId,
      charityContribution: pct,
    });
    res.json({ success: true, message: 'Charity updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: POST /api/charities ───────────────────────────────────────────────
router.post('/', protect, adminOnly, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.logo) data.logo = `/uploads/charities/${req.files.logo[0].filename}`;
    if (req.files?.coverImage) data.coverImage = `/uploads/charities/${req.files.coverImage[0].filename}`;
    const charity = await Charity.create(data);
    res.status(201).json({ success: true, charity });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: PUT /api/charities/:id ────────────────────────────────────────────
router.put('/:id', protect, adminOnly, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.logo) data.logo = `/uploads/charities/${req.files.logo[0].filename}`;
    if (req.files?.coverImage) data.coverImage = `/uploads/charities/${req.files.coverImage[0].filename}`;
    const charity = await Charity.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!charity) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, charity });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: DELETE /api/charities/:id ────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Charity.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Charity deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
