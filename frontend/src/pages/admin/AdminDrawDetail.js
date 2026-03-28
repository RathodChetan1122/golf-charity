import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDrawDetail() {
  const { id } = useParams();
  const [draw, setDraw]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fetch = async () => {
    try {
      const { data } = await api.get(`/draws/${id}`);
      setDraw(data.draw);
    } catch { toast.error('Failed to load draw'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [id]);

  const handleSimulate = async () => {
    if (!window.confirm('Run draw simulation? This will generate winning numbers and score all participants.')) return;
    setSimulating(true);
    try {
      const { data } = await api.post(`/draws/${id}/simulate`);
      setDraw(data.draw);
      toast.success('Simulation complete — review results before publishing');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('⚠️ Publish draw? This will notify winners and is IRREVERSIBLE.')) return;
    setPublishing(true);
    try {
      const { data } = await api.post(`/draws/${id}/publish`);
      setDraw(data.draw);
      toast.success('Draw published and winners notified!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!draw) return <div>Draw not found. <Link to="/admin/draws">← Back</Link></div>;

  const isPublished  = draw.status === 'published';
  const isSimulating = draw.status === 'simulating';
  const hasNumbers   = draw.winningNumbers?.length > 0;

  return (
    <div>
      <Link to="/admin/draws" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        ← Back to Draws
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>{draw.title}</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="badge badge--grey" style={{ fontSize: 11 }}>{MONTHS[draw.month - 1]} {draw.year}</span>
            <span className="badge badge--blue" style={{ fontSize: 11 }}>{draw.drawType}</span>
            <span className={`badge badge--${isPublished ? 'green' : isSimulating ? 'blue' : 'grey'}`} style={{ fontSize: 11 }}>{draw.status}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!isPublished && (
            <button onClick={handleSimulate} className="btn btn--outline" disabled={simulating || isPublished}>
              {simulating ? '⏳ Simulating…' : '🔮 Run Simulation'}
            </button>
          )}
          {(isSimulating || hasNumbers) && !isPublished && (
            <button onClick={handlePublish} className="btn btn--primary" disabled={publishing}>
              {publishing ? '⏳ Publishing…' : '🚀 Publish Draw'}
            </button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Participants', value: draw.participantCount || 0, color: 'var(--text-primary)' },
          { label: 'Prize Pool',   value: `£${(draw.prizePool?.total || 0).toFixed(2)}`, color: 'var(--gold-light)' },
          { label: 'Jackpot',      value: `£${(draw.prizePool?.jackpot || 0).toFixed(2)}`, color: 'var(--gold-light)' },
          { label: 'Rolled Over',  value: `£${(draw.prizePool?.jackpotRolledOver || 0).toFixed(2)}`, color: draw.isJackpotRollover ? '#f87171' : 'var(--text-muted)' },
        ].map((s, i) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card__label">{s.label}</div>
            <div className="stat-card__value" style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Winning numbers */}
      {hasNumbers && (
        <motion.div className="card" style={{ marginBottom: 20 }}
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>🎯 Winning Numbers</h3>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            {draw.winningNumbers.map((n, i) => (
              <motion.div key={i} className="number-ball number-ball--gold"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}>
                {n}
              </motion.div>
            ))}
          </div>
          {isSimulating && !isPublished && (
            <div style={{ padding: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, fontSize: 13 }}>
              ⚠️ <strong style={{ color: '#93c5fd' }}>Simulation mode</strong> — These numbers are not yet published. Review results below, then click Publish.
            </div>
          )}
        </motion.div>
      )}

      {/* Results per tier */}
      {hasNumbers && (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {[
            { key: 'fiveMatch',  label: '🏆 5-Number Match (Jackpot)', pool: draw.prizePool?.jackpot,    color: 'var(--gold-light)'  },
            { key: 'fourMatch',  label: '🥈 4-Number Match',           pool: draw.prizePool?.fourMatch,  color: 'var(--green-light)' },
            { key: 'threeMatch', label: '🥉 3-Number Match',           pool: draw.prizePool?.threeMatch, color: '#93c5fd'           },
          ].map(tier => {
            const result   = draw.results?.[tier.key];
            const winners  = result?.winners || [];
            const perWinner = result?.prizePerWinner || 0;
            return (
              <div key={tier.key} className="card">
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{tier.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: tier.color, marginBottom: 4 }}>
                  £{(pool => pool?.toFixed(2) || '0.00')(tier.pool)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  {winners.length > 0 ? `${winners.length} winner${winners.length > 1 ? 's' : ''} · £${perWinner.toFixed(2)} each` : 'No winners'}
                </div>
                {winners.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {winners.map(w => (
                      <div key={w._id || w} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: tier.color }}>✓</span>
                        {w.firstName ? `${w.firstName} ${w.lastName}` : w._id || 'User'}
                      </div>
                    ))}
                  </div>
                ) : (
                  tier.key === 'fiveMatch' && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Jackpot rolls over to next month</div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!hasNumbers && draw.status === 'upcoming' && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔮</div>
          <h3 style={{ marginBottom: 8 }}>Ready to Simulate</h3>
          <p style={{ marginBottom: 20 }}>Click "Run Simulation" to generate winning numbers and score all active subscribers.<br />Review the results before publishing.</p>
          <button onClick={handleSimulate} className="btn btn--primary" disabled={simulating}>
            {simulating ? '⏳ Simulating…' : '🔮 Run Simulation Now'}
          </button>
        </div>
      )}

      {/* Notes */}
      {draw.notes && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--text-muted)' }}>Notes</h3>
          <p style={{ fontSize: 13 }}>{draw.notes}</p>
        </div>
      )}
    </div>
  );
}
