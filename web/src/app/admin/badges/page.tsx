'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Star, Plus, MoreVertical } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminBadgesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data } = await api.get('/admin/badges?limit=50');
      return data;
    },
  });

  const badges = data?.data || [];

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Star size={22} color="#FCD34D" /> Badge Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage gamification badges</p>
          </div>
          <button className="btn btn-primary">
            <Plus size={16} /> Create Badge
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Badge</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Rarity</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Points</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Created</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={5} style={{ padding: 16 }}><div className="skeleton" style={{ height: 32, borderRadius: 8 }} /></td>
                    </tr>
                  ))
                ) : badges.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No badges found.</td>
                  </tr>
                ) : (
                  badges.map((b: any) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 24 }}>{b.iconUrl || '⭐'}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{b.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.description}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-ghost`} style={{ fontSize: 10 }}>{b.rarity}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--accent)' }}>+{b.points} XP</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formatRelativeTime(b.createdAt)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button className="btn-icon btn-ghost"><MoreVertical size={14} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
