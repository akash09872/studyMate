'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import {
  FileText, CheckCircle, XCircle, RefreshCw, Clock, Eye,
  Download, Star, User, BookOpen, Tag, Loader2, Filter,
  MessageSquare, ChevronRight, ArrowLeft
} from 'lucide-react';
import { formatRelativeTime, formatFileSize, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_CLASSES } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

function ReviewModal({ resource, onClose, onAction }: { resource: any; onClose: () => void; onAction: () => void }) {
  const [note, setNote] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const qc = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/review/${resource.id}/approve`, { note, facultyPick: false }),
    onSuccess: () => { toast.success('✅ Resource approved! Student notified & +50 XP awarded.'); qc.invalidateQueries({ queryKey: ['review-queue'] }); onAction(); onClose(); },
  });
  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/review/${resource.id}/reject`, { reason: note }),
    onSuccess: () => { toast.success('Resource rejected.'); qc.invalidateQueries({ queryKey: ['review-queue'] }); onAction(); onClose(); },
  });
  const changesMutation = useMutation({
    mutationFn: () => api.post(`/review/${resource.id}/request-changes`, { changes: note }),
    onSuccess: () => { toast.success('Changes requested.'); qc.invalidateQueries({ queryKey: ['review-queue'] }); onAction(); onClose(); },
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending || changesMutation.isPending;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal" style={{ maxWidth: 640, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <span className={`badge ${RESOURCE_TYPE_CLASSES[resource.type]}`}>{RESOURCE_TYPE_LABELS[resource.type]}</span>
              <span className="badge badge-warning"><Clock size={10} /> Pending Review</span>
            </div>
            <h2 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>{resource.title}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><XCircle size={18} /></button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{resource.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Subject', value: resource.subject?.name },
            { label: 'Branch/Sem', value: `${resource.branch?.shortName} · Sem ${resource.semester?.number}` },
            { label: 'File Size', value: formatFileSize(resource.fileSize) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        {resource.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
            {resource.tags.map((t: any) => <span key={t.name} className="badge badge-ghost" style={{ fontSize: 10 }}><Tag size={9} />#{t.name}</span>)}
          </div>
        )}

        {/* Uploader */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
            {resource.uploader?.firstName?.[0]}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{resource.uploader?.firstName} {resource.uploader?.lastName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{resource.uploader?.collegeId} · {formatRelativeTime(resource.createdAt)}</div>
          </div>
        </div>

        {/* File preview link */}
        <a href={`${process.env.NEXT_PUBLIC_API_URL}${resource.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginBottom: 20, display: 'inline-flex' }}>
          <Eye size={12} /> Preview File
        </a>

        {/* Note / Reason */}
        <div className="input-group">
          <label className="input-label">
            {action === 'reject' ? 'Rejection Reason *' : action === 'changes' ? 'Changes Required *' : 'Note (Optional)'}
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder={action === 'reject' ? 'Explain why this resource is being rejected...' : action === 'changes' ? 'Describe what changes are needed...' : 'Optional note for the student...'}
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <button
            onClick={() => { setAction('approve'); approveMutation.mutate(); }}
            className="btn btn-primary"
            disabled={isPending}
            style={{ flex: 1 }}
          >
            {approveMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
            Approve
          </button>
          <button
            onClick={() => { setAction('changes'); if (!note) { toast.error('Describe required changes'); return; } changesMutation.mutate(); }}
            className="btn btn-secondary"
            disabled={isPending}
          >
            <RefreshCw size={14} /> Request Changes
          </button>
          <button
            onClick={() => { setAction('reject'); if (!note) { toast.error('Provide rejection reason'); return; } rejectMutation.mutate(); }}
            className="btn btn-danger"
            disabled={isPending}
          >
            <XCircle size={14} /> Reject
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ReviewQueuePage() {
  const { user } = useAuthStore();
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['review-queue', typeFilter],
    queryFn: async () => {
      const params = typeFilter ? `?type=${typeFilter}&limit=20` : '?limit=20';
      const { data } = await api.get(`/review/queue${params}`);
      return data;
    },
    enabled: user?.role === 'FACULTY' || user?.role === 'ADMIN',
  });

  const resources = data?.data || [];
  const total = data?.pagination?.total || 0;

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={22} color="var(--accent)" /> Review Queue
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
              {total} resource{total !== 1 ? 's' : ''} awaiting your review
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="input" style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {['NOTES', 'PYQ', 'LAB_MANUAL', 'PPT', 'BOOK', 'ASSIGNMENT'].map(t => (
                <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 14 }} />)}
          </div>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} color="var(--success)" style={{ opacity: 0.6 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>All caught up!</h3>
            <p style={{ fontSize: 14 }}>No resources pending review.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {resources.map((r: any, i: number) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                onClick={() => setSelectedResource(r)}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {r.type === 'NOTES' ? '📝' : r.type === 'PYQ' ? '📄' : r.type === 'LAB_MANUAL' ? '🔬' : r.type === 'PPT' ? '📊' : '📁'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <span className={`badge ${RESOURCE_TYPE_CLASSES[r.type]}`}>{RESOURCE_TYPE_LABELS[r.type]}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 99 }}>
                      {r.branch?.shortName} · Sem {r.semester?.number}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    by {r.uploader?.firstName} {r.uploader?.lastName} · {formatRelativeTime(r.createdAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 99, fontWeight: 600 }}>
                    <Clock size={10} /> Pending
                  </span>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {selectedResource && (
          <ReviewModal
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
            onAction={() => refetch()}
          />
        )}
      </div>
    </AppShell>
  );
}
