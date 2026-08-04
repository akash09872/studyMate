'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { BookOpen, Search, Trash2, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { formatRelativeTime, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_CLASSES } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminResourcesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-resources', statusFilter, page],
    queryFn: async () => {
      const statusParam = statusFilter ? `&status=${statusFilter}` : '';
      const { data } = await api.get(`/admin/resources?page=${page}&limit=20${statusParam}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/resources/${id}`),
    onSuccess: () => { 
      toast.success('Resource deleted successfully'); 
      qc.invalidateQueries({ queryKey: ['admin-resources'] }); 
    },
    onError: () => toast.error('Failed to delete resource'),
  });

  const resources = data?.data || [];
  const pagination = data?.pagination;

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={22} color="var(--accent)" /> Resource Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>View and manage all uploaded resources</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <select className="input" style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Resource</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Uploader</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Subject / Branch</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Upload Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={6} style={{ padding: 16 }}><div className="skeleton" style={{ height: 32, borderRadius: 8 }} /></td>
                    </tr>
                  ))
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No resources found.</td>
                  </tr>
                ) : (
                  resources.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`badge ${RESOURCE_TYPE_CLASSES[r.type]}`}>{RESOURCE_TYPE_LABELS[r.type]}</span>
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, display: 'inline-block' }}>{r.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{r.uploader?.firstName} {r.uploader?.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{r.uploader?.collegeId}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontWeight: 500 }}>{r.subject?.name}</div>
                        <div style={{ fontSize: 11 }}>{r.branch?.shortName}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${r.status === 'APPROVED' ? 'badge-accent' : r.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                          {r.status === 'APPROVED' ? <CheckCircle size={10} /> : r.status === 'PENDING' ? <Clock size={10} /> : <XCircle size={10} />}
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formatRelativeTime(r.createdAt)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button 
                          className="btn-icon btn-danger" 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to completely delete this resource? This cannot be undone.')) {
                              deleteMutation.mutate(r.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} resources
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev} className="btn btn-secondary btn-sm">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn btn-secondary btn-sm">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
