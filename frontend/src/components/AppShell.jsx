import { House, ChatsTeardrop, Sparkle, Notebook, Target, CalendarDots, Archive, Gear, SignOut } from '@phosphor-icons/react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: House },
  { to: '/messages', label: 'Messages', icon: ChatsTeardrop },
  { to: '/bently', label: 'Bently', icon: Sparkle },
  { to: '/journal', label: 'Journal', icon: Notebook },
  { to: '/missions', label: 'Missions', icon: Target },
  { to: '/calendar', label: 'Calendar', icon: CalendarDots },
  { to: '/vault', label: 'Vault', icon: Archive },
  { to: '/settings', label: 'Settings', icon: Gear },
];

export default function AppShell({ user, onLogout }) {
  const location = useLocation();
  const immersive = ['/invite', '/join'].includes(location.pathname);

  return (
    <div className="shell-root">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      {!immersive && (
        <aside className="sidebar" data-testid="primary-sidebar">
          <Link to="/dashboard" className="brand-lockup" data-testid="brand-home-link">
            <span className="brand-mark">CG</span>
            <div>
              <p className="eyebrow">CommonGround</p>
              <h1 className="brand-title">A third presence.</h1>
            </div>
          </Link>

          <nav className="nav-stack" data-testid="primary-navigation">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                data-testid={`nav-link-${label.toLowerCase()}`}
              >
                <Icon size={18} weight="duotone" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-card" data-testid="signed-in-user-card">
              <p className="eyebrow">Signed in</p>
              <strong data-testid="signed-in-user-name">{user?.name || 'CommonGround member'}</strong>
              <span data-testid="signed-in-user-email">{user?.email}</span>
            </div>
            <button className="button button-secondary full" onClick={onLogout} data-testid="logout-button">
              <SignOut size={18} weight="bold" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>
      )}

      <div className={`main-column ${immersive ? 'immersive' : ''}`}>
        <header className="topbar" data-testid="app-topbar">
          <div>
            <p className="eyebrow">Relationship operating system</p>
            <p className="topbar-copy" data-testid="topbar-user-greeting">Welcome back, {user?.name?.split(' ')[0] || 'friend'}.</p>
          </div>
          {!immersive && (
            <div className="topbar-chip" data-testid="install-pwa-copy">Installable PWA ready</div>
          )}
        </header>

        <motion.main
          className="content-area"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>

        {!immersive && (
          <nav className="mobile-nav" data-testid="mobile-bottom-navigation">
            {navItems.slice(0, 5).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                data-testid={`mobile-nav-link-${label.toLowerCase()}`}
              >
                <Icon size={18} weight="duotone" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}