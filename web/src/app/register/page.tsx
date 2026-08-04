'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ role: 'STUDENT', firstName: '', lastName: '', email: '', collegeId: '', password: '', branchId: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => { const { data } = await api.get('/branches'); return data.data; },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('Account created successfully! Please log in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: 'none', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', padding: 48, flexDirection: 'column', justifyContent: 'center' }} className="hide-mobile">
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={18} color="#000" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 20 }}>Study<span style={{ color: 'var(--accent)' }}>Mate</span></span>
            </div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 28, marginBottom: 12 }}>Join 50,000+ students</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>Access faculty-verified study materials, earn XP, and contribute to your college community.</p>
          </div>
          {[
            { icon: '📚', title: 'Browse 10,000+ Resources', desc: 'Notes, PYQs, lab manuals, and more' },
            { icon: '🏆', title: 'Earn Rewards', desc: 'Upload materials and gain XP, badges, and ranks' },
            { icon: '✅', title: 'Faculty Verified', desc: 'Every resource reviewed by professors' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{f.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 440 }}
        >
          <div style={{ marginBottom: 32 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 32 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={14} color="#000" />
              </div>
              <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16 }}>Study<span style={{ color: 'var(--accent)' }}>Mate</span></span>
            </Link>
            <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Create your account</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Already have one? <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Log in</Link></p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              {['STUDENT', 'FACULTY'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => update('role', role)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${form.role === role ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.role === role ? 'var(--accent-subtle)' : 'var(--bg-input)', color: form.role === role ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  I am a {role === 'STUDENT' ? 'Student' : 'Faculty'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">First Name</label>
                <input className="input" placeholder="Arjun" value={form.firstName} onChange={e => update('firstName', e.target.value)} required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Last Name</label>
                <input className="input" placeholder="Mehta" value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="you@college.edu" value={form.email} onChange={e => update('email', e.target.value)} required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">College ID</label>
              <input className="input" placeholder={form.role === 'STUDENT' ? '123456789' : 'FAC-123'} value={form.collegeId} onChange={e => update('collegeId', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Branch</label>
              <select className="input" value={form.branchId} onChange={e => update('branchId', e.target.value)}>
                <option value="">Select your branch</option>
                {(branches || []).map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.shortName})</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 4, height: 48 }} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              By creating an account you agree to our{' '}
              <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms of Service</a> and{' '}
              <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</a>.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
