import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function CharityPickPage() {
  const { user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [selected, setSelected] = useState(user?.selectedCharity?._id || '');
  const [contribution, setContribution] = useState(user?.charityContribution || 10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/charities?limit=50').then(r => setCharities(r.data.charities || []));
  }, []);

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.shortDesc || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/users/charity', { charityId: selected, charityContribution: contribution });
      await refreshUser();
      toast.success('Charity preference saved!');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 4 }}>💚 Choose Your Charity</h2>
        <p style={{ fontSize: 14 }}>Select which charity receives your monthly contribution. Minimum 10% of your subscription.</p>
      </div>

      {/* Current selection summary */}
      {user?.selectedCharity && (
        <div style={{ marginBottom: 24, padding: '16px 20px', background: 'rgba(13,158,92,0.06)', border: '1px solid var(--border-green)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 24 }}>💚</span>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>Currently supporting</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{user.selectedCharity.name}</div>
            <div style={{ fontSize: 12, color: 'var(--green-light)', marginTop: 1 }}>{user.charityContribution}% of subscription</div>
          </div>
        </div>
      )}

      {/* Contribution slider */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, marginBottom: 16 }}>Your Contribution Level</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: 'var(--green-light)', minWidth: 80 }}>
            {contribution}%
          </div>
          <div style={{ flex: 1 }}>
            <input type="range" min={10} max={100} step={5} value={contribution}
              onChange={e => setContribution(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--green-primary)', height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>10% minimum</span><span>100%</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          At <strong style={{ color: 'var(--green-light)' }}>{contribution}%</strong>, a monthly subscriber contributes approximately <strong style={{ color: 'var(--text-primary)' }}>£{(9.99 * contribution / 100).toFixed(2)}/month</strong> to their chosen charity.
        </p>
      </div>

      {/* Search */}
      <input type="text" className="form-input" placeholder="🔍 Search charities…"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16 }} />

      {/* Charity list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto', paddingRight: 4, marginBottom: 24 }}>
        {filtered.map((c, i) => (
          <motion.label key={c._id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${selected === c._id ? 'var(--green-primary)' : 'var(--border)'}`,
              background: selected === c._id ? 'rgba(13,158,92,0.08)' : 'var(--bg-card)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            <input type="radio" name="charity" value={c._id} checked={selected === c._id}
              onChange={() => setSelected(c._id)} style={{ accentColor: 'var(--green-primary)', width: 18, height: 18 }} />
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, rgba(13,158,92,0.2), rgba(13,60,92,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              💚
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                {c.isFeatured && <span className="badge badge--gold" style={{ fontSize: 9, padding: '1px 6px' }}>Featured</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.shortDesc || c.category}</div>
            </div>
            {selected === c._id && (
              <div style={{ color: 'var(--green-light)', fontSize: 20 }}>✓</div>
            )}
          </motion.label>
        ))}
      </div>

      <button onClick={handleSave} className="btn btn--primary btn--lg" disabled={loading || !selected}>
        {loading ? 'Saving…' : '💚 Save Charity Preference'}
      </button>
    </div>
  );
}
