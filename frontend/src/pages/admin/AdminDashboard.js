import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data.stats)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!stats)  return <div>Failed to load stats.</div>;

  const growthLabels = (stats.monthlyGrowth || []).map(g => `${MONTH_NAMES[g._id.month - 1]} ${g._id.year}`);
  const growthData   = (stats.monthlyGrowth || []).map(g => g.count);

  const charityNames  = (stats.charityStats || []).map(c => c.name);
  const charityCount  = (stats.charityStats || []).map(c => c.count);

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#8899b0', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#8899b0', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 4 }}>📊 Admin Dashboard</h2>
        <p style={{ fontSize: 14 }}>Platform overview and key metrics.</p>
      </div>

      {/* KPI cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Users',       value: stats.totalUsers,          icon: '👥', color: 'var(--text-primary)', link: '/admin/users' },
          { label: 'Active Subscribers',value: stats.activeSubscribers,   icon: '✅', color: 'var(--green-light)', link: '/admin/users' },
          { label: 'Total Revenue',     value: `£${(stats.totalRevenue || 0).toFixed(2)}`, icon: '💷', color: 'var(--gold-light)', link: null },
          { label: 'Pending Verif.',    value: stats.pendingWinners,      icon: '🔍', color: stats.pendingWinners > 0 ? '#f87171' : 'var(--text-muted)', link: '/admin/winners' },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ cursor: s.link ? 'pointer' : 'default' }}
            onClick={() => s.link && window.location.assign(s.link)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="stat-card__label">{s.label}</div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div className="stat-card__value" style={{ color: s.color, fontSize: '1.9rem' }}>{s.value}</div>
            {s.link && <div style={{ fontSize: 11, color: 'var(--green-light)', marginTop: 6 }}>View →</div>}
          </motion.div>
        ))}
      </div>

      {/* Sub plan split */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Subscription Split</h3>
          <p style={{ fontSize: 12, marginBottom: 20 }}>Monthly vs Yearly active subscribers</p>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ height: 180, width: 180, flexShrink: 0 }}>
              {stats.monthlySubCount + stats.yearlySubCount > 0 ? (
                <Doughnut
                  data={{
                    labels: ['Monthly', 'Yearly'],
                    datasets: [{
                      data: [stats.monthlySubCount, stats.yearlySubCount],
                      backgroundColor: ['rgba(13,158,92,0.7)', 'rgba(212,168,83,0.7)'],
                      borderColor: ['#0d9e5c', '#d4a853'],
                      borderWidth: 2,
                    }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8899b0', font: { size: 11 } } } } }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>No data</div>
              )}
            </div>
            <div>
              {[
                { label: 'Monthly', count: stats.monthlySubCount, color: '#0d9e5c' },
                { label: 'Yearly',  count: stats.yearlySubCount,  color: '#d4a853' },
              ].map(s => (
                <div key={s.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginLeft: 18 }}>{s.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Latest draw snapshot */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Latest Draw</h3>
          <p style={{ fontSize: 12, marginBottom: 20 }}>Most recent published draw prize pool</p>
          {stats.latestDraw ? (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--gold-light)', marginBottom: 8 }}>
                £{(stats.latestDraw.prizePool?.total || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {MONTH_NAMES[(stats.latestDraw.month || 1) - 1]} {stats.latestDraw.year} — Total pool
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { t: 'Jackpot', v: stats.latestDraw.prizePool?.jackpot },
                  { t: '4-Match', v: stats.latestDraw.prizePool?.fourMatch },
                  { t: '3-Match', v: stats.latestDraw.prizePool?.threeMatch },
                ].map(p => (
                  <div key={p.t} style={{ flex: 1, textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{p.t}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-light)' }}>£{(p.v || 0).toFixed(0)}</div>
                  </div>
                ))}
              </div>
              <Link to="/admin/draws" className="btn btn--ghost btn--sm btn--full" style={{ marginTop: 16, display: 'block', textAlign: 'center' }}>Manage Draws →</Link>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: 12 }}>No draws yet</p>
              <Link to="/admin/draws" className="btn btn--primary btn--sm">Create First Draw</Link>
            </div>
          )}
        </div>
      </div>

      {/* Monthly signups chart */}
      {growthData.length > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>User Growth</h3>
          <p style={{ fontSize: 12, marginBottom: 20 }}>New signups over the last 6 months</p>
          <div style={{ height: 220 }}>
            <Bar
              data={{
                labels: growthLabels,
                datasets: [{
                  label: 'New Users',
                  data: growthData,
                  backgroundColor: 'rgba(13,158,92,0.6)',
                  borderColor: '#0d9e5c',
                  borderWidth: 2,
                  borderRadius: 6,
                }],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      )}

      {/* Charity popularity */}
      {charityNames.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Charity Popularity</h3>
          <p style={{ fontSize: 12, marginBottom: 20 }}>Active subscribers per charity</p>
          <div style={{ height: 220 }}>
            <Bar
              data={{
                labels: charityNames,
                datasets: [{
                  label: 'Subscribers',
                  data: charityCount,
                  backgroundColor: 'rgba(212,168,83,0.6)',
                  borderColor: '#d4a853',
                  borderWidth: 2,
                  borderRadius: 6,
                }],
              }}
              options={{ ...chartOptions, indexAxis: 'y' }}
            />
          </div>
        </div>
      )}

      {/* Quick action links */}
      <div className="grid-4" style={{ marginTop: 24 }}>
        {[
          { label: 'Manage Users',    icon: '👥', to: '/admin/users'     },
          { label: 'Run Draw',        icon: '🎲', to: '/admin/draws'     },
          { label: 'Add Charity',     icon: '💚', to: '/admin/charities' },
          { label: 'Verify Winners',  icon: '🏆', to: '/admin/winners'   },
        ].map(a => (
          <Link key={a.to} to={a.to} className="card"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px', textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 28 }}>{a.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
