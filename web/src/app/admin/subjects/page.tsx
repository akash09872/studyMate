'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { BookMarked, Plus, MoreVertical } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminSubjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: async () => {
      const { data } = await api.get('/admin/subjects?limit=50');
      return data;
    },
  });

  const subjects = data?.data || [];

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookMarked size={22} color="var(--accent)" /> Subject Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage all academic subjects</p>
          </div>
          <button className="btn btn-primary">
            <Plus size={16} /> Add Subject
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Code</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Subject Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Branch / Sem</th>
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
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No subjects found.</td>
                  </tr>
                ) : (
                  subjects.map((s: any) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--accent)' }}>{s.code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {s.branch?.shortName} • Sem {s.semester?.number}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formatRelativeTime(s.createdAt)}</td>
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
