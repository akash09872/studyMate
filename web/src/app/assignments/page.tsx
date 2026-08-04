'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { FileText, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

export default function AssignmentsPage() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => { const { data } = await api.get('/assignments?limit=20'); return data.data; },
  });

  return (
    <AppShell>
      <div className="page-container" style={{ maxWidth: 860 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} color="var(--accent)" /> Assignments
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Keep track of your academic tasks and deadlines</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
          </div>
        ) : !assignments?.length ? (
          <div className="empty-state">
            <CheckCircle size={48} color="var(--success)" style={{ opacity: 0.6 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>No assignments due</h3>
            <p style={{ fontSize: 14 }}>You're all caught up! Enjoy your free time.</p>
          </div>
        ) : (
          <div className="grid-2" style={{ gap: 16 }}>
            {assignments.map((a: any) => {
              const isOverdue = new Date(a.dueDate) < new Date();
              return (
                <div key={a.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span className="badge badge-ghost" style={{ marginBottom: 8, display: 'inline-flex' }}>{a.subject?.name}</span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{a.title}</h3>
                    </div>
                    <span className={`badge ${isOverdue ? 'badge-error' : 'badge-warning'}`} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isOverdue ? <AlertCircle size={10} /> : <Clock size={10} />}
                      {isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{a.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isOverdue ? 'var(--error)' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                      <Calendar size={12} /> Due {formatRelativeTime(a.dueDate)}
                    </div>
                    {a.resource && (
                      <Link href={`/resources/${a.resource.id}`} className="btn btn-secondary btn-sm">
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
