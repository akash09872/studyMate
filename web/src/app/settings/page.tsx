'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/stores/authStore';
import {
  User, Bell, Shield, Key, Loader2, Save, Upload
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user: authUser } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => { const { data } = await api.get('/auth/me'); return data.data; },
    enabled: !!authUser,
  });

  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    bio: profile?.bio || '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/me', data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update profile'),
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) return <AppShell><div className="page-container"><div className="skeleton" style={{ height: 400, borderRadius: 20 }} /></div></AppShell>;

  return (
    <AppShell>
      <div className="page-container" style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800 }}>Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage your account preferences and profile details</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32, alignItems: 'start' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'account', label: 'Account Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none',
                  background: activeTab === id ? 'var(--accent-subtle)' : 'transparent',
                  color: activeTab === id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: activeTab === id ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s',
                  textAlign: 'left'
                }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="card" style={{ padding: 28 }}>
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdate}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Public Profile</h2>
                
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
                    {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : profile?.firstName?.[0]}
                  </div>
                  <div>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ marginBottom: 6 }}><Upload size={14} /> Change Avatar</button>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, GIF or PNG. 1MB max.</div>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 16 }}>
                  <div className="input-group">
                    <label className="input-label">First Name</label>
                    <input className="input" value={formData.firstName || profile?.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Last Name</label>
                    <input className="input" value={formData.lastName || profile?.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Bio</label>
                  <textarea className="input" rows={4} value={formData.bio || profile?.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us a little about yourself..." style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <button type="submit" className="btn btn-primary" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'account' && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Account Security</h2>
                <div className="input-group" style={{ marginBottom: 24 }}>
                  <label className="input-label">Email Address</label>
                  <input className="input" value={profile?.email} disabled style={{ opacity: 0.7 }} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Email address cannot be changed.</p>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Change Password</h3>
                <div className="input-group">
                  <label className="input-label">Current Password</label>
                  <input className="input" type="password" />
                </div>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input className="input" type="password" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button className="btn btn-primary"><Key size={14} /> Update Password</button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Email Notifications</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { title: 'Resource Approvals', desc: 'When your uploaded resource is approved' },
                    { title: 'New Comments', desc: 'When someone replies to your comment' },
                    { title: 'Milestones & Badges', desc: 'When you level up or earn a new badge' },
                    { title: 'Platform Updates', desc: 'Important announcements and new features' },
                  ].map((n, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: 'var(--bg-elevated)', borderRadius: 10, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ marginTop: 4 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button className="btn btn-primary">Save Preferences</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
