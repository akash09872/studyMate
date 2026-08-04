'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react';

export default function FacultyAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['faculty-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/overview');
      return data;
    },
  });

  const stats = data?.data || {};

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={22} color="var(--accent)" /> Analytics Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Track resource uploads and student engagement</p>
        </div>

        {isLoading ? (
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid-4">
              {[
                { label: 'Total Resources', value: stats.resources?.total, icon: BookOpen, color: '#3B82F6' },
                { label: 'Approved', value: stats.resources?.approved, icon: TrendingUp, color: '#10B981' },
                { label: 'Rejected', value: stats.resources?.rejected, icon: BarChart3, color: '#EF4444' },
                { label: 'Total Downloads', value: stats.downloads, icon: Users, color: '#F59E0B' },
              ].map((stat, i) => (
                <div key={i} className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{stat.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{stat.value || 0}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 24, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                 <BarChart3 size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                 <h3 style={{ fontSize: 18, fontWeight: 600 }}>Detailed Charts Coming Soon</h3>
                 <p style={{ fontSize: 14 }}>More granular upload trends and graphs will be available here.</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
