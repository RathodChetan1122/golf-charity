import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard',          icon: '📊', label: 'Overview'  },
  { to: '/dashboard/scores',   icon: '⛳', label: 'My Scores' },
  { to: '/dashboard/winnings', icon: '🏆', label: 'Winnings'  },
  { to: '/dashboard/charity',  icon: '💚', label: 'Charity'   },
  { to: '/dashboard/settings', icon: '⚙️', label: 'Settings'  },
];

export default function UserLayout() {
  const { user, logout, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const Sidebar = ({ mobile = false }) => (
    <aside style={{
      width: mobile ? '100%' : 240,
      background: 'var(--bg-card)',
      borderRight: mobile ? 'none' : '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 0',
      ...(mobile ? { paddingBottom: 0 } : { minHeight: '100vh', position: 'sticky', top: 0 }),
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 20 }}>⛳</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 17, color: 'var(--text-primary)' }}>
            Golf<span style={{ color: 'var(--green-light)' }}>Charity</span>
          </span>
        </Link>
      </div>

      {/* User info */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--green-primary), #0a7a45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff',
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span className={`badge badge--${isSubscribed ? 'green' : 'red'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                {isSubscribed ? '● Active' : '● Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 'var(--radius-sm)',
            marginBottom: 4, fontSize: 14, fontWeight: 500,
            color: isActive ? 'var(--green-light)' : 'var(--text-secondary)',
            background: isActive ? 'rgba(13,158,92,0.1)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s',
            borderLeft: isActive ? '2px solid var(--green-primary)' : '2px solid transparent',
          })}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
        {!isSubscribed && (
          <Link to="/subscribe" className="btn btn--primary btn--full btn--sm" style={{ marginBottom: 10, display: 'block', textAlign: 'center' }}>
            ⚡ Activate Plan
          </Link>
        )}
        <button onClick={handleLogout} className="btn btn--ghost btn--full btn--sm">
          🚪 Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'block' }} className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div style={{ display: 'none' }} className="mobile-topbar">
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, color: 'var(--text-primary)', textDecoration: 'none' }}>
            Golf<span style={{ color: 'var(--green-light)' }}>Charity</span>
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 22, cursor: 'pointer',
          }}>☰</button>
        </div>
        {sidebarOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: 'rgba(6,11,20,0.95)', backdropFilter: 'blur(12px)',
            paddingTop: 60,
          }} onClick={() => setSidebarOpen(false)}>
            <div onClick={e => e.stopPropagation()}>
              <Sidebar mobile />
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }} className="user-main">
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: block !important; }
          .user-main { padding: 80px 16px 24px !important; }
        }
      `}</style>
    </div>
  );
}
