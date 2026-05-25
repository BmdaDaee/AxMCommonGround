import { useQuery } from '@tanstack/react-query';
import { House, ChatsTeardrop, Sparkle, Notebook, Target, CalendarDots, Archive, Gear, SignOut } from '@phosphor-icons/react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

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

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

function MessagesBadge({ count, mobile = false }) {
  if (!count) return null;
  return (
    <span className={`nav-badge ${mobile ? 'mobile' : ''}`} data-testid={mobile ? 'mobile-messages-unread-badge' : 'messages-unread-badge'}>
      {count}
    </span>
  );
}

function ShellNavItem({ item, unreadCount, mobile = false }) {
  const { to, label, icon: Icon } = item;
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${mobile ? 'mobile-nav-link' : 'nav-link'} ${isActive ? 'active' : ''}`}
      data-testid={`${mobile ? 'mobile-' : ''}nav-link-${label.toLowerCase()}`}
    >
      <Icon size={18} weight="duotone" />
      <span>{label}</span>
      {label === 'Messages' && <MessagesBadge count={unreadCount} mobile={mobile} />}
    </NavLink>
  );
}

function ShellTopbarActions({ immersive, partnerPresence }) {
  if (immersive) return null;
  return (
    <div className="topbar-actions">
      {partnerPresence && (
        <div className="presence-chip" data-testid="partner-presence-chip">
          <span className={`presence-dot ${partnerPresence.isOnline ? 'online' : 'offline'}`} />
          <span>{partnerPresence.name} · {partnerPresence.label}</span>
        </div>
      )}
      <div className="topbar-chip" data-testid="install-pwa-copy">Installable PWA ready</div>
    </div>
  );
}

function ShellSidebar({ user, onLogout, unreadCount }) {
  return (
    <aside className="sidebar" data-testid="primary-sidebar">
      <Link to="/dashboard" className="brand-lockup" data-testid="brand-home-link">
        <span className="brand-mark">CG</span>
        <div>
          <p className="eyebrow">CommonGround</p>
          <h1 className="brand-title">A third presence.</h1>
        </div>
      </Link>

      <nav className="nav-stack" data-testid="primary-navigation">
        {navItems.map((item) => (
          <ShellNavItem key={item.to} item={item} unreadCount={unreadCount} />
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
  );
}

function ShellMobileNav({ immersive, unreadCount }) {
  if (immersive) return null;
  return (
    <nav className="mobile-nav" data-testid="mobile-bottom-navigation">
      {navItems.slice(0, 5).map((item) => (
        <ShellNavItem key={item.to} item={item} unreadCount={unreadCount} mobile />
      ))}
    </nav>
  );
}

export default function AppShell({ user, onLogout }) {
  const location = useLocation();
  const immersive = ['/invite', '/join'].includes(location.pathname);
  const notificationsQuery = useQuery({
    queryKey: ['notifications-summary'],
    queryFn: () => api('/notifications/summary'),
    refetchInterval: 12000,
    retry: false,
  });
  const notifications = notificationsQuery.data;

  return (
    <div className="shell-root">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      {!immersive && <ShellSidebar user={user} onLogout={onLogout} unreadCount={notifications?.unreadMessages} />}

      <div className={`main-column ${immersive ? 'immersive' : ''}`}>
        <header className="topbar" data-testid="app-topbar">
          <div>
            <p className="eyebrow">Relationship operating system</p>
            <p className="topbar-copy" data-testid="topbar-user-greeting">Welcome back, {user?.name?.split(' ')[0] || 'friend'}.</p>
          </div>
          <ShellTopbarActions immersive={immersive} partnerPresence={notifications?.partnerPresence} />
        </header>

        <motion.main className="content-area" {...pageTransition}>
          <Outlet />
        </motion.main>

        <ShellMobileNav immersive={immersive} unreadCount={notifications?.unreadMessages} />
      </div>
    </div>
  );
}