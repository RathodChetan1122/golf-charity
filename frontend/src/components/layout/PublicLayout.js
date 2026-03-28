import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function PublicLayout() {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const navLinks = [
    { to: '/',          label: 'Home' },
    { to: '/charities', label: 'Charities' },
    { to: '/draws',     label: 'Draws' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? '12px 0' : '20px 0',
        background: scrolled ? 'rgba(6,11,20,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0d9e5c, #0a7a45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 0 20px rgba(13,158,92,0.4)',
            }}>⛳</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: 'var(--text-primary)', letterSpacing: 0.5 }}>
              Golf<span style={{ color: 'var(--green-light)' }}>Charity</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} style={{
                padding: '8px 16px', borderRadius: 8,
                fontSize: 14, fontWeight: 500,
                color: location.pathname === to ? 'var(--green-light)' : 'var(--text-secondary)',
                background: location.pathname === to ? 'rgba(13,158,92,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (location.pathname !== to) e.target.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { if (location.pathname !== to) e.target.style.color = 'var(--text-secondary)'; }}
              >{label}</Link>
            ))}
          </nav>

          {/* Auth CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-nav">
            {isAuthenticated ? (
              <>
                <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn btn--outline btn--sm">
                  {isAdmin ? '⚙️ Admin' : '📊 Dashboard'}
                </Link>
                <button onClick={() => { logout(); navigate('/'); }} className="btn btn--ghost btn--sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm">Login</Link>
                <Link to="/subscribe" className="btn btn--primary btn--sm">Subscribe Now</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            display: 'none', background: 'none', border: 'none',
            color: 'var(--text-primary)', fontSize: 24, cursor: 'pointer',
          }} className="mobile-menu-btn">☰</button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'rgba(6,11,20,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}
            >
              <div className="container" style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {navLinks.map(({ to, label }) => (
                  <Link key={to} to={to} style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: 16 }}>{label}</Link>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 12, display: 'flex', gap: 10 }}>
                  {isAuthenticated ? (
                    <>
                      <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn btn--outline btn--sm">Dashboard</Link>
                      <button onClick={() => { logout(); navigate('/'); }} className="btn btn--ghost btn--sm">Logout</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="btn btn--ghost btn--sm">Login</Link>
                      <Link to="/subscribe" className="btn btn--primary btn--sm">Subscribe</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, paddingTop: 80 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-deep)',
        padding: '48px 0 24px',
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>⛳</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--text-primary)' }}>
                  Golf<span style={{ color: 'var(--green-light)' }}>Charity</span>
                </span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>Play the sport you love. Win monthly prizes. Make every round count for charity.</p>
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Platform</h4>
              {[['/', 'Home'], ['/charities', 'Charities'], ['/draws', 'Monthly Draws'], ['/subscribe', 'Subscribe']].map(([to, label]) => (
                <div key={to} style={{ marginBottom: 6 }}><Link to={to} style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</Link></div>
              ))}
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Account</h4>
              {isAuthenticated ? (
                <><div style={{ marginBottom: 6 }}><Link to="/dashboard" style={{ fontSize: 14, color: 'var(--text-muted)' }}>Dashboard</Link></div></>
              ) : (
                <><div style={{ marginBottom: 6 }}><Link to="/login" style={{ fontSize: 14, color: 'var(--text-muted)' }}>Login</Link></div>
                <div style={{ marginBottom: 6 }}><Link to="/register" style={{ fontSize: 14, color: 'var(--text-muted)' }}>Register</Link></div></>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>© {new Date().getFullYear()} Golf Charity Platform · Built with purpose</p>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}
