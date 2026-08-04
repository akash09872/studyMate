'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Users, Search, Shield, Ban, CheckCircle, MoreVertical } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: async () => {
      const { data } = await api.get(`/admin/users?search=${search}&page=${page}&limit=20`);
      return data;
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string, role: string }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { toast.success('User role updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: (res) => { toast.success(res.data.message || 'Status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { toast.success('User deleted completely'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={22} color="var(--accent)" /> User Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage users, roles, and access</p>
          </div>
          <div className="input-group" style={{ marginBottom: 0, width: 280 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" placeholder="Search users by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36 }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>User</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Branch / Sem</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Joined</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={6} style={{ padding: 16 }}><div className="skeleton" style={{ height: 32, borderRadius: 8 }} /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No users found matching "{search}"</td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--accent)' }}>
                            {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : u.firstName[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          className="input"
                          style={{ padding: '4px 8px', fontSize: 12, width: 'auto', background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.1)' : u.role === 'FACULTY' ? 'rgba(52,211,153,0.1)' : 'var(--bg-elevated)', border: 'none', color: u.role === 'ADMIN' ? '#EF4444' : u.role === 'FACULTY' ? '#34D399' : 'var(--text-primary)' }}
                          value={u.role}
                          onChange={e => roleMutation.mutate({ id: u.id, role: e.target.value })}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="FACULTY">Faculty</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {u.branch ? `${u.branch.shortName} · S${u.currentSemester}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className={`badge ${u.emailVerified ? 'badge-accent' : 'badge-ghost'}`} style={{ fontSize: 10 }}>
                            {u.emailVerified ? <CheckCircle size={10} /> : <Ban size={10} />}
                            {u.emailVerified ? 'Verified' : 'Unverified'}
                          </span>
                          {!u.isActive && (
                            <span className="badge badge-ghost" style={{ fontSize: 10, color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                              <Ban size={10} /> Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formatRelativeTime(u.createdAt)}</td>
                      <td style={{ padding: '12px 16px', position: 'relative' }}>
                        <button 
                          className="btn-icon btn-ghost" 
                          onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {openDropdown === u.id && (
                          <div style={{ position: 'absolute', right: 16, top: 40, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 120 }}>
                            <button 
                              style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', color: u.isActive ? '#EF4444' : '#34D399', cursor: 'pointer', borderRadius: 4, fontSize: 13, fontWeight: 500 }}
                              onClick={() => { toggleMutation.mutate(u.id); setOpenDropdown(null); }}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', borderRadius: 4, fontSize: 13, fontWeight: 500, marginTop: 4 }}
                              onClick={() => { 
                                if (window.confirm('Are you sure you want to completely delete this user? This action cannot be undone.')) {
                                  deleteMutation.mutate(u.id); 
                                }
                                setOpenDropdown(null); 
                              }}
                            >
                              Delete User
                            </button>
                          </div>
                        )}
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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
