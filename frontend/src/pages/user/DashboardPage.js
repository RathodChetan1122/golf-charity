import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const { user, isSubscribed, refreshUser } = useAuth();
  const [latestDraw, setLatestDraw] = useState(null);
  const [myWinnings, setMyWinnings] = useState([]);

  useEffect(() => {
    refreshUser();
    api.get('/draws/latest').then(r => setLatestDraw(r.data.draw)).catch(() => {});
    api.get('/winners/my').then(r => setMyWinnings(r.data.winners || [])).catch(() => {});
  }, []);

  const sub = user?.subscription;
  const scores = [...(user?.scores || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 6 }}>Welcome back, {user?.firstName} 👋</h2>
        <p style={{ fontSize: 14 }}>Here's your Golf Charity overview</p>
      </div>

      {/* Subscription alert */}
      {!isSubscribed && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.3)',
            borderRadius: 'var(--radius-md)', padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12, marginBottom: 28,
          }}>
          <div>
            <span style={{ color: 'var(--gold-light)', fontWeight: 600, fontSize: 14 }}>⚡ No active subscription</span>
            <p style={{ fontSize: 13, marginTop: 2 }}>Subscribe to enter the monthly draw and track your Stableford scores.</p>
          </div>
          <Link to="/subscribe" className="btn btn--primary btn--sm">Subscribe Now →</Link>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Subscription', value: isSubscribed ? '✅ Active' : '❌ Inactive', sub: sub?.plan ? `${sub.plan} plan` : '', color: isSubscribed ? 'var(--green-light)' : '#f87171' },
          { label: 'Scores Entered', value: scores.length, sub: '/ 5 max', color: 'var(--text-primary)' },
          { label: 'Total Winnings', value: `£${(user?.totalWon || 0).toFixed(2)}`, sub: 'all time', color: 'var(--gold-light)' },
          { label: 'Draws Entered', value: user?.drawsEntered?.length || 0, sub: 'total', color: 'var(--text-primary)' },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="stat-card"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="stat-card__label">{stat.label}</div>
            <div className="stat-card__value" style={{ color: stat.color, fontSize: '1.7rem' }}>{stat.value}</div>
            <div className="stat-card__sub">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Scores */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18 }}>⛳ My Scores</h3>
            <Link to="/dashboard/scores" className="btn btn--ghost btn--sm">Manage →</Link>
          </div>
          {scores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: 12 }}>No scores yet</p>
              <Link to="/dashboard/scores" className="btn btn--outline btn--sm">Add First Score</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scores.map((s, i) => (
                <div key={s._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 8,
                  background: i === 0 ? 'rgba(13,158,92,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === 0 ? 'var(--border-green)' : 'var(--border)'}`,
                }}>
                  <div>
                    {i === 0 && <span style={{ fontSize: 10, color: 'var(--green-light)', fontWeight: 700, marginRight: 6 }}>LATEST</span>}
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="number-ball number-ball--sm">{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest draw */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18 }}>🎲 Latest Draw</h3>
            <Link to="/draws" className="btn btn--ghost btn--sm">All draws →</Link>
          </div>
          {!latestDraw ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <p>No draws published yet</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
                {MONTHS[latestDraw.month - 1]} {latestDraw.year}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Winning Numbers</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {latestDraw.winningNumbers.map((n, i) => (
                    <div key={i} className="number-ball number-ball--gold number-ball--sm">{n}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { t: 'Jackpot', v: latestDraw.prizePool?.jackpot },
                  { t: '4-Match', v: latestDraw.prizePool?.fourMatch },
                  { t: '3-Match', v: latestDraw.prizePool?.threeMatch },
                ].map(p => (
                  <div key={p.t} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.t}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-light)' }}>£{(p.v || 0).toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Charity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18 }}>💚 My Charity</h3>
            <Link to="/dashboard/charity" className="btn btn--ghost btn--sm">Change →</Link>
          </div>
          {user?.selectedCharity ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, rgba(13,158,92,0.2), rgba(13,60,92,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💚</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{user.selectedCharity.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your contribution: <span style={{ color: 'var(--green-light)', fontWeight: 700 }}>{user.charityContribution}%</span></div>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${user.charityContribution}%`, background: 'linear-gradient(90deg, var(--green-primary), var(--green-light))' }} />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: 12 }}>No charity selected yet</p>
              <Link to="/dashboard/charity" className="btn btn--outline btn--sm">Choose a Charity</Link>
            </div>
          )}
        </div>

        {/* Recent winnings */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18 }}>🏆 Recent Wins</h3>
            <Link to="/dashboard/winnings" className="btn btn--ghost btn--sm">All →</Link>
          </div>
          {myWinnings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <p>No wins yet — keep entering!</p>
            </div>
          ) : (
            myWinnings.slice(0, 3).map(w => (
              <div key={w._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{w.draw?.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{w.tier === 'fiveMatch' ? '5 Match' : w.tier === 'fourMatch' ? '4 Match' : '3 Match'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold-light)' }}>£{w.amount.toFixed(2)}</div>
                  <span className={`badge badge--${w.paymentStatus === 'paid' ? 'green' : 'gold'}`} style={{ fontSize: 9, marginTop: 2 }}>{w.paymentStatus}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`@media(max-width:640px){.grid-4{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  );
}
