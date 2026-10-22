import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SetupNotice } from './SetupNotice';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">📅</span>
            <span className="brand-name">مواعيدي</span>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="الإشعارات"
              onClick={() => navigate('/notifications')}
            >
              <Bell size={20} />
            </button>
            <button type="button" className="icon-btn" aria-label="تسجيل الخروج" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
        <nav className="app-nav">
          <div className="container nav-links">
            <NavLink to="/" end>
              الرئيسية
            </NavLink>
            <NavLink to="/settings">الإعدادات</NavLink>
          </div>
        </nav>
      </header>
      <main className="app-main">
        <div className="container">
          <SetupNotice />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
