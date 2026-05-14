import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '⊙' },
    { label: 'Messages', href: '/messages', icon: '✉' },
    { label: 'Bently AI', href: '/bently', icon: '◆' },
    { label: 'XP & Rank', href: '/xp', icon: '⚡' },
    { label: 'Missions', href: '/missions', icon: '✓' },
    { label: 'Journal', href: '/journal', icon: '✎' },
    { label: 'DeeplyUs Vault', href: '/deeplyus', icon: '⬡' },
    { label: 'Calendar', href: '/calendar', icon: '◐' },
    { label: 'Settings', href: '/settings', icon: '⚙' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex h-screen bg-bg-base text-text-primary">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-bg-elevated border-r border-border transition-all duration-base flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo / Branding */}
        <div className="flex items-center justify-between p-lg border-b border-border">
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center gap-md">
              <div className="w-8 h-8 bg-gradient-gold flex-center rounded-md">
                <span className="text-bg-base font-bold text-lg">⬡</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-primary">CG</span>
                <span className="text-xs text-text-tertiary">Ground</span>
              </div>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-sm hover:bg-bg-hover rounded-md transition-colors"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            <span className="text-primary">{'◀|'}</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-md space-y-sm">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-md px-md py-sm rounded-lg transition-all duration-base',
                isActive(item.href)
                  ? 'bg-primary text-bg-base'
                  : 'text-text-primary hover:bg-bg-hover'
              )}
              title={sidebarOpen ? undefined : item.label}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-md">
          <button
            onClick={() => {
              localStorage.removeItem('authToken');
              window.location.href = '/login';
            }}
            className={cn(
              'w-full px-md py-sm rounded-md text-sm font-medium transition-colors',
              'bg-highlight hover:bg-highlight-dark text-bg-base'
            )}
          >
            {sidebarOpen ? 'Logout' : '→'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-bg-elevated border-b border-border px-lg py-md">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">
              {navigationItems.find((item) => isActive(item.href))?.label ||
                'CommonGround'}
            </h1>
            <div className="flex items-center gap-lg">
              {/* User status indicator */}
              <div className="flex items-center gap-sm px-md py-sm rounded-md border border-border">
                <div className="w-2 h-2 bg-status-aligned rounded-full animate-pulse" />
                <span className="text-xs text-text-secondary">Connected</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-bg-base">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
