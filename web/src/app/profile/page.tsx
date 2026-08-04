'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/stores/authStore';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Upload, Download, Star, BookOpen, Award, Calendar, MapPin,
  Trophy, Zap, TrendingUp, Edit, ExternalLink
} from 'lucide-react';
import { formatDate, formatNumber, getLevelName, RARITY_COLORS, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_CLASSES } from '@/lib/utils';

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];

export default function ProfilePage() {
  const { user: authUser } = useAuthStore();
  const params = useParams();
  const profileId = params?.id as string | undefined;
  const isOwnProfile = !profileId || profileId === authUser?.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', profileId || authUser?.id],
    queryFn: async () => {
      const endpoint = isOwnProfile ? '/auth/me' : `/users/profile/${profileId}`;
      const { data } = await api.get(endpoint);
      return data.data;
    },
    enabled: !!authUser,
  });

  const { data: resources } = useQuery({
    queryKey: ['user-resources', profileId || authUser?.id],
    queryFn: async () => {
      const id = profileId || authUser?.id;
      const { data } = await api.get(`/resources?uploaderId=${id}&limit=9&status=APPROVED`);
      return data.data;
    },
    enabled: !!authUser,
  });

  const { data: badges } = useQuery({
    queryKey: ['my-badges', profileId || authUser?.id],
    queryFn: async () => { const { data } = await api.get('/gamification/my-badges'); return data.data; },
    enabled: isOwnProfile,
  });

  if (isLoading) return (
    <AppShell>
      <div className="page-container">
        <div className="skeleton" style={{ height: 240, borderRadius: 20, marginBottom: 24 }} />
      </div>
    </AppShell>
  );

  const current = LEVEL_THRESHOLDS[profile?.level] || 0;
  const next = LEVEL_THRESHOLDS[(profile?.level || 0) + 1] || current + 1000;
  const progress = ((profile?.totalPoints - current) / (next - current)) * 100;

  return (
    <AppShell>
      <div className="page-container" style={{ maxWidth: 1000 }}>
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{
            padding: '32px 36px', marginBottom: 24, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(200,241,53,0.06) 0%, var(--bg-card) 60%)',
            border: '1px solid var(--border-accent)',
          }}
        >
          {/* Background pattern */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,241,53,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--bg-elevated)', border: '3px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>
                {profile?.avatarUrl
                  ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : profile?.firstName?.[0]
                }
              </div>
              <div style={{ position: 'absolute', bottom: 2, right: 2 }}>
                <span className="level-badge">Lv.{profile?.level}</span>
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800 }}>{profile?.firstName} {profile?.lastName}</h1>
                {profile?.role !== 'STUDENT' && (
                  <span className={`badge ${profile?.role === 'ADMIN' ? 'badge-error' : 'badge-info'}`}>{profile?.role}</span>
                )}
                {isOwnProfile && <Link href="/settings" className="btn btn-ghost btn-sm btn-icon"><Edit size={14} /></Link>}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>@{profile?.collegeId}</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                {profile?.branch && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <BookOpen size={13} /> {profile.branch.name}
                  </span>
                )}
                {profile?.currentSemester && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Calendar size={13} /> Semester {profile.currentSemester}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <Calendar size={13} /> Joined {formatDate(profile?.createdAt)}
                </span>
              </div>

              {/* XP Bar */}
              <div style={{ maxWidth: 340 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                  <span>{getLevelName(profile?.level || 0)}</span>
                  <span>{formatNumber(profile?.totalPoints || 0)} / {formatNumber(next)} XP</span>
                </div>
                <div className="progress-bar">
                  <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} transition={{ duration: 1 }} />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
              {[
                { icon: Upload, label: 'Uploads', value: profile?._count?.resources ?? 0, color: 'var(--accent)' },
                { icon: Download, label: 'Downloads', value: profile?._count?.downloads ?? 0, color: '#60A5FA' },
                { icon: Zap, label: 'Total XP', value: formatNumber(profile?.totalPoints || 0), color: '#FCD34D' },
                { icon: TrendingUp, label: 'Streak', value: `${profile?.currentStreak || 0}d 🔥`, color: '#F472B6' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <Icon size={14} color={color} style={{ marginBottom: 4 }} />
                  <div style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Resources */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={16} color="var(--accent)" /> Uploaded Resources
                </h2>
                <Link href={`/resources?uploaderId=${profileId || authUser?.id}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View All</Link>
              </div>
              {!resources?.length ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <BookOpen size={32} />
                  <span style={{ fontSize: 13 }}>No resources uploaded yet</span>
                </div>
              ) : (
                <div className="grid-3" style={{ gap: 12 }}>
                  {resources.map((r: any) => (
                    <Link key={r.id} href={`/resources/${r.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card" style={{ padding: 14 }}>
                        <span className={`badge ${RESOURCE_TYPE_CLASSES[r.type]}`} style={{ fontSize: 10, marginBottom: 8, display: 'inline-flex' }}>{RESOURCE_TYPE_LABELS[r.type]}</span>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 6 }}>{r.title}</div>
                        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                          <span>⬇️ {formatNumber(r.downloadCount)}</span>
                          <span>⭐ {r.averageRating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Badges */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={14} color="var(--accent)" /> Badges
              </h3>
              {(badges || []).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(badges || []).map((ub: any) => (
                    <div
                      key={ub.id}
                      title={`${ub.badge.name}: ${ub.badge.description}`}
                      style={{
                        width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        background: `${RARITY_COLORS[ub.badge.rarity]}18`,
                        border: `2px solid ${RARITY_COLORS[ub.badge.rarity]}44`,
                        cursor: 'help',
                      }}
                    >
                      {ub.badge.iconUrl}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No badges earned yet</div>
              )}
            </div>

            {/* Score card */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={14} color="var(--accent)" /> Scores
              </h3>
              {[
                { label: 'Contribution Score', value: profile?.contributionScore || 0 },
                { label: 'Reputation Score', value: profile?.reputationScore || 0 },
                { label: 'Max Streak', value: `${profile?.longestStreak || 0} days` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{formatNumber(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
