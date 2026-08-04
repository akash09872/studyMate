'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import { Trophy, Medal, Award, Crown, TrendingUp, Users, Star, Download, ChevronRight } from 'lucide-react';
import { formatNumber, getLevelName } from '@/lib/utils';
import { useState } from 'react';

const PERIODS = [
  { label: 'Overall', value: 'OVERALL' },
  { label: 'This Month', value: 'MONTHLY' },
  { label: 'This Week', value: 'WEEKLY' },
];

const RANK_COLORS = ['#C8F135', '#C0C0C0', '#CD7F32'];
const RANK_ICONS = ['👑', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('OVERALL');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => { const { data } = await api.get(`/leaderboard?period=${period}&limit=50`); return data.data; },
  });

  const top3 = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  return (
    <AppShell>
      <div className="page-container" style={{ maxWidth: 860 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Trophy size={40} color="var(--accent)" style={{ marginBottom: 12 }} />
          <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Leaderboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Top contributors powering the academic community</p>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 36 }}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)} className={`btn btn-sm ${period === p.value ? 'btn-primary' : 'btn-secondary'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />)}
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 16, marginBottom: 32, alignItems: 'end' }}>
                {[top3[1], top3[0], top3[2]].map((u, displayI) => {
                  const rank = displayI === 0 ? 1 : displayI === 1 ? 0 : 2;
                  const actualRank = rank + 1;
                  const heights = [160, 200, 140];
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: displayI * 0.1 }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                      <Link href={`/profile/${u.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ position: 'relative', marginBottom: 8 }}>
                          <div style={{ width: 56 + rank * 8, height: 56 + rank * 8, borderRadius: '50%', background: `${RANK_COLORS[rank]}22`, border: `3px solid ${RANK_COLORS[rank]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: RANK_COLORS[rank] }}>
                            {u.avatarUrl ? <img src={u.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : u.firstName[0]}
                          </div>
                          <div style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 18 }}>{RANK_ICONS[rank]}</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, textAlign: 'center' }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{u.branch?.shortName}</div>
                        <div style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 800, color: RANK_COLORS[rank] }}>{formatNumber(u.totalPoints)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>XP</div>
                      </Link>
                      <div style={{
                        width: '100%', height: heights[displayI],
                        background: `linear-gradient(180deg, ${RANK_COLORS[rank]}33 0%, ${RANK_COLORS[rank]}11 100%)`,
                        border: `1px solid ${RANK_COLORS[rank]}44`,
                        borderRadius: '12px 12px 0 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, fontWeight: 800, color: RANK_COLORS[rank], fontFamily: 'Outfit',
                      }}>
                        {actualRank}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rest of leaderboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rest.map((u: any, i: number) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card"
                  style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  <div style={{ width: 28, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', flexShrink: 0 }}>
                    {i + 4}
                  </div>
                  <Link href={`/profile/${u.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : u.firstName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.firstName} {u.lastName}
                        <span className="level-badge" style={{ marginLeft: 6 }}>Lv.{u.level}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {u.branch?.shortName || 'N/A'} · @{u.collegeId}
                      </div>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{formatNumber(u.totalPoints)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>XP</div>
                    </div>
                    {u.badges?.slice(0, 2).map((b: any) => (
                      <span key={b.badge?.name} style={{ fontSize: 18 }} title={b.badge?.name}>{b.badge?.iconUrl}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
