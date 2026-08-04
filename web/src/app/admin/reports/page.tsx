'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Shield, Check, X, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('PENDING');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', filter],
    queryFn: async () => {
      const { data } = await api.get(`/reports?status=${filter}&limit=50`);
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await api.patch(`/reports/${id}/resolve`, { status, resolution: status === 'RESOLVED' ? 'Action taken' : 'No violation found' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Report updated successfully');
    },
    onError: () => toast.error('Failed to update report'),
  });

  const reports = data?.data || [];

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={22} color="#EF4444" /> Moderation Queue
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Review reported resources and comments</p>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            {['PENDING', 'RESOLVED', 'DISMISSED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
                style={{ height: 32, fontSize: 12 }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Reason</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Target</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Reporter</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Created</th>
                  {filter === 'PENDING' && <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={5} style={{ padding: 16 }}><div className="skeleton" style={{ height: 40, borderRadius: 8 }} /></td>
                    </tr>
                  ))
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <AlertTriangle size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                      No {filter.toLowerCase()} reports found.
                    </td>
                  </tr>
                ) : (
                  reports.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div className="badge badge-danger" style={{ marginBottom: 6 }}>{r.reason}</div>
                        {r.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.description}</div>}
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        {r.resource ? (
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>RESOURCE</span>
                            <div style={{ fontWeight: 600, marginTop: 2 }}>{r.resource.title}</div>
                          </div>
                        ) : r.comment ? (
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>COMMENT</span>
                            <div style={{ color: 'var(--text-secondary)', marginTop: 2, fontStyle: 'italic' }}>"{r.comment.content}"</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unknown</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        {r.reporter?.firstName} {r.reporter?.lastName}
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top', color: 'var(--text-muted)' }}>
                        {formatRelativeTime(r.createdAt)}
                      </td>
                      {filter === 'PENDING' && (
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              onClick={() => resolveMutation.mutate({ id: r.id, status: 'RESOLVED' })}
                              className="btn btn-primary" style={{ padding: '4px 8px', height: 28, fontSize: 11 }}
                              disabled={resolveMutation.isPending}
                            >
                              <Check size={12} /> Resolve
                            </button>
                            <button 
                              onClick={() => resolveMutation.mutate({ id: r.id, status: 'DISMISSED' })}
                              className="btn btn-secondary" style={{ padding: '4px 8px', height: 28, fontSize: 11 }}
                              disabled={resolveMutation.isPending}
                            >
                              <X size={12} /> Dismiss
                            </button>
                          </div>
                        </td>
                      )}
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
