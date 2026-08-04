'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import {
  Upload, BookOpen, Trophy, Download, Star, TrendingUp,
  Clock, Bookmark, Bell, ArrowRight, Zap, Target, Award,
  ChevronRight, FileText, Users
} from 'lucide-react';
import { formatRelativeTime, formatNumber, getLevelName, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_CLASSES } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];
//hehe
function XPBar({ points, level }: { points: number; level: number }) {
  const current = LEVEL_THRESHOLDS[level] || 0;
  const next = LEVEL_THRESHOLDS[level + 1] || current + 1000;
  const progress = ((points - current) / (next - current)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        <span>{getLevelName(level)}</span>
        <span>{formatNumber(points)} / {formatNumber(next)} XP</span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, delay: 0.4 }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, href }: any) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}>
      <Link href={href || '#'} style={{ textDecoration: 'none' }}>
        <div className="stat-card" style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
          </div>
          <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
          <div className="stat-label">{label}</div>
        </div>
      </Link>
    </motion.div>
  );
}

function ResourceCard({ resource }: { resource: any }) {
  return (
    <Link href={`/resources/${resource.id}`} style={{ textDecoration: 'none' }}>
      <motion.div className="card" whileHover={{ y: -2 }} style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
            {resource.type === 'NOTES' ? '📝' : resource.type === 'PYQ' ? '📄' : resource.type === 'LAB_MANUAL' ? '🔬' : resource.type === 'PPT' ? '📊' : '📚'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span className={`badge ${RESOURCE_TYPE_CLASSES[resource.type]}`} style={{ fontSize: 10, padding: '2px 7px' }}>
                {RESOURCE_TYPE_LABELS[resource.type]}
              </span>
              {resource.isVerified && <span className="badge badge-accent" style={{ fontSize: 10, padding: '2px 7px' }}>✓ Verified</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
              {resource.title}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Download size={10} />{formatNumber(resource.downloadCount)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={10} />{resource.averageRating?.toFixed(1)}</span>
              <span>{formatRelativeTime(resource.createdAt)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const { data } = await api.get('/auth/me'); return data.data; },
    enabled: !!user,
  });

  const { data: recentResources } = useQuery({
    queryKey: ['resources', 'recent'],
    queryFn: async () => {
      const { data } = await api.get('/resources?limit=6&sortBy=createdAt');
      return data.data;
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', 'top5'],
    queryFn: async () => {
      const { data } = await api.get('/leaderboard?limit=5');
      return data.data;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const { data } = await api.get('/notifications?unread=true&limit=5');
      return data;
    },
    enabled: !!user,
  });

  const currentUser = meData || user;
  const xpData = Array.from({ length: 7 }, (_, i) => ({
    day: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
    xp: Math.floor(Math.random() * 80) + 10,
  }));

  return (
    <AppShell>
      <div className="page-container">
        {/* ─── Header ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              Good morning, <span className="text-accent">{currentUser?.firstName}</span> 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              {currentUser?.currentStreak > 0 && (
                <> · <span style={{ color: 'var(--accent)' }}>🔥 {currentUser.currentStreak} day streak</span></>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/search" className="btn btn-secondary btn-sm"><BookOpen size={14} /> Browse</Link>
            <Link href="/upload" className="btn btn-primary btn-sm"><Upload size={14} /> Upload</Link>
          </div>
        </motion.div>

        {/* ─── XP + Level Card ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: 'linear-gradient(135deg, rgba(200,241,53,0.08) 0%, var(--bg-card) 100%)',
            border: '1px solid var(--border-accent)', borderRadius: 20, padding: '24px 28px',
            marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="level-badge">Lv.{currentUser?.level || 1}</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{getLevelName(currentUser?.level || 0)}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>· {formatNumber(currentUser?.totalPoints || 0)} XP total</span>
            </div>
            <XPBar points={currentUser?.totalPoints || 0} level={currentUser?.level || 0} />
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weekly XP</div>
            <ResponsiveContainer width={120} height={48}>
              <AreaChart data={xpData}>
                <Area type="monotone" dataKey="xp" stroke="var(--accent)" fill="var(--accent-subtle)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ─── Stats Grid ───────────────────────────────────────────────────── */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          {[
            { icon: Upload, label: 'Uploads', value: currentUser?._count?.resources ?? '—', color: 'var(--accent)', href: '/resources?mine=true' },
            { icon: Download, label: 'Downloads', value: formatNumber(currentUser?._count?.downloads ?? 0), color: '#60A5FA', href: '/profile' },
            { icon: Bookmark, label: 'Bookmarks', value: currentUser?._count?.bookmarks ?? '—', color: '#F472B6', href: '/bookmarks' },
            { icon: Trophy, label: 'Leaderboard Rank', value: '#?', color: '#FCD34D', href: '/leaderboard' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* ─── Left Column ───────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Recent Resources */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color="var(--accent)" /> Recently Added
                </h2>
                <Link href="/resources" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View All <ChevronRight size={12} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentResources?.length
                  ? recentResources.map((r: any) => <ResourceCard key={r.id} resource={r} />)
                  : Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
                  ))
                }
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="var(--accent)" /> Quick Actions
              </h2>
              <div className="grid-2" style={{ gap: 12 }}>
                {[
                  { href: '/upload', icon: Upload, label: 'Upload Resource', desc: 'Share notes & earn XP', color: 'var(--accent)' },
                  { href: '/search', icon: BookOpen, label: 'Browse Library', desc: 'Find study materials', color: '#60A5FA' },
                  { href: '/assignments', icon: FileText, label: 'Assignments', desc: 'View pending work', color: '#F472B6' },
                  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', desc: 'See your ranking', color: '#FCD34D' },
                ].map(({ href, icon: Icon, label, desc, color }) => (
                  <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                    <motion.div className="card" whileHover={{ y: -2 }} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} color={color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Right Column ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Notifications */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Bell size={14} color="var(--accent)" /> Notifications
                  {notifications?.unreadCount > 0 && (
                    <span style={{ background: 'var(--accent)', color: '#000', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>
                      {notifications.unreadCount}
                    </span>
                  )}
                </h3>
                <Link href="/notifications" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>All</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notifications?.data?.length
                  ? notifications.data.slice(0, 4).map((n: any) => (
                    <div key={n.id} style={{ padding: '10px 12px', borderRadius: 10, background: n.isRead ? 'transparent' : 'var(--accent-subtle)', border: `1px solid ${n.isRead ? 'var(--border)' : 'var(--border-accent)'}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.body.slice(0, 60)}…</div>
                    </div>
                  ))
                  : <div className="empty-state" style={{ padding: '20px 0' }}>
                    <Bell size={24} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: 12 }}>No new notifications</span>
                  </div>
                }
              </div>
            </div>

            {/* Leaderboard Top 5 */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Trophy size={14} color="var(--accent)" /> Top Contributors
                </h3>
                <Link href="/leaderboard" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>Full Board</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {leaderboard?.length
                  ? leaderboard.map((u: any, i: number) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 22, fontSize: 13, fontWeight: 700, color: i < 3 ? ['var(--accent)', '#C0C0C0', '#CD7F32'][i] : 'var(--text-muted)', textAlign: 'center', flexShrink: 0 }}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                        {u.avatarUrl ? <img src={u.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : u.firstName[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.branch?.shortName || '—'}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{formatNumber(u.totalPoints)}</div>
                    </div>
                  ))
                  : Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)
                }
              </div>
            </div>

            {/* Badges */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Award size={14} color="var(--accent)" /> Your Badges
                </h3>
                <Link href="/profile" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>All</Link>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['🚀', '📚', '⭐', '🏆'].map((emoji, i) => (
                  <div key={i} style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {emoji}
                  </div>
                ))}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 18 }}>+</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
