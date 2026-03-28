import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

// Layouts
import PublicLayout  from './components/layout/PublicLayout';
import UserLayout    from './components/layout/UserLayout';
import AdminLayout   from './components/layout/AdminLayout';

// Public pages
import HomePage      from './pages/HomePage';
import CharitiesPage from './pages/CharitiesPage';
import CharityDetail from './pages/CharityDetail';
import DrawsPage     from './pages/DrawsPage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import SubscribePage from './pages/SubscribePage';

// User pages
import DashboardPage  from './pages/user/DashboardPage';
import ScoresPage     from './pages/user/ScoresPage';
import WinningsPage   from './pages/user/WinningsPage';
import SettingsPage   from './pages/user/SettingsPage';
import CharityPickPage from './pages/user/CharityPickPage';

// Admin pages
import AdminDashboard       from './pages/admin/AdminDashboard';
import AdminUsersPage       from './pages/admin/AdminUsersPage';
import AdminUserDetail      from './pages/admin/AdminUserDetail';
import AdminDrawsPage       from './pages/admin/AdminDrawsPage';
import AdminDrawDetail      from './pages/admin/AdminDrawDetail';
import AdminCharitiesPage   from './pages/admin/AdminCharitiesPage';
import AdminWinnersPage     from './pages/admin/AdminWinnersPage';

// Route guards
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route element={<PublicLayout />}>
      <Route path="/"           element={<HomePage />} />
      <Route path="/charities"  element={<CharitiesPage />} />
      <Route path="/charities/:id" element={<CharityDetail />} />
      <Route path="/draws"      element={<DrawsPage />} />
      <Route path="/subscribe"  element={<SubscribePage />} />
    </Route>

    {/* Auth */}
    <Route path="/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
    <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

    {/* User dashboard */}
    <Route path="/dashboard" element={<PrivateRoute><UserLayout /></PrivateRoute>}>
      <Route index          element={<DashboardPage />} />
      <Route path="scores"  element={<ScoresPage />} />
      <Route path="winnings" element={<WinningsPage />} />
      <Route path="charity" element={<CharityPickPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>

    {/* Admin */}
    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route index               element={<AdminDashboard />} />
      <Route path="users"        element={<AdminUsersPage />} />
      <Route path="users/:id"    element={<AdminUserDetail />} />
      <Route path="draws"        element={<AdminDrawsPage />} />
      <Route path="draws/:id"    element={<AdminDrawDetail />} />
      <Route path="charities"    element={<AdminCharitiesPage />} />
      <Route path="winners"      element={<AdminWinnersPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#0f1a2e', color: '#eef2f8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' },
            success: { iconTheme: { primary: '#0d9e5c', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
