const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDesc:   { type: String, maxlength: 160 },
    logo:        { type: String, default: '' },
    coverImage:  { type: String, default: '' },
    images:      [{ type: String }],
    website:     { type: String, default: '' },
    category:    { type: String, enum: ['health', 'education', 'environment', 'sports', 'community', 'other'], default: 'other' },

    // Events (e.g. golf days)
    events: [
      {
        title:       { type: String },
        description: { type: String },
        date:        { type: Date },
        location:    { type: String },
        imageUrl:    { type: String },
      },
    ],

    // Aggregated from subscriptions
    totalRaised:       { type: Number, default: 0 },
    totalSubscribers:  { type: Number, default: 0 },

    isFeatured:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug
charitySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

module.exports = mongoose.model('Charity', charitySchema);
