'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [collegeId, setCollegeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(collegeId, password);
      toast.success(`Welcome back, ${user.firstName}! 👋`);
      if (user.role === 'ADMIN') router.push('/admin/dashboard');
      else if (user.role === 'FACULTY') router.push('/faculty/review');
      else router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24, position: 'relative' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,241,53,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color="#000" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 22 }}>Study<span style={{ color: 'var(--accent)' }}>Mate</span></span>
          </Link>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            New here?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Create an account</Link>
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {/* Demo credentials */}
          <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>🧪 Demo Credentials</div>
            <div>Student: <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>student_123 / Student@123</span></div>
            <div>Faculty: <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>faculty_456 / Faculty@123</span></div>
            <div>Admin: <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>admin_001 / Admin@123</span></div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">College ID or Email</label>
              <input className="input" type="text" placeholder="Your College ID or Email Address" value={collegeId} onChange={e => setCollegeId(e.target.value)} required autoFocus />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="input-label" style={{ margin: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: 48, marginTop: 4 }} disabled={loading}>
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Logging in...</>
                : <><span>Log in to StudyMate</span><ArrowRight size={16} /></>
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
          By logging in you agree to our Terms & Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
