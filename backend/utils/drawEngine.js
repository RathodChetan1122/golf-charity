/**
 * Draw Engine — supports Random and Algorithmic draw modes
 */

/**
 * Random draw — standard lottery style
 * Returns 5 unique numbers between 1–45
 */
const randomDraw = () => {
  const numbers = new Set();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return [...numbers].sort((a, b) => a - b);
};

/**
 * Algorithmic draw — weighted by score frequency across all participants
 * More frequent scores = higher probability of being drawn
 * @param {Array} participants — User documents with scores arrays
 */
const algorithmicDraw = (participants) => {
  // Tally all scores from all participants
  const frequency = {};
  for (let i = 1; i <= 45; i++) frequency[i] = 0;

  participants.forEach((user) => {
    user.scores.forEach((s) => {
      if (s.value >= 1 && s.value <= 45) {
        frequency[s.value] = (frequency[s.value] || 0) + 1;
      }
    });
  });

  const totalScores = Object.values(frequency).reduce((a, b) => a + b, 0);

  // If no scores, fall back to random
  if (totalScores === 0) return randomDraw();

  // Build weighted pool
  const pool = [];
  for (let num = 1; num <= 45; num++) {
    const weight = Math.round(((frequency[num] || 0) / totalScores) * 1000) + 1; // +1 baseline
    for (let w = 0; w < weight; w++) pool.push(num);
  }

  // Pick 5 unique from weighted pool
  const picked = new Set();
  let attempts = 0;
  while (picked.size < 5 && attempts < 10000) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.add(pool[idx]);
    attempts++;
  }

  // Fallback if algo fails
  while (picked.size < 5) {
    picked.add(Math.floor(Math.random() * 45) + 1);
  }

  return [...picked].sort((a, b) => a - b);
};

/**
 * Score a single user's scores against the winning numbers
 * Returns matched numbers and tier
 */
const scoreParticipant = (userScores, winningNumbers) => {
  const userNums = userScores.map((s) => s.value);
  const matched = winningNumbers.filter((n) => userNums.includes(n));
  let tier = null;
  if (matched.length === 5) tier = 'fiveMatch';
  else if (matched.length === 4) tier = 'fourMatch';
  else if (matched.length === 3) tier = 'threeMatch';
  return { matched, tier, matchCount: matched.length };
};

/**
 * Calculate prize pool from active subscriber count and plan mix
 * Plans: monthly = £9.99, yearly = £99.99/12 = £8.33/mo equivalent
 * Prize pool = 50% of subscription revenue; charity = 10–30%; platform = remainder
 */
const MONTHLY_PRICE = 9.99;
const YEARLY_PRICE_PER_MONTH = 99.99 / 12;

const calculatePrizePool = (monthlyCount, yearlyCount, rolledOver = 0) => {
  const monthlyRevenue = monthlyCount * MONTHLY_PRICE;
  const yearlyRevenue  = yearlyCount  * YEARLY_PRICE_PER_MONTH;
  const totalRevenue   = monthlyRevenue + yearlyRevenue;

  const total    = parseFloat((totalRevenue * 0.5 + rolledOver).toFixed(2));
  const jackpot  = parseFloat((total * 0.40).toFixed(2));
  const four     = parseFloat((total * 0.35).toFixed(2));
  const three    = parseFloat((total * 0.25).toFixed(2));

  return { total, jackpot, fourMatch: four, threeMatch: three };
};

/**
 * Distribute prizes among winners
 */
const distributePrizes = (prizePool, results) => {
  const dist = { fiveMatch: 0, fourMatch: 0, threeMatch: 0 };

  const fiveCount  = results.fiveMatch?.length  || 0;
  const fourCount  = results.fourMatch?.length  || 0;
  const threeCount = results.threeMatch?.length || 0;

  // Jackpot only paid if claimed (not rolled over)
  dist.fiveMatch  = fiveCount  > 0 ? parseFloat((prizePool.jackpot  / fiveCount).toFixed(2))  : 0;
  dist.fourMatch  = fourCount  > 0 ? parseFloat((prizePool.fourMatch / fourCount).toFixed(2))  : 0;
  dist.threeMatch = threeCount > 0 ? parseFloat((prizePool.threeMatch/ threeCount).toFixed(2)) : 0;

  return dist;
};

module.exports = {
  randomDraw,
  algorithmicDraw,
  scoreParticipant,
  calculatePrizePool,
  distributePrizes,
  MONTHLY_PRICE,
  YEARLY_PRICE_PER_MONTH,
};
