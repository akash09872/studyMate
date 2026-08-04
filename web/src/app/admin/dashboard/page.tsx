'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import {
  Users, BookOpen, Download, Shield, TrendingUp, BarChart3,
  FileText, Star, AlertTriangle, CheckCircle, Clock, ArrowRight,
  Activity, Database, Layers
} from 'lucide-react';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

const COLORS = ['#C8F135', '#60A5FA', '#F472B6', '#FCD34D', '#34D399'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {formatNumber(p.value)}</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => { const { data } = await api.get('/analytics/overview'); return data.data; },
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: async () => { const { data } = await api.get('/analytics/upload-trends?days=30'); return data.data; },
  });

  const { data: topResources } = useQuery({
    queryKey: ['analytics', 'top-resources'],
    queryFn: async () => { const { data } = await api.get('/analytics/top-resources?limit=5'); return data.data; },
  });

  const { data: branchStats } = useQuery({
    queryKey: ['analytics', 'branches'],
    queryFn: async () => { const { data } = await api.get('/analytics/branch-stats'); return data.data; },
  });

  const { data: systemStats } = useQuery({
    queryKey: ['admin', 'system-stats'],
    queryFn: async () => { const { data } = await api.get('/admin/system-stats'); return data.data; },
  });

  const statCards = [
    { label: 'Total Users', value: formatNumber(overview?.users?.total || 0), sub: `+${overview?.users?.week || 0} this week`, icon: Users, color: '#60A5FA' },
    { label: 'Total Resources', value: formatNumber(overview?.resources?.total || 0), sub: `${overview?.resources?.pending || 0} pending`, icon: BookOpen, color: 'var(--accent)' },
    { label: 'Total Downloads', value: formatNumber(overview?.downloads || 0), sub: 'All time', icon: Download, color: '#F472B6' },
    { label: 'Badges Awarded', value: formatNumber(overview?.badgesAwarded || 0), sub: 'Gamification', icon: Star, color: '#FCD34D' },
  ];

  const pieData = [
    { name: 'Approved', value: overview?.resources?.approved || 0 },
    { name: 'Pending', value: overview?.resources?.pending || 0 },
    { name: 'Rejected', value: overview?.resources?.rejected || 0 },
  ];

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={24} color="var(--accent)" /> Admin Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>Platform overview and management controls</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/admin/users" className="btn btn-secondary btn-sm"><Users size={13} /> Users</Link>
            <Link href="/admin/resources" className="btn btn-secondary btn-sm"><BookOpen size={13} /> Resources</Link>
            <Link href="/admin/reports" className="btn btn-danger btn-sm"><AlertTriangle size={13} /> Reports</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={s.color} />
                  </div>
                  <TrendingUp size={14} color="var(--success)" />
                </div>
                <div className="stat-value" style={{ color: s.color }}>{isLoading ? '...' : s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { href: '/admin/users', icon: Users, label: 'Manage Users', color: '#60A5FA' },
            { href: '/admin/branches', icon: Layers, label: 'Manage Branches', color: 'var(--accent)' },
            { href: '/admin/badges', icon: Star, label: 'Manage Badges', color: '#FCD34D' },
            { href: '/admin/reports', icon: AlertTriangle, label: 'Pending Reports', badge: systemStats?.pendingReports, color: '#EF4444' },
          ].map(({ href, icon: Icon, label, badge, color }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <motion.div className="card" whileHover={{ y: -2 }} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                </div>
                {badge && <span style={{ background: '#EF4444', color: 'white', fontSize: 10, padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>{badge}</span>}
                <ArrowRight size={13} color="var(--text-muted)" />
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
          {/* Upload Trends Chart */}
          <div className="chart-wrapper">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={15} color="var(--accent)" /> Upload Trends (30 days)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends || []}>
                <defs>
                  <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="approveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="uploads" name="Uploads" stroke="var(--accent)" fill="url(#uploadGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#60A5FA" fill="url(#approveGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Resource Status Pie */}
          <div className="chart-wrapper">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={15} color="var(--accent)" /> Resource Status
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={['var(--accent)', '#F59E0B', '#EF4444'][i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: ['var(--accent)', '#F59E0B', '#EF4444'][i] }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{formatNumber(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Branch Stats + Top Resources */}
        <div className="grid-2" style={{ gap: 20 }}>
          {/* Branch Stats */}
          <div className="chart-wrapper">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={15} color="var(--accent)" /> Branch Overview
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(branchStats || []).slice(0, 6)} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="_count.users" name="Users" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="_count.resources" name="Resources" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Resources */}
          <div className="chart-wrapper">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="var(--accent)" /> Top Resources
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(topResources || []).map((r: any, i: number) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 20, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.subject?.name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Download size={10} />{formatNumber(r.downloadCount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
