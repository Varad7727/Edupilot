import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  BookOpen,
  FileText,
  Library,
  Settings,
  LogOut,
  GraduationCap,
  Menu,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/teacher', label: 'Studio', icon: Home, exact: true },
  { to: '/teacher/chapters', label: 'Chapters', icon: BookOpen },
  { to: '/teacher/lessons', label: 'Lessons', icon: FileText },
  { to: '/teacher/dpps', label: 'DPPs', icon: Library },
  { to: '/teacher/settings', label: 'Settings', icon: Settings },
];

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--brand-white)' }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          transform transition-transform duration-300
          lg:relative lg:translate-x-0 lg:flex
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: 'var(--brand-burgundy)', color: 'var(--brand-ivory)' }}
      >
        {/* Logo */}
        <div className="px-6 py-7 border-b" style={{ borderColor: 'rgba(227,221,211,0.1)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--brand-amber)' }}
            >
              <GraduationCap size={16} style={{ color: 'var(--brand-cherry)' }} />
            </div>
            <div>
              <p className="font-display font-bold text-sm tracking-tight" style={{ color: 'var(--brand-ivory)' }}>
                AMIT ACADEMY
              </p>
              <p className="text-xs" style={{ color: 'rgba(227,221,211,0.45)' }}>Teaching Studio</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  backgroundColor: active ? 'rgba(247,165,27,0.18)' : 'transparent',
                  color: active ? 'var(--brand-amber)' : 'rgba(227,221,211,0.65)',
                }}
              >
                <Icon size={16} />
                {label}
                {active && (
                  <motion.div
                    layoutId="teacher-nav-indicator"
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ backgroundColor: 'var(--brand-amber)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-5 border-t" style={{ borderColor: 'rgba(227,221,211,0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ backgroundColor: 'var(--brand-amber)', color: 'var(--brand-cherry)' }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? 'T'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--brand-ivory)' }}>
                {user?.name ?? 'Teacher'}
              </p>
              <p className="text-xs truncate" style={{ color: 'rgba(227,221,211,0.4)' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'rgba(227,221,211,0.5)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--brand-ivory)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(227,221,211,0.5)')}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="lg:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{
            backgroundColor: 'var(--brand-white)',
            borderColor: 'rgba(98,65,51,0.1)',
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg"
            aria-label="Open menu"
          >
            <Menu size={20} style={{ color: 'var(--brand-burgundy)' }} />
          </button>
          <span className="font-display font-bold text-sm" style={{ color: 'var(--brand-burgundy)' }}>
            Teaching Studio
          </span>
          <div className="w-8" />
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
