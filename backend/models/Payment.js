const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stripePaymentId:  { type: String },
    stripeInvoiceId:  { type: String },
    amount:           { type: Number, required: true }, // in pence/cents
    currency:         { type: String, default: 'gbp' },
    plan:             { type: String, enum: ['monthly', 'yearly'] },
    status:           { type: String, enum: ['succeeded', 'failed', 'refunded', 'pending'], default: 'pending' },
    type:             { type: String, enum: ['subscription', 'donation'], default: 'subscription' },

    // Distribution
    prizePoolContribution:   { type: Number, default: 0 },
    charityContribution:     { type: Number, default: 0 },
    charity:                 { type: mongoose.Schema.Types.ObjectId, ref: 'Charity' },
    platformFee:             { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
