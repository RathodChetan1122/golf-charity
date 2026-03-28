import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const TIER_LABEL = { fiveMatch: '5 Match 🏆', fourMatch: '4 Match', threeMatch: '3 Match' };
const TIER_COLOR = { fiveMatch: 'var(--gold-light)', fourMatch: 'var(--green-light)', threeMatch: '#93c5fd' };
const STATUS_BADGE = {
  pending:   'badge--grey',
  submitted: 'badge--blue',
  approved:  'badge--green',
  rejected:  'badge--red',
};
const PAY_BADGE = { pending: 'badge--grey', processing: 'badge--blue', paid: 'badge--green', failed: 'badge--red' };

export default function WinningsPage() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    api.get('/winners/my').then(r => setWinners(r.data.winners || [])).finally(() => setLoading(false));
  }, []);

  const totalWon    = winners.reduce((s, w) => s + (w.amount || 0), 0);
  const totalPaid   = winners.filter(w => w.paymentStatus === 'paid').reduce((s, w) => s + w.amount, 0);
  const totalPending = winners.filter(w => w.paymentStatus !== 'paid').reduce((s, w) => s + w.amount, 0);

  const handleProofUpload = async (winnerId, file) => {
    if (!file) return;
    setUploadingId(winnerId);
    const fd = new FormData();
    fd.append('proof', file);
    try {
      await api.post(`/winners/${winnerId}/upload-proof`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Proof submitted for review!');
      const res = await api.get('/winners/my');
      setWinners(res.data.winners || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 4 }}>🏆 My Winnings</h2>
        <p style={{ fontSize: 14 }}>All your prize wins, verification status, and payment history.</p>
      </div>

      {/* Summary stats */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Won',    value: `£${totalWon.toFixed(2)}`,    color: 'var(--gold-light)' },
          { label: 'Paid Out',     value: `£${totalPaid.toFixed(2)}`,   color: 'var(--green-light)' },
          { label: 'Pending',      value: `£${totalPending.toFixed(2)}`, color: 'var(--text-muted)' },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="stat-card__label">{s.label}</div>
            <div className="stat-card__value" style={{ color: s.color, fontSize: '1.8rem' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Winners list */}
      {winners.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎲</div>
          <h3 style={{ marginBottom: 8 }}>No wins yet</h3>
          <p>Keep entering draws — your time will come!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {winners.map((w, i) => (
            <motion.div key={w._id} className="card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: TIER_COLOR[w.tier], marginBottom: 4 }}>
                    £{w.amount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{w.draw?.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge--gold" style={{ fontSize: 11 }}>{TIER_LABEL[w.tier]}</span>
                    <span className={`badge ${STATUS_BADGE[w.verificationStatus]}`} style={{ fontSize: 11 }}>
                      Verification: {w.verificationStatus}
                    </span>
                    <span className={`badge ${PAY_BADGE[w.paymentStatus]}`} style={{ fontSize: 11 }}>
                      Payment: {w.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Matched numbers */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(w.matchedNumbers || []).map((n, j) => (
                    <div key={j} className="number-ball number-ball--sm number-ball--gold">{n}</div>
                  ))}
                </div>
              </div>

              {/* Proof upload section */}
              {w.verificationStatus === 'pending' && (
                <div style={{ padding: 16, background: 'rgba(212,168,83,0.06)', border: '1px dashed rgba(212,168,83,0.3)', borderRadius: 10 }}>
                  <p style={{ fontSize: 13, marginBottom: 12 }}>
                    📋 <strong style={{ color: 'var(--gold-light)' }}>Action required:</strong> Upload a screenshot of your scores from your golf platform to verify your win.
                  </p>
                  <label style={{ cursor: 'pointer' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => handleProofUpload(w._id, e.target.files[0])} />
                    <span className={`btn btn--outline btn--sm ${uploadingId === w._id ? '' : ''}`}>
                      {uploadingId === w._id ? '⏳ Uploading…' : '📎 Upload Proof'}
                    </span>
                  </label>
                </div>
              )}

              {w.verificationStatus === 'submitted' && (
                <div style={{ padding: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, fontSize: 13 }}>
                  🔍 <strong style={{ color: '#93c5fd' }}>Under review</strong> — our team is verifying your proof. You'll be notified once reviewed.
                </div>
              )}

              {w.verificationStatus === 'approved' && w.paymentStatus !== 'paid' && (
                <div style={{ padding: 12, background: 'rgba(13,158,92,0.06)', border: '1px solid var(--border-green)', borderRadius: 10, fontSize: 13 }}>
                  ✅ <strong style={{ color: 'var(--green-light)' }}>Verified!</strong> Your payment is being processed.
                </div>
              )}

              {w.verificationStatus === 'rejected' && (
                <div style={{ padding: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13 }}>
                  ❌ <strong style={{ color: '#f87171' }}>Verification rejected.</strong>
                  {w.rejectionReason && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>Reason: {w.rejectionReason}</span>}
                </div>
              )}

              {w.paymentStatus === 'paid' && (
                <div style={{ padding: 12, background: 'rgba(13,158,92,0.06)', border: '1px solid var(--border-green)', borderRadius: 10, fontSize: 13 }}>
                  💸 <strong style={{ color: 'var(--green-light)' }}>Paid on {new Date(w.paidAt).toLocaleDateString('en-GB')}</strong>
                  {w.paymentRef && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>Ref: {w.paymentRef}</span>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
