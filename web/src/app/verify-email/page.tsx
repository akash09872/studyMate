'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

import { Suspense } from 'react';

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (newOtp.every(d => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleVerify = async (code?: string) => {
    const finalOtp = code || otp.join('');
    if (finalOtp.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, otp: finalOtp });
      toast.success('Email verified! You can now log in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('OTP resent! Check your email.');
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} color="#000" />
            </div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18 }}>Study<span style={{ color: 'var(--accent)' }}>Mate</span></span>
          </Link>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Verify Your Email</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            We sent a 6-digit code to<br />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{email}</span>
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                maxLength={1}
                style={{
                  width: 52, height: 60, textAlign: 'center', fontSize: 24, fontWeight: 700,
                  background: 'var(--bg-input)', border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 12, color: 'var(--text-primary)', outline: 'none', transition: 'all 0.15s',
                  fontFamily: 'Outfit',
                }}
                onFocus={e => e.target.select()}
              />
            ))}
          </div>

          <button
            onClick={() => handleVerify()}
            className="btn btn-primary"
            style={{ width: '100%', height: 48, marginBottom: 16 }}
            disabled={loading || otp.some(d => !d)}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Verify Email'}
          </button>

          <button onClick={resend} className="btn btn-ghost" style={{ width: '100%' }} disabled={resending}>
            <RefreshCw size={14} /> {resending ? 'Resending...' : "Didn't receive it? Resend"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}><Loader2 className="animate-spin" color="var(--accent)" /></div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
