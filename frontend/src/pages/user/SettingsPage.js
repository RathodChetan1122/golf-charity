import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', emailNotifications: user?.emailNotifications ?? true });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading]           = useState(false);
  const [cancelLoading, setCancelLoading]   = useState(false);

  const sub = user?.subscription;
  const isSubscribed = sub?.status === 'active';

  const handleProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.put('/auth/update-profile', profileForm);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You will retain access until the end of the billing period.')) return;
    setCancelLoading(true);
    try {
      await api.post('/payments/cancel-subscription');
      await refreshUser();
      toast.success('Subscription will cancel at end of period');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivate = async () => {
    setCancelLoading(true);
    try {
      await api.post('/payments/reactivate');
      await refreshUser();
      toast.success('Subscription reactivated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 4 }}>⚙️ Settings</h2>
        <p style={{ fontSize: 14 }}>Manage your account, password, and subscription.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Subscription status */}
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontSize: 17, marginBottom: 20 }}>💳 Subscription</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Status',      value: sub?.status || 'inactive',       color: isSubscribed ? 'var(--green-light)' : '#f87171' },
              { label: 'Plan',        value: sub?.plan || '—',                 color: 'var(--text-primary)' },
              { label: 'Renews',      value: sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB') : '—', color: 'var(--text-primary)' },
              { label: 'Auto-Renew',  value: sub?.cancelAtPeriodEnd ? 'No — cancels' : 'Yes', color: sub?.cancelAtPeriodEnd ? '#f87171' : 'var(--green-light)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color, textTransform: 'capitalize' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {isSubscribed && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {sub?.cancelAtPeriodEnd ? (
                <button onClick={handleReactivate} className="btn btn--primary btn--sm" disabled={cancelLoading}>
                  {cancelLoading ? 'Processing…' : '🔄 Reactivate Subscription'}
                </button>
              ) : (
                <button onClick={handleCancel} className="btn btn--ghost btn--sm" disabled={cancelLoading}
                  style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}>
                  {cancelLoading ? 'Processing…' : '✕ Cancel Subscription'}
                </button>
              )}
            </div>
          )}

          {!isSubscribed && (
            <a href="/subscribe" className="btn btn--primary btn--sm" style={{ display: 'inline-block', textDecoration: 'none' }}>
              ⚡ Subscribe Now
            </a>
          )}
        </motion.div>

        {/* Profile */}
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h3 style={{ fontSize: 17, marginBottom: 20 }}>👤 Profile</h3>
          <form onSubmit={handleProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" className="form-input" value={profileForm.firstName}
                  onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-input" value={profileForm.lastName}
                  onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={user?.email} disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={profileForm.emailNotifications}
                  onChange={e => setProfileForm({ ...profileForm, emailNotifications: e.target.checked })}
                  style={{ accentColor: 'var(--green-primary)', width: 16, height: 16 }} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Receive email notifications for draw results and winners</span>
              </label>
            </div>
            <button type="submit" className="btn btn--primary btn--sm" disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </motion.div>

        {/* Password */}
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <h3 style={{ fontSize: 17, marginBottom: 20 }}>🔐 Change Password</h3>
          <form onSubmit={handlePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={pwForm.newPassword}
                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={pwForm.confirmPassword}
                onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn--outline btn--sm" disabled={pwLoading}>
              {pwLoading ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
