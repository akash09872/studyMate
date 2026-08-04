'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bookmark, FolderOpen, Trash2, Plus, BookOpen, Grid, List } from 'lucide-react';
import { formatRelativeTime, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_CLASSES } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BookmarksPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeCollection, setActiveCollection] = useState<string>('all');

  const { data: collections } = useQuery({
    queryKey: ['bookmark-collections'],
    queryFn: async () => { const { data } = await api.get('/bookmarks/collections'); return data.data; },
    enabled: !!user,
  });

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks', activeCollection],
    queryFn: async () => {
      const params = activeCollection !== 'all' ? `?collectionId=${activeCollection}` : '';
      const { data } = await api.get(`/bookmarks${params}`);
      return data.data;
    },
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: (resourceId: string) => api.delete(`/bookmarks/${resourceId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookmarks'] }); toast.success('Bookmark removed'); },
  });

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bookmark size={22} color="var(--accent)" /> Bookmarks
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
              {bookmarks?.length || 0} saved resources
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} className="btn btn-secondary btn-sm">
              {view === 'grid' ? <List size={14} /> : <Grid size={14} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Collections sidebar */}
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px', marginBottom: 4 }}>Collections</div>
            {[{ id: 'all', name: 'All Bookmarks', isDefault: false }, ...(collections || [])].map((c: any) => (
              <button
                key={c.id}
                onClick={() => setActiveCollection(c.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none',
                  background: activeCollection === c.id ? 'var(--accent-subtle)' : 'transparent',
                  color: activeCollection === c.id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: activeCollection === c.id ? 600 : 400, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <FolderOpen size={13} /> {c.name}
              </button>
            ))}
          </div>

          {/* Bookmarks grid/list */}
          <div>
            {isLoading ? (
              <div className={view === 'grid' ? 'grid-auto' : 'flex flex-col gap-2'}>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: view === 'grid' ? 160 : 72, borderRadius: 14 }} />)}
              </div>
            ) : !bookmarks?.length ? (
              <div className="empty-state">
                <Bookmark size={48} />
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>No bookmarks yet</h3>
                <p style={{ fontSize: 14 }}>Save resources to access them quickly later</p>
                <Link href="/resources" className="btn btn-primary" style={{ marginTop: 8 }}><BookOpen size={14} /> Browse Resources</Link>
              </div>
            ) : view === 'grid' ? (
              <div className="grid-auto">
                {bookmarks.map((b: any, i: number) => (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card" style={{ padding: 16, position: 'relative' }}>
                    <button onClick={() => removeMutation.mutate(b.resource.id)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                      <Trash2 size={13} />
                    </button>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>
                      {b.resource.type === 'NOTES' ? '📝' : b.resource.type === 'PYQ' ? '📄' : '📁'}
                    </div>
                    <span className={`badge ${RESOURCE_TYPE_CLASSES[b.resource.type]}`} style={{ marginBottom: 8, display: 'inline-flex' }}>{RESOURCE_TYPE_LABELS[b.resource.type]}</span>
                    <Link href={`/resources/${b.resource.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.resource.title}</div>
                    </Link>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRelativeTime(b.createdAt)}</div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bookmarks.map((b: any, i: number) => (
                  <motion.div key={b.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{b.resource.type === 'NOTES' ? '📝' : '📁'}</span>
                    <span className={`badge ${RESOURCE_TYPE_CLASSES[b.resource.type]}`}>{RESOURCE_TYPE_LABELS[b.resource.type]}</span>
                    <Link href={`/resources/${b.resource.id}`} style={{ textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{b.resource.title}</Link>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatRelativeTime(b.createdAt)}</span>
                    <button onClick={() => removeMutation.mutate(b.resource.id)} className="btn-icon btn-ghost" style={{ width: 28, height: 28 }}><Trash2 size={12} /></button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
