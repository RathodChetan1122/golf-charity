import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const VERIFY_BADGE = { pending: 'badge--grey', submitted: 'badge--blue', approved: 'badge--green', rejected: 'badge--red' };
const PAY_BADGE    = { pending: 'badge--grey', processing: 'badge--blue', paid: 'badge--green', failed: 'badge--red' };
const TIER_LABEL   = { fiveMatch: '5 Match 🏆', fourMatch: '4 Match', threeMatch: '3 Match' };

export default function AdminWinnersPage() {
  const [winners, setWinners]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [vStatus, setVStatus]   = useState('');
  const [pStatus, setPStatus]   = useState('');
  const [page, setPage]         = useState(1);
  const [activeWinner, setActiveWinner] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payRef, setPayRef]     = useState('');
  const [processing, setProcessing] = useState(false);
  const LIMIT = 20;

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (vStatus) params.set('status', vStatus);
      if (pStatus) params.set('paymentStatus', pStatus);
      const { data } = await api.get(`/winners?${params}`);
      setWinners(data.winners || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load winners'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWinners(); }, [page, vStatus, pStatus]);

  const handleVerify = async (id, action, reason = '') => {
    setProcessing(true);
    try {
      await api.put(`/winners/${id}/verify`, { action, rejectionReason: reason });
      toast.success(action === 'approve' ? 'Winner approved!' : 'Submission rejected');
      setActiveWinner(null);
      fetchWinners();
    } catch { toast.error('Failed'); }
    finally { setProcessing(false); }
  };

  const handleMarkPaid = async () => {
    if (!payModal) return;
    setProcessing(true);
    try {
      await api.put(`/winners/${payModal._id}/mark-paid`, { paymentRef: payRef, paymentNotes: '' });
      toast.success('Marked as paid!');
      setPayModal(null);
      setPayRef('');
      fetchWinners();
    } catch { toast.error('Failed'); }
    finally { setProcessing(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 4 }}>🏆 Winners Management</h2>
        <p style={{ fontSize: 14 }}>Verify proof submissions and track prize payments.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <select className="form-select" value={vStatus} onChange={e => { setVStatus(e.target.value); setPage(1); }} style={{ width: 180 }}>
          <option value="">All Verification</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted (Review)</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="form-select" value={pStatus} onChange={e => { setPStatus(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">All Payment</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Winner</th>
              <th>Draw</th>
              <th>Tier</th>
              <th>Amount</th>
              <th>Verification</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : winners.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No winners found</td></tr>
            ) : winners.map((w, i) => (
              <motion.tr key={w._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{w.user?.firstName} {w.user?.lastName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.user?.email}</div>
                </td>
                <td style={{ fontSize: 12 }}>{w.draw?.title || '—'}</td>
                <td><span className="badge badge--gold" style={{ fontSize: 10 }}>{TIER_LABEL[w.tier]}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--gold-light)' }}>£{w.amount.toFixed(2)}</td>
                <td><span className={`badge ${VERIFY_BADGE[w.verificationStatus]}`} style={{ fontSize: 10 }}>{w.verificationStatus}</span></td>
                <td><span className={`badge ${PAY_BADGE[w.paymentStatus]}`} style={{ fontSize: 10 }}>{w.paymentStatus}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {w.verificationStatus === 'submitted' && (
                      <button onClick={() => setActiveWinner(w)} className="btn btn--outline btn--sm" style={{ fontSize: 11, padding: '4px 10px' }}>
                        🔍 Review
                      </button>
                    )}
                    {w.verificationStatus === 'approved' && w.paymentStatus !== 'paid' && (
                      <button onClick={() => { setPayModal(w); setPayRef(''); }} className="btn btn--primary btn--sm" style={{ fontSize: 11, padding: '4px 10px' }}>
                        💸 Mark Paid
                      </button>
                    )}
                    {w.proofImageUrl && (
                      <a href={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${w.proofImageUrl}`} target="_blank" rel="noopener noreferrer"
                        className="btn btn--ghost btn--sm" style={{ fontSize: 11, padding: '4px 8px' }}>📎</a>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Page {page} of {totalPages}</span>
          <button className="btn btn--ghost btn--sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      {/* Review modal */}
      <AnimatePresence>
        {activeWinner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
            onClick={() => setActiveWinner(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 32, width: '100%', maxWidth: 480 }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: 4 }}>Review Proof Submission</h3>
              <p style={{ fontSize: 13, marginBottom: 20 }}>{activeWinner.user?.firstName} {activeWinner.user?.lastName} · £{activeWinner.amount.toFixed(2)}</p>

              {activeWinner.proofImageUrl && (
                <div style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${activeWinner.proofImageUrl}`}
                    alt="Proof" style={{ width: '100%', display: 'block' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setActiveWinner(null)}>Close</button>
                <button className="btn btn--danger btn--sm" style={{ flex: 1 }} onClick={() => {
                  const r = prompt('Rejection reason (optional):') || '';
                  handleVerify(activeWinner._id, 'reject', r);
                }} disabled={processing}>✕ Reject</button>
                <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => handleVerify(activeWinner._id, 'approve')} disabled={processing}>
                  ✓ Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark paid modal */}
      <AnimatePresence>
        {payModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
            onClick={() => setPayModal(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 32, width: '100%', maxWidth: 420 }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: 4 }}>Mark as Paid</h3>
              <p style={{ fontSize: 13, marginBottom: 20 }}>
                {payModal.user?.firstName} {payModal.user?.lastName} · <strong style={{ color: 'var(--gold-light)' }}>£{payModal.amount.toFixed(2)}</strong>
              </p>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Payment Reference (optional)</label>
                <input type="text" className="form-input" placeholder="e.g. Bank transfer ref, PayPal ID…"
                  value={payRef} onChange={e => setPayRef(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setPayModal(null)}>Cancel</button>
                <button className="btn btn--primary" style={{ flex: 2 }} onClick={handleMarkPaid} disabled={processing}>
                  {processing ? 'Processing…' : '💸 Confirm Payment'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
