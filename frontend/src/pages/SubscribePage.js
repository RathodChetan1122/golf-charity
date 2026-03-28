import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '£9.99',
    period: '/month',
    badge: '',
    features: [
      'One draw entry per month',
      'Stableford score tracking',
      'Charity contribution (min 10%)',
      'Monthly prize pool access',
      'Winner verification portal',
    ],
    cta: 'Start Monthly',
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '£99.99',
    period: '/year',
    badge: '🔥 Best Value',
    savingsNote: 'Save £19.89 vs monthly',
    features: [
      'Everything in Monthly',
      'Priority draw entry',
      'Annual score history',
      '2 months free effectively',
      'Early access to features',
    ],
    cta: 'Start Yearly',
    highlight: true,
  },
];

export default function SubscribePage() {
  const { isAuthenticated, isSubscribed, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) { navigate('/register'); return; }
    if (isSubscribed) { toast.success('You already have an active subscription!'); navigate('/dashboard'); return; }

    setLoading(planId);
    try {
      const { data } = await api.post('/payments/create-checkout', { plan: planId });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <div style={{ padding: '60px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          {paymentStatus === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'inline-block', marginBottom: 24, padding: '12px 24px', background: 'rgba(13,158,92,0.1)', border: '1px solid var(--green-primary)', borderRadius: 12 }}>
              <span style={{ color: 'var(--green-light)', fontWeight: 600 }}>✅ Payment successful — welcome aboard!</span>
            </motion.div>
          )}
          <span className="badge badge--green" style={{ marginBottom: 16, display: 'inline-flex' }}>Subscription Plans</span>
          <h2 style={{ marginBottom: 14 }}>Choose Your Plan</h2>
          <p style={{ maxWidth: 480, margin: '0 auto', fontSize: 16 }}>
            Every subscriber enters the monthly draw. Every subscription supports charity. Pick the plan that works for you.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 24, maxWidth: 760, margin: '0 auto' }}>
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{
                background: plan.highlight ? 'linear-gradient(160deg, rgba(13,158,92,0.12), rgba(13,60,92,0.1))' : 'var(--bg-card)',
                border: `1px solid ${plan.highlight ? 'var(--green-primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: '36px 32px',
                position: 'relative',
                boxShadow: plan.highlight ? '0 0 40px rgba(13,158,92,0.15)' : 'none',
              }}>
              {plan.badge && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                  <span className="badge badge--green" style={{ fontSize: 12, padding: '4px 16px' }}>{plan.badge}</span>
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, color: 'var(--text-primary)' }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{plan.period}</span>
                </div>
                {plan.savingsNote && (
                  <div style={{ marginTop: 4, fontSize: 13, color: 'var(--green-light)', fontWeight: 600 }}>💰 {plan.savingsNote}</div>
                )}
              </div>

              <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--green-light)', fontSize: 16, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`btn btn--full btn--lg ${plan.highlight ? 'btn--primary' : 'btn--outline'}`}
                disabled={loading === plan.id || isSubscribed}>
                {loading === plan.id ? 'Redirecting…' : isSubscribed ? '✅ Already Subscribed' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Prize pool breakdown */}
        <div style={{ marginTop: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h3>How Every Subscription Is Used</h3>
          </div>
          <div className="grid-3" style={{ maxWidth: 760, margin: '0 auto' }}>
            {[
              { label: 'Prize Pool', pct: '50%', desc: 'Jackpot (40%), 4-Match (35%), 3-Match (25%)', color: 'var(--gold-light)' },
              { label: 'Charity', pct: '10%+', desc: 'Goes directly to your chosen charity each month', color: 'var(--green-light)' },
              { label: 'Platform', pct: '40%-', desc: 'Operations, payment processing, and development', color: '#93c5fd' },
            ].map(item => (
              <div key={item.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: item.color, marginBottom: 8 }}>{item.pct}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{item.label}</div>
                <p style={{ fontSize: 13 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Auth prompt */}
        {!isAuthenticated && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <p style={{ fontSize: 14 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--green-light)', fontWeight: 600 }}>Sign in to subscribe</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
