import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_BADGE = { upcoming: 'badge--grey', simulating: 'badge--blue', published: 'badge--green', closed: 'badge--red' };

export default function AdminDrawsPage() {
  const [draws, setDraws]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(() => {
    const now = new Date();
    return { title: `${MONTHS[now.getMonth()]} ${now.getFullYear()} Monthly Draw`, month: now.getMonth() + 1, year: now.getFullYear(), drawType: 'random', notes: '' };
  });

  const fetchDraws = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/draws/admin/all');
      setDraws(data.draws || []);
    } catch { toast.error('Failed to load draws'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDraws(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/draws', form);
      toast.success('Draw created!');
      setShowCreate(false);
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create draw');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draw?')) return;
    try {
      await api.delete(`/draws/${id}`);
      toast.success('Draw deleted');
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete published draw');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>🎲 Draw Management</h2>
          <p style={{ fontSize: 14 }}>Create, simulate, and publish monthly draws.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn--primary">
          {showCreate ? '✕ Cancel' : '+ New Draw'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div className="card" style={{ marginBottom: 24 }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Create New Draw</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Draw Title</label>
                <input type="text" className="form-input" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Month</label>
                <select className="form-select" value={form.month} onChange={e => setForm({ ...form, month: Number(e.target.value) })}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input type="number" className="form-input" value={form.year}
                  onChange={e => setForm({ ...form, year: Number(e.target.value) })} min={2024} max={2030} />
              </div>
              <div className="form-group">
                <label className="form-label">Draw Type</label>
                <select className="form-select" value={form.drawType} onChange={e => setForm({ ...form, drawType: e.target.value })}>
                  <option value="random">Random (Standard Lottery)</option>
                  <option value="algorithmic">Algorithmic (Score-Weighted)</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ minHeight: 60 }} />
            </div>
            <button type="submit" className="btn btn--primary btn--sm" disabled={creating}>
              {creating ? 'Creating…' : 'Create Draw'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Draws list */}
      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : draws.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎲</div>
          <h3 style={{ marginBottom: 8 }}>No draws yet</h3>
          <p>Create your first draw to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {draws.map((draw, i) => (
            <motion.div key={draw._id} className="card"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 17 }}>{draw.title}</h3>
                    <span className={`badge ${STATUS_BADGE[draw.status]}`} style={{ fontSize: 11 }}>{draw.status}</span>
                    {draw.isJackpotRollover && <span className="badge badge--gold" style={{ fontSize: 11 }}>🔁 Rollover</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>📅 {MONTHS[draw.month - 1]} {draw.year}</span>
                    <span>🎯 {draw.drawType}</span>
                    <span>👥 {draw.participantCount} participants</span>
                    {draw.prizePool?.total > 0 && <span>💷 £{draw.prizePool.total.toFixed(2)} pool</span>}
                  </div>
                  {draw.winningNumbers?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {draw.winningNumbers.map((n, j) => (
                        <div key={j} className="number-ball number-ball--sm number-ball--gold">{n}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link to={`/admin/draws/${draw._id}`} className="btn btn--outline btn--sm">
                    {draw.status === 'upcoming' ? '⚙️ Manage' : '👁 View'}
                  </Link>
                  {draw.status !== 'published' && (
                    <button onClick={() => handleDelete(draw._id)} className="btn btn--ghost btn--sm" style={{ color: '#f87171' }}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
