import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin',           icon: '📊', label: 'Dashboard',  end: true },
  { to: '/admin/users',     icon: '👥', label: 'Users'       },
  { to: '/admin/draws',     icon: '🎲', label: 'Draws'       },
  { to: '/admin/charities', icon: '💚', label: 'Charities'   },
  { to: '/admin/winners',   icon: '🏆', label: 'Winners'     },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#080e1c',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0', position: 'sticky', top: 0, minHeight: '100vh',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 20 }}>⛳</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>
                Golf<span style={{ color: 'var(--green-light)' }}>Charity</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Admin Panel</div>
            </div>
          </Link>
        </div>

        <div style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Logged in as</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</div>
          <span className="badge badge--gold" style={{ fontSize: 10, padding: '2px 8px', marginTop: 4 }}>Administrator</span>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {navItems.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 'var(--radius-sm)',
              marginBottom: 4, fontSize: 14, fontWeight: 500,
              color: isActive ? 'var(--gold-light)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(212,168,83,0.08)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.2s',
              borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
            })}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <Link to="/" className="btn btn--ghost btn--full btn--sm" style={{ marginBottom: 8, display: 'block', textAlign: 'center' }}>
            🌐 View Site
          </Link>
          <button onClick={handleLogout} className="btn btn--ghost btn--full btn--sm">🚪 Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px', background: 'var(--bg-void)' }}>
        <Outlet />
      </main>
    </div>
  );
}
