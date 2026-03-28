import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DrawsPage() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/draws').then(r => setDraws(r.data.draws || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span className="badge badge--gold" style={{ marginBottom: 12, display: 'inline-flex' }}>Monthly Draws</span>
          <h1 style={{ marginBottom: 14 }}>Draw <span style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>Results</span></h1>
          <p style={{ maxWidth: 480, margin: '0 auto' }}>Published every month. Match 3, 4 or all 5 numbers to win your share of the prize pool.</p>
        </div>

        {draws.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
            <h3>No draws published yet</h3>
            <p style={{ marginTop: 8 }}>Check back after the first monthly draw!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {draws.map((draw, i) => (
              <motion.div key={draw._id} className="card"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{draw.title}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="badge badge--green" style={{ fontSize: 11 }}>Published</span>
                      {draw.isJackpotRollover && <span className="badge badge--gold" style={{ fontSize: 11 }}>🔁 Jackpot Rolled Over</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {draw.publishedAt ? new Date(draw.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {draw.participantCount} participants
                    </div>
                  </div>
                </div>

                {/* Winning numbers */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Winning Numbers</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {draw.winningNumbers.map((n, j) => (
                      <div key={j} className="number-ball number-ball--gold">{n}</div>
                    ))}
                  </div>
                </div>

                {/* Prize breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
                  {[
                    { label: 'Jackpot (5)', amount: draw.prizePool?.jackpot, winners: draw.results?.fiveMatch?.winners?.length || 0, rolled: draw.isJackpotRollover },
                    { label: '4 Match',     amount: draw.prizePool?.fourMatch,  winners: draw.results?.fourMatch?.winners?.length  || 0 },
                    { label: '3 Match',     amount: draw.prizePool?.threeMatch, winners: draw.results?.threeMatch?.winners?.length || 0 },
                  ].map(tier => (
                    <div key={tier.label} style={{
                      padding: '14px 16px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{tier.label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--gold-light)' }}>
                        £{(tier.amount || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {tier.rolled ? '🔁 Rolled over' : tier.winners > 0 ? `${tier.winners} winner${tier.winners > 1 ? 's' : ''}` : 'No winners'}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
