'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Upload, Trophy, Star, Shield, Zap, Users,
  Download, CheckCircle, ArrowRight, GraduationCap,
  FileText, Award, TrendingUp, Search, Bell, ChevronRight
} from 'lucide-react';

const stats = [
  { value: '50K+', label: 'Students' },
  { value: '10K+', label: 'Resources' },
  { value: '500+', label: 'Faculty' },
  { value: '95%', label: 'Approval Rate' },
];

const features = [
  { icon: BookOpen, title: 'Semester-wise Library', desc: 'Browse resources organized by branch, semester, and subject — instantly find what you need.' },
  { icon: Shield, title: 'Faculty Verified', desc: 'Every resource passes through faculty review before going live. Quality guaranteed.' },
  { icon: Trophy, title: 'Earn as You Learn', desc: 'Upload quality content, earn XP, unlock badges, and climb the leaderboard.' },
  { icon: Upload, title: 'Easy Uploads', desc: 'Upload notes, PYQs, lab manuals, and more in under 2 minutes with our smart upload wizard.' },
  { icon: Star, title: 'Rate & Review', desc: 'Community-driven ratings help surface the best resources and reward top contributors.' },
  { icon: Zap, title: 'Lightning Search', desc: 'Find any resource instantly with intelligent full-text search, tag filtering, and smart suggestions.' },
];

const resourceTypes = [
  { emoji: '📝', label: 'Notes' },
  { emoji: '📋', label: 'Assignments' },
  { emoji: '📄', label: 'PYQs' },
  { emoji: '🔬', label: 'Lab Manuals' },
  { emoji: '💻', label: 'Practicals' },
  { emoji: '📊', label: 'PPTs' },
  { emoji: '📚', label: 'Books' },
  { emoji: '📌', label: 'Cheat Sheets' },
];

const testimonials = [
  { name: 'Arjun Mehta', role: 'CSE 4th Year', avatar: 'AM', text: 'StudyMate saved me during exam season! I found all the PYQs for my semester in minutes instead of hours.' },
  { name: 'Priya Patel', role: 'IT 2nd Year', avatar: 'PP', text: 'I uploaded my notes and earned 500 XP in a week. The reward system actually makes you want to contribute!' },
  { name: 'Dr. Rajesh Sharma', role: 'Faculty, CSE', avatar: 'RS', text: 'The review workflow is seamless. I can approve quality materials and keep the library clean and reliable.' },
];

const faqs = [
  { q: 'Is StudyMate free to use?', a: 'Yes! StudyMate is completely free for all students and faculty members of the college.' },
  { q: 'How do resources get verified?', a: 'Every uploaded resource goes through a faculty review queue. Only approved resources become publicly visible.' },
  { q: 'How do I earn points?', a: 'You earn XP for verified uploads, high ratings, download milestones, helpful comments, and daily logins.' },
  { q: 'Can faculty upload official materials?', a: 'Yes! Faculty can upload official notes, assignments, answer keys, and lab manuals with special verified status.' },
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ─── Navbar ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} color="#000" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 20 }}>
              Study<span style={{ color: 'var(--accent)' }}>Mate</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 128, paddingBottom: 80, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,241,53,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge badge-accent" style={{ marginBottom: 24, display: 'inline-flex' }}>
              <Zap size={12} /> Now in Beta — Join 50,000+ Students
            </span>
          </motion.div>

          <motion.h1
            className="heading-display"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ marginBottom: 24, letterSpacing: '-0.03em' }}
          >
            The Academic Hub{' '}
            <span className="text-gradient">Your College Deserves</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="body-lg"
            style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}
          >
            Semester-wise notes, PYQs, lab manuals, and assignments — all faculty-verified.
            Contribute resources, earn rewards, and help your entire college.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Learning Free <ArrowRight size={18} />
            </Link>
            <Link href="/resources" className="btn btn-secondary btn-lg">
              Browse Resources
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div style={{ fontFamily: 'Outfit', fontSize: 36, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Resource Types ────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="heading-2" style={{ marginBottom: 12 }}>Everything You Need to Study</h2>
            <p style={{ color: 'var(--text-secondary)' }}>12+ resource types organized the way your syllabus works</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
            {resourceTypes.map((rt, i) => (
              <motion.div
                key={rt.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="card"
                style={{ padding: '20px 12px', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{rt.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{rt.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 className="heading-2" style={{ marginBottom: 12 }}>Built for Academic Excellence</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Every feature designed with students and faculty in mind</p>
          </div>
          <div className="grid-3" style={{ gap: 20 }}>
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="card"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  style={{ padding: 28 }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                  }}>
                    <Icon size={20} color="var(--accent)" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{feature.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Gamification Banner ───────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              background: 'linear-gradient(135deg, rgba(200,241,53,0.08) 0%, rgba(200,241,53,0.03) 100%)',
              border: '1px solid var(--border-accent)',
              borderRadius: 24, padding: '48px 56px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center',
            }}
          >
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 20, display: 'inline-flex' }}>
                <Trophy size={12} /> Reward System
              </span>
              <h2 className="heading-2" style={{ marginBottom: 16 }}>
                Contribute & <span className="text-accent">Get Rewarded</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.7 }}>
                StudyMate's gamification engine turns knowledge sharing into an exciting journey.
                Earn XP, level up, unlock badges, and compete on the leaderboard.
              </p>
              <Link href="/register" className="btn btn-primary">
                Start Earning XP <ChevronRight size={16} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: Upload, label: 'Verified Upload', xp: '+50 XP' },
                { icon: Star, label: 'High Rating', xp: '+20 XP' },
                { icon: Download, label: '100 Downloads', xp: '+30 XP' },
                { icon: Award, label: 'Faculty Pick', xp: '+100 XP' },
              ].map(({ icon: Icon, label, xp }) => (
                <div key={label} className="card" style={{ padding: 16, textAlign: 'center' }}>
                  <Icon size={20} color="var(--accent)" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--accent)' }}>{xp}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="heading-2" style={{ marginBottom: 12 }}>Loved by Students & Faculty</h2>
          </div>
          <div className="grid-3" style={{ gap: 20 }}>
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{ padding: 28 }}
              >
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="var(--accent)" color="var(--accent)" />)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-subtle)',
                    border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="heading-2" style={{ marginBottom: 12 }}>Frequently Asked Questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="card"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                style={{ padding: 24 }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="var(--accent)" /> {faq.q}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, paddingLeft: 24 }}>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          <GraduationCap size={48} color="var(--accent)" style={{ marginBottom: 24, margin: '0 auto 24px' }} />
          <h2 className="heading-2" style={{ marginBottom: 16 }}>
            Ready to Study <span className="text-accent">Smarter?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
            Join thousands of students already using StudyMate to ace their semesters.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">Log in</Link>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={12} color="#000" />
            </div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 700 }}>StudyMate</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            © 2024 StudyMate. Academic Collaboration Platform.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <a key={item} href="#" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
