'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Home, Search, Upload, Trophy, Bookmark,
  Bell, Settings, Users, BarChart3, FileText, Star,
  ClipboardList, LogOut, ChevronLeft, ChevronRight,
  Shield, BookMarked, GraduationCap, Layers
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
  badge?: number;
}

const studentNavItems: NavItem[] = [
  { href: '/dashboard',     icon: Home,         label: 'Dashboard' },
  { href: '/resources',     icon: BookOpen,     label: 'Resources' },
  { href: '/search',        icon: Search,       label: 'Search' },
  { href: '/upload',        icon: Upload,       label: 'Upload' },
  { href: '/assignments',   icon: ClipboardList,label: 'Assignments' },
  { href: '/bookmarks',     icon: Bookmark,     label: 'Bookmarks' },
  { href: '/leaderboard',   icon: Trophy,       label: 'Leaderboard' },
];

const facultyNavItems: NavItem[] = [
  { href: '/faculty/dashboard', icon: Home,      label: 'Dashboard' },
  { href: '/faculty/review',    icon: FileText,  label: 'Review Queue' },
  { href: '/faculty/assignments', icon: ClipboardList, label: 'Assignments' },
  { href: '/faculty/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/resources',         icon: BookOpen,  label: 'Resources' },
];

const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard',  icon: BarChart3,   label: 'Dashboard' },
  { href: '/admin/users',      icon: Users,       label: 'Users' },
  { href: '/admin/resources',  icon: BookOpen,    label: 'Resources' },
  { href: '/admin/branches',   icon: Layers,      label: 'Branches' },
  { href: '/admin/subjects',   icon: BookMarked,  label: 'Subjects' },
  { href: '/admin/badges',     icon: Star,        label: 'Badges' },
  { href: '/admin/reports',    icon: Shield,      label: 'Reports' },
];

const bottomItems: NavItem[] = [
  { href: '/notifications', icon: Bell,     label: 'Notifications' },
  { href: '/profile',       icon: GraduationCap, label: 'Profile' },
  { href: '/settings',      icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const getNavItems = () => {
    if (user?.role === 'ADMIN') return adminNavItems;
    if (user?.role === 'FACULTY') return facultyNavItems;
    return studentNavItems;
  };

  const navItems = getNavItems();

  return (
    <motion.aside
      className="sidebar"
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{ overflow: 'hidden' }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <BookOpen size={18} color="#000" strokeWidth={2.5} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              Study<span style={{ color: 'var(--accent)' }}>Mate</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* User pill */}
      {user && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)',
              border: '2px solid var(--border-accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: 'var(--accent)',
            }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : user.firstName[0]
              }
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ overflow: 'hidden', minWidth: 0 }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {user.role} {user.level ? `· Lv.${user.level}` : ''}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} className={cn('sidebar-item', active && 'active')}>
              <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn('sidebar-item', active && 'active')}>
              <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ whiteSpace: 'nowrap' }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="sidebar-item"
          style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none', textAlign: 'left', color: 'var(--error)' }}
        >
          <LogOut size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ whiteSpace: 'nowrap' }}>
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute', right: -12, top: 72,
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 10,
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
