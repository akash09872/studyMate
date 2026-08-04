'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { ClipboardList, Plus, Clock, Users, FileText, Loader2, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function FacultyAssignmentsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', marks: '', branchId: '', semesterId: '', subjectId: '' });
  const [files, setFiles] = useState<FileList | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['faculty-assignments'],
    queryFn: async () => {
      const { data } = await api.get('/assignments?role=faculty');
      return data;
    },
  });

  const { data: branches } = useQuery({ queryKey: ['branches-public'], queryFn: async () => { const { data } = await api.get('/branches'); return data.data; } });
  const { data: semesters } = useQuery({ queryKey: ['semesters', form.branchId], queryFn: async () => { if (!form.branchId) return []; const b = branches?.find((x: any) => x.id === form.branchId); return b?.semesters || []; }, enabled: !!form.branchId && !!branches });
  const { data: subjects } = useQuery({
    queryKey: ['subjects', form.branchId, form.semesterId],
    queryFn: async () => { const { data } = await api.get(`/subjects?branchId=${form.branchId}&semesterId=${form.semesterId}`); return data.data; },
    enabled: !!form.branchId && !!form.semesterId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (files) {
        Array.from(files).forEach(f => fd.append('attachments', f));
      }
      const { data } = await api.post('/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data;
    },
    onSuccess: () => {
      toast.success('Assignment created successfully');
      setShowModal(false);
      setForm({ title: '', description: '', deadline: '', marks: '', branchId: '', semesterId: '', subjectId: '' });
      setFiles(null);
      qc.invalidateQueries({ queryKey: ['faculty-assignments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create assignment'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/assignments/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Assignment deleted successfully');
      qc.invalidateQueries({ queryKey: ['faculty-assignments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete assignment'),
  });

  const assignments = data?.data || [];

  return (
    <AppShell>
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardList size={22} color="var(--accent)" /> Assignments
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage and grade student assignments</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} /> Create Assignment
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>No assignments yet</h3>
            <p style={{ fontSize: 14 }}>Create your first assignment to start evaluating students.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {assignments.map((a: any) => (
              <div key={a.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {a.subject?.name}
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{a.title}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`badge ${new Date(a.deadline) > new Date() ? 'badge-primary' : 'badge-ghost'}`}>
                      <Clock size={12} /> {new Date(a.deadline).toLocaleDateString()}
                    </div>
                    <button 
                      className="btn btn-ghost btn-icon" 
                      style={{ color: '#ef4444', padding: 4, minHeight: 'auto', minWidth: 'auto', height: 28, width: 28 }}
                      title="Delete Assignment"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this assignment?')) {
                          deleteMutation.mutate(a.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {a.description}
                </p>

                <div style={{ display: 'flex', gap: 16, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                    <Users size={14} /> {a.submissions?.length || 0} Submissions
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                    <FileText size={14} /> {a.marks} Marks
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal" style={{ maxWidth: 600, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create Assignment</h2>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon"><X size={16} /></button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Title *</label>
                  <input className="input" placeholder="e.g., Assignment 1: Data Structures" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Description *</label>
                  <textarea className="input" rows={3} placeholder="Assignment instructions..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>

                <div className="input-group">
                  <label className="input-label">Deadline *</label>
                  <input type="date" className="input" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>

                <div className="input-group">
                  <label className="input-label">Total Marks *</label>
                  <input type="number" className="input" placeholder="e.g., 100" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: e.target.value }))} />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Branch *</label>
                  <select className="input" value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value, semesterId: '', subjectId: '' }))}>
                    <option value="">Select branch</option>
                    {(branches || []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Semester *</label>
                  <select className="input" value={form.semesterId} onChange={e => setForm(f => ({ ...f, semesterId: e.target.value, subjectId: '' }))} disabled={!form.branchId}>
                    <option value="">Select semester</option>
                    {(semesters || []).map((s: any) => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Subject *</label>
                  <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} disabled={!form.semesterId}>
                    <option value="">Select subject</option>
                    {(subjects || []).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Attachments (Optional)</label>
                  <input type="file" multiple className="input" onChange={e => setFiles(e.target.files)} style={{ padding: '8px 12px', background: 'var(--bg-card)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
                <button onClick={() => createMutation.mutate()} className="btn btn-primary" disabled={createMutation.isPending || !form.title || !form.description || !form.deadline || !form.marks || !form.subjectId}>
                  {createMutation.isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Create Assignment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
