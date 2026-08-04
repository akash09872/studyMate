'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { BookOpen, FileText, BarChart3, Clock, TrendingUp, CheckCircle, Search } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

export default function FacultyDashboardPage() {
  const { user } = useAuthStore();

  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['faculty-analytics-overview'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/overview');
      return data;
    },
  });

  const { data: reviewData, isLoading: isReviewLoading } = useQuery({
    queryKey: ['faculty-review-queue'],
    queryFn: async () => {
      const { data } = await api.get('/review/queue?limit=5');
      return data;
    },
  });

  const stats = analyticsData?.data || {};
  const pendingReviews = reviewData?.data || [];
  const reviewCount = reviewData?.pagination?.total || 0;

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Welcome back, Prof. {user?.lastName} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Here is what is happening in your department today.
          </p>
        </div>

        {/* Top Stats */}
        <div className="grid-3" style={{ marginBottom: 32 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ padding: 10, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 10, color: '#F59E0B' }}>
                <Clock size={20} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Pending Reviews</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{isReviewLoading ? '-' : reviewCount}</div>
          </div>
          
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ padding: 10, background: 'rgba(52, 211, 153, 0.1)', borderRadius: 10, color: '#34D399' }}>
                <CheckCircle size={20} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Approved Resources</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{isAnalyticsLoading ? '-' : stats.resources?.approved || 0}</div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ padding: 10, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 10, color: '#3B82F6' }}>
                <TrendingUp size={20} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Total Platform Downloads</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{isAnalyticsLoading ? '-' : stats.downloads || 0}</div>
          </div>
        </div>

        {/* Content Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="var(--accent)" /> Needs Your Review
                </h3>
                <Link href="/faculty/review" className="btn btn-secondary btn-sm">View All</Link>
              </div>

              {isReviewLoading ? (
                <div className="skeleton" style={{ height: 100, borderRadius: 12 }} />
              ) : pendingReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 12 }}>
                  <CheckCircle size={32} style={{ opacity: 0.5, margin: '0 auto 12px' }} />
                  <p>All caught up! No resources pending your review.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingReviews.map((r: any) => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'var(--bg-elevated)', borderRadius: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>by {r.uploader?.firstName} • {r.subject?.name}</div>
                      </div>
                      <Link href="/faculty/review" className="btn btn-primary btn-sm">Review</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/faculty/assignments" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <BookOpen size={16} /> Manage Assignments
                </Link>
                <Link href="/faculty/analytics" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <BarChart3 size={16} /> View Deep Analytics
                </Link>
                <Link href="/search" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <Search size={16} /> Search Resources
                </Link>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </AppShell>
  );
}
