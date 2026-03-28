import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';

const CATEGORIES = ['all', 'health', 'education', 'environment', 'sports', 'community', 'other'];

export default function CharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 50 });
    if (search) params.set('search', search);
    if (category !== 'all') params.set('category', category);
    api.get(`/charities?${params}`).then(r => {
      setCharities(r.data.charities || []);
    }).finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge--green" style={{ marginBottom: 12, display: 'inline-flex' }}>Our Partners</span>
          <h1 style={{ marginBottom: 14 }}>Charities We <span style={{ color: 'var(--green-light)', fontStyle: 'italic' }}>Support</span></h1>
          <p style={{ maxWidth: 520, margin: '0 auto' }}>Every subscriber chooses a charity. Every month, your contribution goes directly to them.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40, alignItems: 'center' }}>
          <input type="text" className="form-input" placeholder="🔍 Search charities…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300, flex: 1, minWidth: 200 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`btn btn--sm ${category === c ? 'btn--primary' : 'btn--ghost'}`}
                style={{ textTransform: 'capitalize' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <div className="grid-3">
            {charities.map((c, i) => (
              <motion.div key={c._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                {c.isFeatured && <span className="badge badge--gold" style={{ marginBottom: 12, alignSelf: 'flex-start', fontSize: 10 }}>⭐ Featured</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(13,158,92,0.2), rgba(13,60,92,0.2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
                  }}>💚</div>
                  <div>
                    <h3 style={{ fontSize: 17, marginBottom: 4 }}>{c.name}</h3>
                    <span className="badge badge--grey" style={{ fontSize: 10 }}>{c.category}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, flex: 1, lineHeight: 1.7 }}>
                  {c.shortDesc || c.description?.substring(0, 120)}…
                </p>
                {c.totalRaised > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total raised: </span>
                    <span style={{ color: 'var(--green-light)', fontWeight: 700 }}>£{c.totalRaised.toFixed(2)}</span>
                  </div>
                )}
                <Link to={`/charities/${c.slug || c._id}`}
                  className="btn btn--outline btn--sm btn--full" style={{ marginTop: 16, display: 'block', textAlign: 'center' }}>
                  View Charity →
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && charities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p>No charities found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
