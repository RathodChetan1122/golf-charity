import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const SUB_BADGE = { active: 'badge--green', inactive: 'badge--grey', cancelled: 'badge--red', lapsed: 'badge--red', trialing: 'badge--blue' };

export default function AdminUsersPage() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan]     = useState('');
  const [page, setPage]     = useState(1);
  const LIMIT = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (plan)   params.set('plan', plan);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, status, plan]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>👥 User Management</h2>
          <p style={{ fontSize: 14 }}>{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input type="text" className="form-input" placeholder="🔍 Search name or email…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <select className="form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="lapsed">Lapsed</option>
        </select>
        <select className="form-select" value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">All Plans</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subscription</th>
              <th>Plan</th>
              <th>Charity</th>
              <th>Scores</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No users found</td></tr>
            ) : users.map((u, i) => (
              <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                  {!u.isActive && <span className="badge badge--red" style={{ fontSize: 9 }}>Deactivated</span>}
                </td>
                <td style={{ fontSize: 13 }}>{u.email}</td>
                <td><span className={`badge ${SUB_BADGE[u.subscription?.status] || 'badge--grey'}`} style={{ fontSize: 11 }}>{u.subscription?.status || 'none'}</span></td>
                <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{u.subscription?.plan || '—'}</td>
                <td style={{ fontSize: 13 }}>{u.selectedCharity?.name || '—'}</td>
                <td style={{ textAlign: 'center', fontWeight: 700 }}>{u.scores?.length || 0}/5</td>
                <td style={{ fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link to={`/admin/users/${u._id}`} className="btn btn--ghost btn--sm" style={{ padding: '5px 10px', fontSize: 12 }}>View</Link>
                    {u.isActive && (
                      <button onClick={() => handleDeactivate(u._id)} className="btn btn--ghost btn--sm" style={{ padding: '5px 8px', fontSize: 12, color: '#f87171' }}>✕</button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn--ghost btn--sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}
