import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, ShieldCheck, Users, BadgeCheck, SlidersHorizontal, FileText, LogOut, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const navItems = [
  { to: '/dashboard', labelKey: 'dashboard', icon: LayoutGrid },
  { to: '/users', labelKey: 'users', icon: Users },
  { to: '/agents', labelKey: 'agents', icon: ShieldCheck },
  { to: '/configs', labelKey: 'configs', icon: SlidersHorizontal },
  { to: '/nrc', labelKey: 'nrc', icon: BadgeCheck },
  { to: '/audit', labelKey: 'audit', icon: FileText },
];

export default function Layout() {
  const { logout, user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();

  const pageTitle = location.pathname.replace('/', '').split('/')[0] || 'dashboard';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-block">
            <div className="brand-icon">SW</div>
            <div>
              <p className="brand-label">{t('appTitle')}</p>
              <span className="brand-subtitle">{t('backendNote')}</span>
            </div>
          </div>
          <nav className="nav-list">
            {navItems.map(({ to, labelKey, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{t(labelKey)}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <strong>{user?.full_name || 'Admin'}</strong>
            <span>{user?.phone_number || 'admin'}</span>
          </div>
          <button className="ghost-button" type="button" onClick={() => setLanguage(language === 'en' ? 'my' : 'en')}>
            <Languages size={16} />
            {t('changeLanguage')}
          </button>
          <button className="ghost-button" type="button" onClick={logout}>
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t('overview')}</p>
            <h1>{t(pageTitle)}</h1>
          </div>
          <div className="pill">{t('liveBackend')}</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
