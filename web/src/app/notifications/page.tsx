'use client';

import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Bell, Check, CheckCheck, Trash2, BookOpen, Trophy, Upload, Star, Info } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

const NOTIF_ICONS: Record<string, string> = {
  RESOURCE_APPROVED: '✅', RESOURCE_REJECTED: '❌', RESOURCE_REVIEWED: '📝',
  BADGE_EARNED: '🏆', LEVEL_UP: '⬆️', COMMENT_REPLY: '💬', COMMENT_LIKE: '👍',
  DOWNLOAD_MILESTONE: '📥', RATING_RECEIVED: '⭐', ASSIGNMENT_DUE: '📋',
  SYSTEM: 'ℹ️',
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const params = filter === 'unread' ? '?unread=true' : '';
      const { data } = await api.get(`/notifications${params}`);
      return data;
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => { toast.success('All notifications marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <AppShell>
      <div className="page-container" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={22} color="var(--accent)" /> Notifications
              {unreadCount > 0 && (
                <span style={{ background: 'var(--accent)', color: '#000', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{unreadCount}</span>
              )}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{notifications.length} notifications</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {(['all', 'unread'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === f ? 'var(--accent-subtle)' : 'transparent', color: filter === f ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                  {f === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button onClick={() => markAllMutation.mutate()} className="btn btn-secondary btn-sm">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h3>
            <p style={{ fontSize: 14 }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notifications.map((n: any, i: number) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                style={{
                  display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                  background: n.isRead ? 'var(--bg-card)' : 'rgba(200,241,53,0.05)',
                  border: `1px solid ${n.isRead ? 'var(--border)' : 'var(--border-accent)'}`,
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                whileHover={{ scale: 1.005 }}
              >
                {!n.isRead && (
                  <div style={{ position: 'absolute', top: 14, right: 14, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                )}
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {NOTIF_ICONS[n.type] || 'ℹ️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRelativeTime(n.createdAt)}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
                  className="btn-icon btn-ghost"
                  style={{ flexShrink: 0, alignSelf: 'flex-start', width: 28, height: 28, color: 'var(--text-muted)' }}
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
