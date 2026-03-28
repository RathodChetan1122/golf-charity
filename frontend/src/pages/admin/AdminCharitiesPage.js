import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const CATEGORIES = ['health', 'education', 'environment', 'sports', 'community', 'other'];

const defaultForm = { name: '', description: '', shortDesc: '', category: 'other', website: '', isFeatured: false, isActive: true, order: 0 };

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(defaultForm);
  const [saving, setSaving]       = useState(false);

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/charities?limit=50');
      setCharities(data.charities || []);
    } catch { toast.error('Failed to load charities'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCharities(); }, []);

  const openCreate = () => { setForm(defaultForm); setEditId(null); setShowForm(true); };
  const openEdit   = (c) => { setForm({ name: c.name, description: c.description, shortDesc: c.shortDesc || '', category: c.category, website: c.website || '', isFeatured: c.isFeatured, isActive: c.isActive, order: c.order }); setEditId(c._id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/charities/${editId}`, form);
        toast.success('Charity updated!');
      } else {
        await api.post('/charities', form);
        toast.success('Charity created!');
      }
      setShowForm(false);
      fetchCharities();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this charity?')) return;
    try {
      await api.delete(`/charities/${id}`);
      toast.success('Charity deactivated');
      fetchCharities();
    } catch { toast.error('Failed'); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>💚 Charity Management</h2>
          <p style={{ fontSize: 14 }}>{charities.length} charities listed</p>
        </div>
        <button onClick={openCreate} className="btn btn--primary">+ Add Charity</button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div className="card" style={{ marginBottom: 24 }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>{editId ? 'Edit Charity' : 'Add New Charity'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Charity Name</label>
                <input type="text" className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input type="url" className="form-input" placeholder="https://…" value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input type="number" className="form-input" value={form.order} onChange={e => set('order', Number(e.target.value))} min={0} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Short Description (max 160 chars)</label>
              <input type="text" className="form-input" maxLength={160} value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Full Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} style={{ accentColor: 'var(--green-primary)' }} />
                Featured on homepage
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ accentColor: 'var(--green-primary)' }} />
                Active / Visible
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn--ghost">Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update Charity' : 'Create Charity'}</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Table */}
      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Featured</th>
                <th>Active</th>
                <th>Subscribers</th>
                <th>Raised</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {charities.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No charities yet</td></tr>
              ) : charities.map((c, i) => (
                <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td><span className="badge badge--grey" style={{ fontSize: 10, textTransform: 'capitalize' }}>{c.category}</span></td>
                  <td style={{ textAlign: 'center' }}>{c.isFeatured ? '⭐' : '—'}</td>
                  <td><span className={`badge badge--${c.isActive ? 'green' : 'red'}`} style={{ fontSize: 10 }}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ textAlign: 'center' }}>{c.totalSubscribers || 0}</td>
                  <td>£{(c.totalRaised || 0).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(c)} className="btn btn--ghost btn--sm" style={{ padding: '5px 10px', fontSize: 12 }}>✏️ Edit</button>
                      {c.isActive && <button onClick={() => handleDelete(c._id)} className="btn btn--ghost btn--sm" style={{ padding: '5px 8px', fontSize: 12, color: '#f87171' }}>✕</button>}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
