import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>⛳</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: 'var(--text-primary)' }}>
              Golf<span style={{ color: 'var(--green-light)' }}>Charity</span>
            </span>
          </Link>
          <h2 style={{ marginBottom: 8 }}>Welcome Back</h2>
          <p style={{ fontSize: 14 }}>Sign in to your account to continue</p>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14 }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--green-light)', fontWeight: 600 }}>Create one</Link>
            </p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div style={{ marginTop: 16, padding: 14, background: 'rgba(13,158,92,0.06)', border: '1px solid var(--border-green)', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Demo: <strong style={{ color: 'var(--text-secondary)' }}>user@golfcharity.com</strong> / <strong style={{ color: 'var(--text-secondary)' }}>User@1234</strong><br />
            Admin: <strong style={{ color: 'var(--text-secondary)' }}>admin@golfcharity.com</strong> / <strong style={{ color: 'var(--text-secondary)' }}>Admin@1234</strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
