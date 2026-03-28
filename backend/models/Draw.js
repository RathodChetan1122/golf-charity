const mongoose = require('mongoose');

const drawSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    month:       { type: Number, required: true }, // 1–12
    year:        { type: Number, required: true },
    status:      { type: String, enum: ['upcoming', 'simulating', 'published', 'closed'], default: 'upcoming' },
    drawType:    { type: String, enum: ['random', 'algorithmic'], default: 'random' },

    // The 5 winning numbers drawn
    winningNumbers: [{ type: Number, min: 1, max: 45 }],

    // Prize pool snapshot at draw time
    prizePool: {
      total:       { type: Number, default: 0 },
      jackpot:     { type: Number, default: 0 }, // 40% — rolls over
      fourMatch:   { type: Number, default: 0 }, // 35%
      threeMatch:  { type: Number, default: 0 }, // 25%
      jackpotRolledOver: { type: Number, default: 0 }, // accumulated from prev months
    },

    // Subscribers entered in this draw (snapshot of active subs at draw time)
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    participantCount: { type: Number, default: 0 },

    // Results per tier
    results: {
      fiveMatch: {
        winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        prizePerWinner: { type: Number, default: 0 },
        claimed: { type: Boolean, default: false },
      },
      fourMatch: {
        winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        prizePerWinner: { type: Number, default: 0 },
      },
      threeMatch: {
        winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        prizePerWinner: { type: Number, default: 0 },
      },
    },

    publishedAt:  { type: Date },
    scheduledFor: { type: Date },
    notes:        { type: String, default: '' },
    isJackpotRollover: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound unique index per month/year
drawSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Draw', drawSchema);
