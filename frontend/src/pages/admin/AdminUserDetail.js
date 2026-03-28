import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [editScores, setEditScores] = useState(false);
  const [scores, setScores] = useState([]);
  const [savingScores, setSavingScores] = useState(false);

  const fetch = async () => {
    try {
      const { data } = await api.get(`/admin/users/${id}`);
      setUser(data.user);
      setScores(data.user.scores || []);
    } catch { toast.error('Failed to load user'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [id]);

  const handleSaveScores = async () => {
    setSavingScores(true);
    try {
      await api.put(`/admin/users/${id}/scores`, { scores });
      toast.success('Scores updated');
      setEditScores(false);
      fetch();
    } catch { toast.error('Failed'); }
    finally { setSavingScores(false); }
  };

  const handleToggleActive = async () => {
    try {
      await api.put(`/admin/users/${id}`, { isActive: !user.isActive });
      toast.success('User status updated');
      fetch();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <div>User not found. <Link to="/admin/users">← Back</Link></div>;

  const sub = user.subscription;
  const sortedScores = [...(user.scores || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <Link to="/admin/users" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        ← Back to Users
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>{user.firstName} {user.lastName}</h2>
          <p style={{ fontSize: 14 }}>{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleToggleActive} className={`btn btn--sm ${user.isActive ? 'btn--ghost' : 'btn--outline'}`}
            style={user.isActive ? { color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' } : {}}>
            {user.isActive ? '✕ Deactivate' : '✓ Reactivate'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Subscription info */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>💳 Subscription</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Status',   value: sub?.status || 'none' },
              { label: 'Plan',     value: sub?.plan || '—' },
              { label: 'Renews',   value: sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB') : '—' },
              { label: 'Stripe ID', value: sub?.stripeCustomerId || '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Charity info */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>💚 Charity</h3>
          {user.selectedCharity ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{user.selectedCharity.name}</div>
              <div style={{ fontSize: 13, color: 'var(--green-light)' }}>{user.charityContribution}% contribution</div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No charity selected</p>
          )}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Account info</div>
            <div style={{ fontSize: 13 }}>Joined: {new Date(user.createdAt).toLocaleDateString('en-GB')}</div>
            <div style={{ fontSize: 13 }}>Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-GB') : '—'}</div>
            <div style={{ fontSize: 13 }}>Total won: <strong style={{ color: 'var(--gold-light)' }}>£{(user.totalWon || 0).toFixed(2)}</strong></div>
          </div>
        </div>

        {/* Scores */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>⛳ Scores</h3>
            <button onClick={() => setEditScores(!editScores)} className="btn btn--ghost btn--sm">
              {editScores ? 'Cancel' : '✏️ Edit'}
            </button>
          </div>

          {editScores ? (
            <div>
              {scores.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                  <input type="number" min={1} max={45} value={s.value}
                    onChange={e => { const ns = [...scores]; ns[i] = { ...ns[i], value: Number(e.target.value) }; setScores(ns); }}
                    className="form-input" style={{ width: 80 }} />
                  <input type="date" value={new Date(s.date).toISOString().split('T')[0]}
                    onChange={e => { const ns = [...scores]; ns[i] = { ...ns[i], date: e.target.value }; setScores(ns); }}
                    className="form-input" style={{ flex: 1 }} />
                  <button onClick={() => setScores(scores.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
              ))}
              {scores.length < 5 && (
                <button onClick={() => setScores([...scores, { value: 30, date: new Date().toISOString().split('T')[0] }])}
                  className="btn btn--ghost btn--sm" style={{ marginBottom: 12 }}>+ Add Score</button>
              )}
              <button onClick={handleSaveScores} className="btn btn--primary btn--sm btn--full" disabled={savingScores}>
                {savingScores ? 'Saving…' : 'Save Scores'}
              </button>
            </div>
          ) : (
            sortedScores.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No scores entered</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedScores.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(s.date).toLocaleDateString('en-GB')}</span>
                    <div className="number-ball number-ball--sm">{s.value}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Draws entered */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>🎲 Draws Entered</h3>
          {(user.drawsEntered || []).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No draws entered yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {user.drawsEntered.slice(0, 8).map(d => (
                <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.title}</span>
                  <span className={`badge badge--${d.status === 'published' ? 'green' : 'grey'}`} style={{ fontSize: 10 }}>{d.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
