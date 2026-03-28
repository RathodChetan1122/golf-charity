const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true, minlength: 6, select: false },
    role:      { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar:    { type: String, default: '' },

    // Subscription
    subscription: {
      status:           { type: String, enum: ['active', 'inactive', 'cancelled', 'lapsed', 'trialing'], default: 'inactive' },
      plan:             { type: String, enum: ['monthly', 'yearly', ''], default: '' },
      stripeCustomerId: { type: String, default: '' },
      stripeSubId:      { type: String, default: '' },
      currentPeriodEnd: { type: Date },
      cancelAtPeriodEnd:{ type: Boolean, default: false },
    },

    // Charity selection
    selectedCharity:     { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', default: null },
    charityContribution: { type: Number, default: 10, min: 10, max: 100 }, // percentage

    // Scores — rolling last 5
    scores: [
      {
        value: { type: Number, required: true, min: 1, max: 45 },
        date:  { type: Date, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Draw participation
    drawsEntered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Draw' }],

    // Total winnings
    totalWon: { type: Number, default: 0 },

    // Email prefs
    emailNotifications: { type: Boolean, default: true },

    isActive:   { type: Boolean, default: true },
    lastLogin:  { type: Date },
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpire:  { type: Date, select: false },
  },
  { timestamps: true }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Only keep last 5 scores — always sorted newest first
userSchema.pre('save', function (next) {
  if (this.isModified('scores')) {
    this.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (this.scores.length > 5) {
      this.scores = this.scores.slice(0, 5);
    }
  }
  next();
});

// Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
