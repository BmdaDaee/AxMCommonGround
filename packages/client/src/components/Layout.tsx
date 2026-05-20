import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '◇' },
  { path: '/messages', label: 'Messages', icon: '✉' },
  { path: '/bently', label: 'Bently', icon: '◆' },
  { path: '/deeplyus', label: 'DeeplyUs', icon: '♡' },
  { path: '/journal', label: 'Journal', icon: '◇' },
  { path: '/calendar', label: 'Calendar', icon: '○' },
  { path: '/xp', label: 'Progress', icon: '✧' },
  { path: '/missions', label: 'Missions', icon: '▪' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-[#f9f7f4]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#e8e6e3] flex flex-col bg-white">
        {/* Header */}
        <div className="p-8 border-b border-[#e8e6e3]">
          <p className="text-[#888] text-xs tracking-widest uppercase mb-3">CommonGround</p>
          <h1 className="text-[#080808] text-2xl font-serif leading-tight">
            A third<br />presence.
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-[#f5f3f1] text-[#D4AF37]'
                  : 'text-[#666] hover:text-[#080808] hover:bg-[#f9f7f4]'
              }`}
            >
              <span className="text-sm w-5">{item.icon}</span>
              <span className="text-sm font-light">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-[#e8e6e3] space-y-4">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-xs text-[#999] hover:text-[#E63946] transition-colors font-light"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-12 py-16">
          {<Outlet />}
        </div>
      </main>
    </div>
  );
};

export default Layout;

