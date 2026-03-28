import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    selectedCharity: '', charityContribution: 10,
  });

  useEffect(() => {
    api.get('/charities?limit=20').then(r => setCharities(r.data.charities || [])).catch(() => {});
  }, []);

  const handleStep1 = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      toast.success('Account created! Welcome to Golf Charity 🎉');
      navigate('/subscribe');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
            <span style={{ fontSize: 26 }}>⛳</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: 'var(--text-primary)' }}>
              Golf<span style={{ color: 'var(--green-light)' }}>Charity</span>
            </span>
          </Link>
          <h2 style={{ marginBottom: 6 }}>Create Your Account</h2>
          <p style={{ fontSize: 14 }}>Join hundreds of golfers making a difference</p>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: step >= s ? 'var(--green-primary)' : 'var(--bg-card)',
                  color: step >= s ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${step >= s ? 'var(--green-primary)' : 'var(--border)'}`,
                }}>{s}</div>
                {s < 2 && <div style={{ width: 32, height: 1, background: step > s ? 'var(--green-primary)' : 'var(--border)' }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 36 }}>
          {step === 1 && (
            <form onSubmit={handleStep1}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-input" placeholder="John" value={form.firstName}
                    onChange={e => set('firstName', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-input" placeholder="Birdie" value={form.lastName}
                    onChange={e => set('lastName', e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@example.com" value={form.email}
                  onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="At least 6 characters" value={form.password}
                  onChange={e => set('password', e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 28 }}>
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" placeholder="Repeat password" value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)} required />
              </div>
              <button type="submit" className="btn btn--primary btn--full">Next — Choose Charity →</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h3 style={{ fontSize: 18, marginBottom: 6 }}>Choose Your Charity</h3>
              <p style={{ fontSize: 13, marginBottom: 20 }}>At least 10% of your subscription goes to your chosen charity. You can change this anytime.</p>

              {/* Charity grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', marginBottom: 20, paddingRight: 4 }}>
                {charities.map(c => (
                  <label key={c._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${form.selectedCharity === c._id ? 'var(--green-primary)' : 'var(--border)'}`,
                    background: form.selectedCharity === c._id ? 'rgba(13,158,92,0.08)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="charity" value={c._id}
                      checked={form.selectedCharity === c._id}
                      onChange={() => set('selectedCharity', c._id)}
                      style={{ accentColor: 'var(--green-primary)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.shortDesc}</div>
                    </div>
                  </label>
                ))}
                {charities.length === 0 && (
                  <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-muted)' }}>You can choose a charity from your dashboard after signing up.</p>
                )}
              </div>

              {/* Contribution % */}
              <div className="form-group" style={{ marginBottom: 28 }}>
                <label className="form-label">Your Contribution: <span style={{ color: 'var(--green-light)' }}>{form.charityContribution}%</span></label>
                <input type="range" min={10} max={100} step={5} value={form.charityContribution}
                  onChange={e => set('charityContribution', Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--green-primary)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>10% (min)</span><span>100%</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn--ghost" style={{ flex: 1 }}>← Back</button>
                <button type="submit" className="btn btn--primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account 🎉'}
                </button>
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--green-light)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
