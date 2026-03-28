import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }) };

const HeroStat = ({ value, label, delay }) => (
  <motion.div variants={fadeUp} custom={delay} initial="hidden" animate="visible"
    style={{ textAlign: 'center' }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, color: 'var(--green-light)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 6, fontWeight: 600 }}>{label}</div>
  </motion.div>
);

export default function HomePage() {
  const [featuredCharities, setFeaturedCharities] = useState([]);
  const [latestDraw, setLatestDraw] = useState(null);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    api.get('/charities/featured').then(r => setFeaturedCharities(r.data.charities || [])).catch(() => {});
    api.get('/draws/latest').then(r => setLatestDraw(r.data.draw)).catch(() => {});
  }, []);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '80px 0 60px' }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: '15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,158,92,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,60,158,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 720 }}>
            {/* Eyebrow */}
            <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
              <span className="badge badge--green" style={{ marginBottom: 24, display: 'inline-flex', fontSize: 11, letterSpacing: 2 }}>
                ● Monthly Draws · Charity Impact · Stableford Scores
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible"
              style={{ marginBottom: 24, color: 'var(--text-primary)' }}>
              Every Round<br />
              <span style={{ color: 'var(--green-light)', fontStyle: 'italic' }}>Changes Lives.</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible"
              style={{ fontSize: 'clamp(16px,2vw,20px)', maxWidth: 560, marginBottom: 40, lineHeight: 1.75 }}>
              Subscribe. Log your Stableford scores. Enter our monthly prize draws. A portion of every subscription goes directly to a charity you choose.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible"
              style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/subscribe" className="btn btn--primary btn--lg">
                Start Playing for Good →
              </Link>
              <Link to="/charities" className="btn btn--outline btn--lg">
                Explore Charities
              </Link>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
            style={{
              display: 'flex', gap: 48, flexWrap: 'wrap',
              marginTop: 72, paddingTop: 48,
              borderTop: '1px solid var(--border)',
            }}>
            <HeroStat value="£10K+" label="Raised for Charity" delay={5} />
            <HeroStat value="500+"  label="Active Subscribers"  delay={6} />
            <HeroStat value="£500" label="Monthly Jackpot"    delay={7} />
            <HeroStat value="12+"  label="Charity Partners"    delay={8} />
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-deep)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="badge badge--grey" style={{ marginBottom: 12, display: 'inline-flex' }}>How it works</span>
            <h2>Simple. Meaningful. <span style={{ color: 'var(--green-light)' }}>Rewarding.</span></h2>
          </div>
          <div className="grid-3" style={{ gap: 24 }}>
            {[
              { num: '01', icon: '💳', title: 'Subscribe', desc: 'Choose a monthly or yearly plan. Your subscription funds the prize pool and supports your chosen charity.' },
              { num: '02', icon: '⛳', title: 'Log Your Scores', desc: 'Enter your latest 5 Stableford scores (1–45). Your scores become your draw entries — the better you play, the better your chances algorithmically.' },
              { num: '03', icon: '🏆', title: 'Win & Give', desc: 'Every month we run a draw. Match 3, 4 or all 5 numbers to win your share of the prize pool. Every round, something good happens.' },
            ].map((step, i) => (
              <motion.div key={step.num} className="card"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, fontWeight: 700 }}>{step.num}</span>
                  <span style={{ fontSize: 28 }}>{step.icon}</span>
                </div>
                <h3 style={{ fontSize: 22, marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 14 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest Draw ──────────────────────────────────────────────────── */}
      {latestDraw && (
        <section className="section">
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="badge badge--gold" style={{ marginBottom: 8, display: 'inline-flex' }}>Latest Draw</span>
                <h2>{MONTHS[latestDraw.month - 1]} {latestDraw.year} Results</h2>
              </div>
              <Link to="/draws" className="btn btn--outline btn--sm">All Draws →</Link>
            </div>
            <div className="card" style={{ padding: 40 }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>Winning Numbers</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {latestDraw.winningNumbers.map((n, i) => (
                    <motion.div key={i} className="number-ball number-ball--gold"
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}>
                      {n}
                    </motion.div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
                {[
                  { label: 'Jackpot', val: `£${latestDraw.prizePool?.jackpot?.toFixed(2) || '0.00'}`, tier: '5 Match' },
                  { label: '4 Match Prize', val: `£${latestDraw.prizePool?.fourMatch?.toFixed(2) || '0.00'}`, tier: '' },
                  { label: '3 Match Prize', val: `£${latestDraw.prizePool?.threeMatch?.toFixed(2) || '0.00'}`, tier: '' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--gold-light)' }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Charities ────────────────────────────────────────────── */}
      {featuredCharities.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-deep)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span className="badge badge--green" style={{ marginBottom: 12, display: 'inline-flex' }}>Making a difference</span>
              <h2>Charities You <span style={{ color: 'var(--green-light)', fontStyle: 'italic' }}>Support</span></h2>
              <p style={{ marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>Choose from our curated list of charities. Your contribution goes directly to them every month.</p>
            </div>
            <div className="grid-3">
              {featuredCharities.map((c, i) => (
                <motion.div key={c._id} className="card"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--green-primary), #0a5c35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0,
                    }}>💚</div>
                    <div>
                      <h3 style={{ fontSize: 18, marginBottom: 2 }}>{c.name}</h3>
                      <span className="badge badge--grey" style={{ fontSize: 10 }}>{c.category}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, flex: 1 }}>{c.shortDesc || c.description.substring(0, 100)}…</p>
                  <Link to={`/charities/${c.slug || c._id}`} style={{ marginTop: 16, fontSize: 13, color: 'var(--green-light)', fontWeight: 600 }}>
                    Learn more →
                  </Link>
                </motion.div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <Link to="/charities" className="btn btn--outline">View All Charities</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Prize Pool CTA ────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(13,158,92,0.1) 0%, rgba(13,60,158,0.1) 100%)',
            border: '1px solid var(--border-green)',
            textAlign: 'center', padding: '64px 32px',
          }}>
            <span className="badge badge--green" style={{ marginBottom: 16, display: 'inline-flex' }}>Prize Pool Distribution</span>
            <h2 style={{ marginBottom: 16 }}>Where Your Subscription Goes</h2>
            <p style={{ maxWidth: 480, margin: '0 auto 40px' }}>50% of every subscription builds the prize pool. Your chosen charity receives at least 10%. Everyone wins something.</p>
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
              {[
                { label: 'Jackpot (5 Match)', pct: '40%', color: 'var(--gold-light)' },
                { label: '4 Match Pool',      pct: '35%', color: 'var(--green-light)' },
                { label: '3 Match Pool',      pct: '25%', color: '#93c5fd' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: item.color }}>{item.pct}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <Link to="/subscribe" className="btn btn--primary btn--lg">Join the Draw Today</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
