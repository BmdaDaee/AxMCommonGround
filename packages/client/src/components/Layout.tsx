import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { path: '/messages', label: 'Messages', icon: '✉' },
  { path: '/bently', label: 'Bently AI', icon: '✧' },
  { path: '/xp', label: 'XP & Rank', icon: '⚡' },
  { path: '/missions', label: 'Missions', icon: '⚔' },
  { path: '/journal', label: 'Journal', icon: '✎' },
  { path: '/deeplyus', label: 'DeeplyUs', icon: '♥' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#080808] text-[#F5F5F5]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1E1E1E] flex flex-col">
        <div className="p-8">
          <h2 className="text-[#D4AF37] text-xl font-mono tracking-tighter">CommonGround</h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-sm font-mono text-xs uppercase tracking-widest transition-colors ${
                location.pathname === item.path 
                  ? 'bg-[#1A1A1A] text-[#D4AF37] border-l-2 border-[#D4AF37]' 
                  : 'text-[#B0B0B0] hover:bg-[#0F0F0F] hover:text-[#F5F5F5]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1E1E1E]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#B0B0B0] hover:text-[#E63946] font-mono text-xs uppercase tracking-widest transition-colors"
          >
            <span>⏻</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

export default Layout;
