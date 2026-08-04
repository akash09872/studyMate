'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import {
  Search, Filter, Download, Star, Eye, Bookmark,
  BookOpen, X, SlidersHorizontal, TrendingUp, Clock,
  CheckCircle, Upload
} from 'lucide-react';
import { formatNumber, formatRelativeTime, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_CLASSES } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const RESOURCE_TYPES = ['NOTES', 'PYQ', 'LAB_MANUAL', 'ASSIGNMENT', 'PPT', 'BOOK', 'CHEAT_SHEET', 'PRACTICAL_FILE', 'MINI_PROJECT', 'MAJOR_PROJECT', 'SYLLABUS'];

function ResourceCard({ resource, onBookmark }: { resource: any; onBookmark: (id: string, bookmarked: boolean) => void }) {
  const { user } = useAuthStore();
  const [bookmarked, setBookmarked] = useState(resource.isBookmarked || false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Login to bookmark'); return; }
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${resource.id}`);
        setBookmarked(false);
        toast.success('Bookmark removed');
      } else {
        await api.post('/bookmarks', { resourceId: resource.id });
        setBookmarked(true);
        toast.success('Bookmarked!');
      }
    } catch { toast.error('Failed to update bookmark'); }
  };

  const typeIcon: Record<string, string> = {
    NOTES: '📝', PYQ: '📄', LAB_MANUAL: '🔬', PPT: '📊', BOOK: '📚',
    CHEAT_SHEET: '📌', ASSIGNMENT: '📋', PRACTICAL_FILE: '💻',
    MINI_PROJECT: '🧪', MAJOR_PROJECT: '🏗️', SYLLABUS: '📒',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="card"
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {typeIcon[resource.type] || '📁'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <span className={`badge ${RESOURCE_TYPE_CLASSES[resource.type]}`}>{RESOURCE_TYPE_LABELS[resource.type]}</span>
            {resource.isVerified && <span className="badge badge-accent" style={{ fontSize: 10 }}>✓ Verified</span>}
            {resource.facultyPick && <span className="badge badge-warning" style={{ fontSize: 10 }}>⭐ Faculty Pick</span>}
          </div>
          <Link href={`/resources/${resource.id}`} style={{ textDecoration: 'none' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {resource.title}
            </h3>
          </Link>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {resource.subject?.name} · Sem {resource.semester?.number} · {resource.branch?.shortName}
          </div>
        </div>
        <button onClick={handleBookmark} className="btn-icon btn-ghost" style={{ flexShrink: 0 }}>
          <Bookmark size={14} fill={bookmarked ? 'var(--accent)' : 'none'} color={bookmarked ? 'var(--accent)' : 'var(--text-muted)'} />
        </button>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {resource.description}
      </p>

      {/* Tags */}
      {resource.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {resource.tags.slice(0, 4).map((t: any) => (
            <span key={t.name} className="badge badge-ghost" style={{ fontSize: 10 }}>#{t.name}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} />{formatNumber(resource.viewCount)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Download size={10} />{formatNumber(resource.downloadCount)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={10} fill={resource.averageRating >= 4 ? 'var(--accent)' : 'none'} color="var(--accent)" />{resource.averageRating?.toFixed(1) || '—'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {resource.uploader?.avatarUrl
            ? <img src={resource.uploader.avatarUrl} className="avatar avatar-sm" alt="" />
            : <div className="avatar avatar-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{resource.uploader?.firstName?.[0]}</div>
          }
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRelativeTime(resource.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResourcesPage() {
  const [filters, setFilters] = useState({ search: '', type: '', sortBy: 'createdAt', branchId: '', semesterId: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();

  const queryKey = ['resources', filters, page];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        ...filters,
        page: page.toString(),
        limit: '12',
      });
      const { data } = await api.get(`/resources?${params}`);
      return data;
    },
  });

  const resources = data?.data || [];
  const pagination = data?.pagination;

  const updateFilter = (k: string, v: string) => {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
  };

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800 }}>Resource Library</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                {pagination?.total ? `${pagination.total.toLocaleString()} resources available` : 'Loading...'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowFilters(!showFilters)} className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}>
                <SlidersHorizontal size={14} /> Filters
              </button>
              {user && <Link href="/upload" className="btn btn-primary btn-sm"><Upload size={14} /> Upload</Link>}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              placeholder="Search notes, PYQs, lab manuals..."
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              style={{ paddingLeft: 44 }}
            />
            {filters.search && (
              <button onClick={() => updateFilter('search', '')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort tabs */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { label: 'Latest', value: 'createdAt', icon: Clock },
              { label: 'Most Downloaded', value: 'downloadCount', icon: TrendingUp },
              { label: 'Top Rated', value: 'averageRating', icon: Star },
            ].map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updateFilter('sortBy', value)}
                className={`btn btn-sm ${filters.sortBy === value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flexShrink: 0 }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
            style={{ padding: 20, marginBottom: 20 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Resource Type</label>
                <select className="input" value={filters.type} onChange={e => updateFilter('type', e.target.value)}>
                  <option value="">All Types</option>
                  {RESOURCE_TYPES.map(t => <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Semester</label>
                <select className="input" value={filters.semesterId} onChange={e => updateFilter('semesterId', e.target.value)}>
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>Semester {s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => { setFilters({ search: '', type: '', sortBy: 'createdAt', branchId: '', semesterId: '' }); setPage(1); }} className="btn btn-ghost btn-sm">
                <X size={12} /> Reset Filters
              </button>
            </div>
          </motion.div>
        )}

        {/* Resource Type Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 20 }}>
          <button onClick={() => updateFilter('type', '')} className={`badge ${!filters.type ? 'badge-accent' : 'badge-ghost'}`} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>All</button>
          {RESOURCE_TYPES.map(t => (
            <button key={t} onClick={() => updateFilter('type', filters.type === t ? '' : t)} className={`badge ${filters.type === t ? 'badge-accent' : 'badge-ghost'}`} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {RESOURCE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid-auto">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>No resources found</h3>
            <p style={{ fontSize: 14 }}>Try adjusting your filters or search terms</p>
            {user && <Link href="/upload" className="btn btn-primary" style={{ marginTop: 8 }}><Upload size={14} /> Upload the first one</Link>}
          </div>
        ) : (
          <div className="grid-auto">
            {resources.map((r: any) => (
              <ResourceCard key={r.id} resource={r} onBookmark={() => {}} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev} className="btn btn-secondary btn-sm">← Prev</button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, pagination.totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => setPage(p)} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn btn-secondary btn-sm">Next →</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
