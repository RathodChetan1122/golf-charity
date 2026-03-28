import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function ScoresPage() {
  const { user, isSubscribed, refreshUser } = useAuth();
  const [scores, setScores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ value: '', date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/scores').then(r => setScores(r.data.scores || []));
  }, []);

  const openAdd = () => { setForm({ value: '', date: new Date().toISOString().split('T')[0] }); setEditId(null); setShowForm(true); };
  const openEdit = (s) => { setForm({ value: s.value, date: new Date(s.date).toISOString().split('T')[0] }); setEditId(s._id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSubscribed) { toast.error('Active subscription required'); return; }
    setLoading(true);
    try {
      let res;
      if (editId) {
        res = await api.put(`/scores/${editId}`, form);
        toast.success('Score updated!');
      } else {
        res = await api.post('/scores', form);
        toast.success('Score added!');
      }
      setScores(res.data.scores || []);
      setShowForm(false);
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this score?')) return;
    try {
      const res = await api.delete(`/scores/${id}`);
      setScores(res.data.scores || []);
      toast.success('Score deleted');
      refreshUser();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const sortedScores = [...scores].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>⛳ My Scores</h2>
          <p style={{ fontSize: 14 }}>Your last 5 Stableford scores (1–45). Adding a 6th automatically removes the oldest.</p>
        </div>
        <button onClick={openAdd} className="btn btn--primary" disabled={!isSubscribed}>
          + Add Score
        </button>
      </div>

      {!isSubscribed && (
        <div style={{ background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 24, fontSize: 14 }}>
          ⚡ <strong style={{ color: 'var(--gold-light)' }}>Active subscription required</strong> to add or edit scores.
        </div>
      )}

      {/* Scores grid */}
      {sortedScores.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⛳</div>
          <h3 style={{ marginBottom: 8 }}>No scores yet</h3>
          <p>Add your first Stableford score to start participating in draws.</p>
          {isSubscribed && <button onClick={openAdd} className="btn btn--primary" style={{ marginTop: 20 }}>Add First Score</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedScores.map((s, i) => (
            <motion.div key={s._id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px',
                borderRadius: 'var(--radius-md)',
                background: i === 0 ? 'rgba(13,158,92,0.06)' : 'var(--bg-card)',
                border: `1px solid ${i === 0 ? 'var(--border-green)' : 'var(--border)'}`,
              }}>
              {/* Rank */}
              <div style={{ minWidth: 28, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                {i === 0 ? '🏅' : `#${i + 1}`}
              </div>

              {/* Score ball */}
              <div className="number-ball" style={{ flexShrink: 0 }}>{s.value}</div>

              {/* Date */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {i === 0 && <div style={{ fontSize: 11, color: 'var(--green-light)', marginTop: 2, fontWeight: 600 }}>Latest Score</div>}
              </div>

              {/* Score label */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: s.value >= 35 ? 'var(--green-light)' : s.value >= 25 ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Stableford</div>
              </div>

              {/* Actions */}
              {isSubscribed && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(s)} className="btn btn--ghost btn--sm" style={{ padding: '6px 10px' }}>✏️</button>
                  <button onClick={() => handleDelete(s._id)} className="btn btn--ghost btn--sm" style={{ padding: '6px 10px', color: '#f87171' }}>🗑️</button>
                </div>
              )}
            </motion.div>
          ))}

          {/* Rolling window indicator */}
          {sortedScores.length >= 5 && (
            <div style={{ textAlign: 'center', padding: '8px', fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed var(--border)' }}>
              ℹ️ Maximum 5 scores stored. Adding a new score will remove the oldest one.
            </div>
          )}
        </div>
      )}

      {/* Score form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 36, width: '100%', maxWidth: 420 }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: 24 }}>{editId ? 'Edit Score' : 'Add New Score'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Stableford Score (1–45)</label>
                  <input type="number" className="form-input" min={1} max={45} placeholder="e.g. 32"
                    value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required />
                  {form.value && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Preview:</span>
                      <div className="number-ball number-ball--sm">{form.value}</div>
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 28 }}>
                  <label className="form-label">Round Date</label>
                  <input type="date" className="form-input"
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required
                    max={new Date().toISOString().split('T')[0]} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn--ghost" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn--primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? 'Saving…' : editId ? 'Update Score' : 'Add Score'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
