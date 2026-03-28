/**
 * Seed script — run with: npm run seed
 * Creates admin user + sample charities + a sample draw
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Charity = require('../models/Charity');
const Draw = require('../models/Draw');

const charities = [
  {
    name: 'Fairway for Kids',
    slug: 'fairway-for-kids',
    description: 'Providing golf equipment and coaching to underprivileged children across the UK, giving them access to the sport and life skills it teaches.',
    shortDesc: 'Golf coaching for underprivileged youth',
    category: 'sports',
    isFeatured: true,
    order: 1,
  },
  {
    name: 'Green Heart Foundation',
    slug: 'green-heart-foundation',
    description: 'Protecting and restoring golf course ecosystems, wetlands, and native wildlife habitats across British fairways.',
    shortDesc: 'Conservation of golf course ecosystems',
    category: 'environment',
    isFeatured: true,
    order: 2,
  },
  {
    name: 'Birdie Health',
    slug: 'birdie-health',
    description: 'Using golf therapy to support mental health recovery for veterans, adults with disabilities, and those overcoming addiction.',
    shortDesc: 'Golf therapy for mental health recovery',
    category: 'health',
    isFeatured: true,
    order: 3,
  },
  {
    name: 'Eagle Community Trust',
    slug: 'eagle-community-trust',
    description: 'Revitalising community green spaces and building inclusive sports facilities in underserved areas.',
    shortDesc: 'Community sports facilities for all',
    category: 'community',
    isFeatured: false,
    order: 4,
  },
  {
    name: 'The 19th Hole Foundation',
    slug: '19th-hole-foundation',
    description: 'Supporting education scholarships for young athletes, connecting academic excellence with sporting achievement.',
    shortDesc: 'Education scholarships for young athletes',
    category: 'education',
    isFeatured: false,
    order: 5,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      Charity.deleteMany({}),
      Draw.deleteMany({}),
    ]);
    console.log('🗑  Cleared existing data');

    // Create charities
    const createdCharities = await Charity.insertMany(charities);
    console.log(`🏥 Created ${createdCharities.length} charities`);

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@1234', 12);
    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@golfcharity.com',
      password: 'Admin@1234',
      role: 'admin',
    });
    console.log('👤 Admin created — email: admin@golfcharity.com | password: Admin@1234');

    // Create test subscriber
    const testUser = await User.create({
      firstName: 'John',
      lastName: 'Birdie',
      email: 'user@golfcharity.com',
      password: 'User@1234',
      role: 'user',
      selectedCharity: createdCharities[0]._id,
      charityContribution: 15,
      subscription: {
        status: 'active',
        plan: 'monthly',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      scores: [
        { value: 32, date: new Date('2025-03-01') },
        { value: 28, date: new Date('2025-02-22') },
        { value: 35, date: new Date('2025-02-10') },
        { value: 30, date: new Date('2025-01-28') },
        { value: 27, date: new Date('2025-01-15') },
      ],
    });
    console.log('👤 Test user created — email: user@golfcharity.com | password: User@1234');

    // Create sample published draw
    const draw = await Draw.create({
      title: 'March 2025 Monthly Draw',
      month: 3,
      year: 2025,
      status: 'published',
      drawType: 'random',
      winningNumbers: [7, 14, 22, 35, 41],
      participantCount: 1,
      participants: [testUser._id],
      prizePool: { total: 150, jackpot: 60, fourMatch: 52.5, threeMatch: 37.5 },
      results: {
        fiveMatch:  { winners: [], prizePerWinner: 60 },
        fourMatch:  { winners: [], prizePerWinner: 0 },
        threeMatch: { winners: [], prizePerWinner: 0 },
      },
      publishedAt: new Date(),
      isJackpotRollover: true,
    });
    console.log('🎲 Sample draw created');

    console.log('\n✅ Seed complete!\n');
    console.log('─────────────────────────────────────────');
    console.log('  Admin:     admin@golfcharity.com / Admin@1234');
    console.log('  Test User: user@golfcharity.com  / User@1234');
    console.log('─────────────────────────────────────────\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
