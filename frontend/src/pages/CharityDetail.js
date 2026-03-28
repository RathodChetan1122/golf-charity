import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';

export default function CharityDetail() {
  const { id } = useParams();
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/charities/${id}`).then(r => setCharity(r.data.charity)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!charity) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}><h2>Charity not found</h2><Link to="/charities" className="btn btn--outline" style={{ marginTop: 20 }}>← Back to Charities</Link></div>;

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <Link to="/charities" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Back to Charities
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 16,
              background: 'linear-gradient(135deg, var(--green-primary), #0a5c35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0,
            }}>💚</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className="badge badge--grey" style={{ fontSize: 11 }}>{charity.category}</span>
                {charity.isFeatured && <span className="badge badge--gold" style={{ fontSize: 11 }}>⭐ Featured Partner</span>}
              </div>
              <h1 style={{ marginBottom: 8 }}>{charity.name}</h1>
              {charity.website && (
                <a href={charity.website} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: 'var(--green-light)' }}>🌐 {charity.website}</a>
              )}
            </div>
            <Link to="/subscribe" className="btn btn--primary">Support This Charity</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
            {/* Description */}
            <div>
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16 }}>About {charity.name}</h3>
                <p style={{ lineHeight: 1.8 }}>{charity.description}</p>
              </div>

              {/* Events */}
              {charity.events?.length > 0 && (
                <div className="card">
                  <h3 style={{ marginBottom: 20 }}>Upcoming Events</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {charity.events.map((ev, i) => (
                      <div key={i} style={{ display: 'flex', gap: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ textAlign: 'center', minWidth: 48 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { month: 'short' }) : ''}
                          </div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                            {ev.date ? new Date(ev.date).getDate() : '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{ev.title}</div>
                          {ev.location && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {ev.location}</div>}
                          {ev.description && <p style={{ fontSize: 13, marginTop: 6 }}>{ev.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats sidebar */}
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Impact</h4>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Raised</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--green-light)' }}>
                    £{(charity.totalRaised || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Active Supporters</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>
                    {charity.totalSubscribers || 0}
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(13,158,92,0.08), transparent)' }}>
                <h4 style={{ fontSize: 15, marginBottom: 10 }}>Support {charity.name}</h4>
                <p style={{ fontSize: 13, marginBottom: 16 }}>Subscribe and choose this charity to start contributing every month.</p>
                <Link to="/subscribe" className="btn btn--primary btn--full btn--sm">Subscribe Now →</Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
