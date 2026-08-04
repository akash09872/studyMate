'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Search as SearchIcon, BookOpen, Star, Download, ChevronRight } from 'lucide-react';
import { formatRelativeTime, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_CLASSES } from '@/lib/utils';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['search', activeSearch],
    queryFn: async () => {
      if (activeSearch.length < 2) return null;
      const { data } = await api.get(`/search?q=${activeSearch}&limit=20`);
      return data;
    },
    enabled: activeSearch.length >= 2,
  });

  const results = data?.data?.results || [];
  const total = data?.data?.total || 0;

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <SearchIcon size={28} color="var(--accent)" /> Global Search
          </h1>
          
          <form 
            onSubmit={(e) => { e.preventDefault(); setActiveSearch(query); }}
            style={{ display: 'flex', gap: 12, marginBottom: 32 }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <SearchIcon size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input" 
                placeholder="Search for resources, subjects, or tags..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ paddingLeft: 48, height: 56, fontSize: 16, borderRadius: 16 }}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 56, padding: '0 32px', borderRadius: 16, fontSize: 16 }}>
              Search
            </button>
          </form>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
            </div>
          ) : activeSearch.length >= 2 && results.length === 0 ? (
            <div className="empty-state">
              <SearchIcon size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>No results found</h3>
              <p style={{ fontSize: 14 }}>Try adjusting your search terms or filters.</p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600 }}>
                Found {total} results for "{activeSearch}"
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {results.map((r: any) => (
                  <Link key={r.id} href={`/resources/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                        {r.type === 'NOTES' ? '📝' : r.type === 'PYQ' ? '📄' : r.type === 'LAB_MANUAL' ? '🔬' : r.type === 'PPT' ? '📊' : '📁'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                          <span className={`badge ${RESOURCE_TYPE_CLASSES[r.type]}`}>{RESOURCE_TYPE_LABELS[r.type]}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 99 }}>
                            {r.subject?.name}
                          </span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          by {r.uploader?.firstName} {r.uploader?.lastName} · {formatRelativeTime(r.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 12, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={14} color="#F59E0B" /> {r.averageRating.toFixed(1)}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={14} /> {r.downloadCount}</span>
                        </div>
                        <ChevronRight size={18} color="var(--text-muted)" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : activeSearch.length > 0 && activeSearch.length < 2 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
              Please enter at least 2 characters to search.
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
              <BookOpen size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              Type something above to start searching the platform!
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
