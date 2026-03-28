const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    draw:      { type: mongoose.Schema.Types.ObjectId, ref: 'Draw', required: true },
    tier:      { type: String, enum: ['fiveMatch', 'fourMatch', 'threeMatch'], required: true },
    amount:    { type: Number, required: true },
    matchedNumbers: [{ type: Number }],

    // Verification
    verificationStatus: { type: String, enum: ['pending', 'submitted', 'approved', 'rejected'], default: 'pending' },
    proofImageUrl:      { type: String, default: '' },
    proofSubmittedAt:   { type: Date },
    reviewedAt:         { type: Date },
    reviewedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason:    { type: String, default: '' },

    // Payment
    paymentStatus: { type: String, enum: ['pending', 'processing', 'paid', 'failed'], default: 'pending' },
    paidAt:        { type: Date },
    paymentRef:    { type: String, default: '' },
    paymentNotes:  { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Winner', winnerSchema);
