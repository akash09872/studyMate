'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { useRouter } from 'next/navigation';
import { Upload, FileText, X, CheckCircle, Loader2, ArrowLeft, ArrowRight, Tag, Info } from 'lucide-react';
import { toast } from 'sonner';
import { RESOURCE_TYPE_LABELS } from '@/lib/utils';

const STEPS = ['File & Type', 'Academic Info', 'Details & Tags', 'Review'];
const RESOURCE_TYPES = ['NOTES', 'PYQ', 'LAB_MANUAL', 'ASSIGNMENT', 'PPT', 'BOOK', 'CHEAT_SHEET', 'PRACTICAL_FILE', 'MINI_PROJECT', 'MAJOR_PROJECT', 'SYLLABUS', 'REFERENCE'];

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: '', subjectId: '', branchId: '', semesterId: '', unit: '', author: '', tags: '',
  });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: branches } = useQuery({ queryKey: ['branches-public'], queryFn: async () => { const { data } = await api.get('/branches'); return data.data; } });
  const { data: semesters } = useQuery({ queryKey: ['semesters', form.branchId], queryFn: async () => { if (!form.branchId) return []; const b = branches?.find((x: any) => x.id === form.branchId); return b?.semesters || []; }, enabled: !!form.branchId && !!branches });
  const { data: subjects } = useQuery({
    queryKey: ['subjects', form.branchId, form.semesterId],
    queryFn: async () => { const { data } = await api.get(`/subjects?branchId=${form.branchId}&semesterId=${form.semesterId}`); return data.data; },
    enabled: !!form.branchId && !!form.semesterId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      if (thumbnail) fd.append('thumbnail', thumbnail);
      const { data } = await api.post('/resources', fd, {
        headers: { 'Content-Type': undefined }
      });
      return data.data;
    },
    onSuccess: () => {
      toast.success('🎉 Resource uploaded! Pending faculty review.');
      router.push('/resources');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const canNext = [
    !!file && !!form.type,
    !!form.branchId && !!form.semesterId && !!form.subjectId,
    !!form.title && !!form.description,
    true,
  ][step];

  return (
    <AppShell>
      <div className="page-container" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <button onClick={() => router.back()} className="btn btn-ghost btn-icon"><ArrowLeft size={16} /></button>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800 }}>Upload Resource</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Share knowledge and earn XP when it gets approved.</p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{
                height: 4, borderRadius: 2,
                background: i < step ? 'var(--accent)' : i === step ? 'var(--accent)' : 'var(--bg-elevated)',
                transition: 'background 0.3s',
              }} />
              <div style={{ fontSize: 11, color: i <= step ? 'var(--accent)' : 'var(--text-muted)', fontWeight: i === step ? 700 : 400 }}>{s}</div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* ─── Step 0: File & Type ─────────────────────────────────────── */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => document.getElementById('file-input')?.click()}
                  style={{
                    border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--border-accent)' : 'var(--border)'}`,
                    borderRadius: 16, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                    background: dragging ? 'var(--accent-subtle)' : file ? 'rgba(200,241,53,0.04)' : 'var(--bg-card)',
                    transition: 'all 0.2s',
                  }}
                >
                  <input id="file-input" type="file" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                  {file ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={40} color="var(--accent)" />
                      <div style={{ fontWeight: 700 }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                        <X size={12} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Upload size={40} color="var(--text-muted)" />
                      <div style={{ fontWeight: 600 }}>Drop file here or <span style={{ color: 'var(--accent)' }}>browse</span></div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, DOCX, PPTX, MP4 up to 50MB</div>
                    </div>
                  )}
                </div>

                {/* Resource Type */}
                <div>
                  <label className="input-label">Resource Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                    {RESOURCE_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => update('type', t)}
                        style={{
                          padding: '10px 12px', borderRadius: 10, border: `1px solid ${form.type === t ? 'var(--accent)' : 'var(--border)'}`,
                          background: form.type === t ? 'var(--accent-subtle)' : 'var(--bg-card)',
                          color: form.type === t ? 'var(--accent)' : 'var(--text-secondary)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {RESOURCE_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 1: Academic Info ───────────────────────────────────── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Branch *</label>
                  <select className="input" value={form.branchId} onChange={e => update('branchId', e.target.value)}>
                    <option value="">Select branch</option>
                    {(branches || []).map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.shortName})</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Semester *</label>
                  <select className="input" value={form.semesterId} onChange={e => update('semesterId', e.target.value)} disabled={!form.branchId}>
                    <option value="">Select semester</option>
                    {(semesters || []).map((s: any) => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Subject *</label>
                  <select className="input" value={form.subjectId} onChange={e => update('subjectId', e.target.value)} disabled={!form.semesterId}>
                    <option value="">Select subject</option>
                    {(subjects || []).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Unit (Optional)</label>
                  <input className="input" placeholder="e.g., Unit 1, Unit 2" value={form.unit} onChange={e => update('unit', e.target.value)} />
                </div>
              </div>
            )}

            {/* ─── Step 2: Details & Tags ───────────────────────────────────── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input className="input" placeholder="e.g., Data Structures Complete Notes Unit 1-5" value={form.title} onChange={e => update('title', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Description *</label>
                  <textarea className="input" placeholder="Describe what this resource covers..." value={form.description} onChange={e => update('description', e.target.value)} rows={4} style={{ resize: 'vertical' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Author / Source</label>
                  <input className="input" placeholder="e.g., Prof. Sharma, NPTEL" value={form.author} onChange={e => update('author', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Tags (comma separated)</label>
                  <input className="input" placeholder="e.g., arrays, sorting, complexity" value={form.tags} onChange={e => update('tags', e.target.value)} />
                  {form.tags && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {form.tags.split(',').filter(t => t.trim()).map(t => (
                        <span key={t} className="badge badge-ghost"><Tag size={9} />#{t.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Step 3: Review ───────────────────────────────────────────── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--accent)' }}>Review Your Upload</h3>
                  {[
                    { label: 'Title', value: form.title },
                    { label: 'Type', value: RESOURCE_TYPE_LABELS[form.type] },
                    { label: 'Subject', value: subjects?.find((s: any) => s.id === form.subjectId)?.name },
                    { label: 'File', value: file?.name },
                    { label: 'Tags', value: form.tags || 'None' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: 16, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 80 }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)', borderRadius: 12, padding: 16, display: 'flex', gap: 10 }}>
                  <Info size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Your resource will be placed in the <strong style={{ color: 'var(--accent)' }}>faculty review queue</strong>. Once approved, you'll earn <strong>+50 XP</strong> and it becomes publicly visible.
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary" disabled={step === 0}>
            <ArrowLeft size={14} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn btn-primary" disabled={!canNext}>
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={() => uploadMutation.mutate()} className="btn btn-primary" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</> : <><Upload size={14} /> Submit for Review</>}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
