'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Layers, Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBranchesPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', shortName: '' });

  const { data: branches, isLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => { const { data } = await api.get('/admin/branches'); return data.data; },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/branches', data),
    onSuccess: () => { toast.success('Branch added'); qc.invalidateQueries({ queryKey: ['admin-branches'] }); setEditForm({ name: '', shortName: '' }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/admin/branches/${id}`, data),
    onSuccess: () => { toast.success('Branch updated'); qc.invalidateQueries({ queryKey: ['admin-branches'] }); setEditingId(null); },
  });

  return (
    <AppShell>
      <div className="page-container" style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Layers size={22} color="var(--accent)" /> Branches & Semesters
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage academic structure</p>
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add New Branch</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="input-label">Branch Name</label>
              <input className="input" placeholder="Computer Science and Engineering" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="input-group" style={{ width: 140, marginBottom: 0 }}>
              <label className="input-label">Short Code</label>
              <input className="input" placeholder="CSE" value={editForm.shortName} onChange={e => setEditForm({ ...editForm, shortName: e.target.value })} />
            </div>
            <button onClick={() => createMutation.mutate(editForm)} className="btn btn-primary" disabled={!editForm.name || !editForm.shortName || createMutation.isPending} style={{ height: 42 }}>
              {createMutation.isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />} Add
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Branch Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Short Code</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Semesters</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} style={{ padding: 24 }}><div className="skeleton" style={{ height: 40, borderRadius: 8 }} /></td></tr>
              ) : (branches || []).map((b: any) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {editingId === b.id ? (
                    <>
                      <td style={{ padding: '12px 16px' }}><input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ padding: '4px 8px', height: 32 }} /></td>
                      <td style={{ padding: '12px 16px' }}><input className="input" value={editForm.shortName} onChange={e => setEditForm({ ...editForm, shortName: e.target.value })} style={{ padding: '4px 8px', height: 32 }} /></td>
                      <td style={{ padding: '12px 16px' }}>{b.semesters?.length || 0}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => updateMutation.mutate({ id: b.id, data: editForm })} className="btn-icon btn-ghost" style={{ color: 'var(--success)', marginRight: 4 }}><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="btn-icon btn-ghost" style={{ color: 'var(--error)' }}><X size={14} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{b.name}</td>
                      <td style={{ padding: '12px 16px' }}><span className="badge badge-ghost">{b.shortName}</span></td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{b.semesters?.length || 0} configured</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => { setEditingId(b.id); setEditForm({ name: b.name, shortName: b.shortName }); }} className="btn-icon btn-ghost" style={{ marginRight: 4 }}><Edit2 size={14} /></button>
                        <button className="btn-icon btn-ghost" style={{ color: 'var(--error)' }}><Trash2 size={14} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
