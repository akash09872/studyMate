'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Download, Star, Eye, Bookmark, Share2, Flag, MessageCircle,
  CheckCircle, ArrowLeft, ThumbsUp, Send, Loader2, ExternalLink,
  Calendar, User, Tag, BookOpen, Award
} from 'lucide-react';
import { formatNumber, formatDate, formatRelativeTime, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_CLASSES, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{ background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer', padding: 1 }}
        >
          <Star
            size={readonly ? 14 : 20}
            fill={(hover || value) >= s ? 'var(--accent)' : 'none'}
            color={(hover || value) >= s ? 'var(--accent)' : 'var(--text-muted)'}
          />
        </button>
      ))}
    </div>
  );
}

function CommentItem({ comment, resourceId, onReply }: any) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const qc = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/comments/${comment.id}/like`),
    onSuccess: () => {
      setLiked(!liked);
      qc.invalidateQueries({ queryKey: ['comments', resourceId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => api.post('/comments', { resourceId, content, parentId: comment.id }),
    onSuccess: () => {
      setReplyText('');
      setShowReply(false);
      qc.invalidateQueries({ queryKey: ['comments', resourceId] });
      toast.success('Reply posted');
    },
  });

  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
          {comment.user?.avatarUrl
            ? <img src={comment.user.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
            : comment.user?.firstName?.[0]
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{comment.user?.firstName} {comment.user?.lastName}</span>
            <span className="level-badge">Lv.{comment.user?.level}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRelativeTime(comment.createdAt)}</span>
            {comment.isEdited && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(edited)</span>}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{comment.content}</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => likeMutation.mutate()} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: liked ? 'var(--accent)' : 'var(--text-muted)' }}>
              <ThumbsUp size={12} fill={liked ? 'var(--accent)' : 'none'} /> {comment.likeCount}
            </button>
            {user && (
              <button onClick={() => setShowReply(!showReply)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                <MessageCircle size={12} /> Reply
              </button>
            )}
          </div>
          {showReply && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && replyText && replyMutation.mutate(replyText)} />
              <button onClick={() => replyMutation.mutate(replyText)} className="btn btn-primary btn-sm" disabled={!replyText}>
                <Send size={12} />
              </button>
            </div>
          )}
          {comment.replies?.map((r: any) => (
            <div key={r.id} style={{ marginTop: 12, paddingLeft: 16, borderLeft: '2px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {r.user?.firstName?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{r.user?.firstName} {r.user?.lastName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{formatRelativeTime(r.createdAt)}</span></div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.content}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [myRating, setMyRating] = useState(0);
  const [review, setReview] = useState('');
  const [comment, setComment] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('WRONG_CONTENT');
  const [reportDescription, setReportDescription] = useState('');

  const { data: resource, isLoading } = useQuery({
    queryKey: ['resource', id],
    queryFn: async () => { const { data } = await api.get(`/resources/${id}`); return data.data; },
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => { const { data } = await api.get(`/comments/resource/${id}`); return data; },
  });

  const downloadMutation = useMutation({
    mutationFn: () => api.post(`/resources/${id}/download`),
    onSuccess: (res) => {
      const { fileUrl, fileName } = res.data.data;
      const link = document.createElement('a');
      link.href = `${process.env.NEXT_PUBLIC_API_URL}${fileUrl}`;
      link.download = fileName;
      link.click();
      toast.success('Download started!');
    },
  });

  const ratingMutation = useMutation({
    mutationFn: () => api.post('/ratings', { resourceId: id, rating: myRating, review }),
    onSuccess: () => {
      toast.success('Rating submitted!');
      qc.invalidateQueries({ queryKey: ['resource', id] });
      setReview('');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post('/comments', { resourceId: id, content }),
    onSuccess: () => {
      toast.success('Comment posted!');
      setComment('');
      qc.invalidateQueries({ queryKey: ['comments', id] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: () => api.post('/reports', { resourceId: id, reason: reportReason, description: reportDescription }),
    onSuccess: () => {
      toast.success('Report submitted successfully.');
      setShowReportModal(false);
      setReportDescription('');
      setReportReason('WRONG_CONTENT');
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
            <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!resource) return <AppShell><div className="page-container"><div className="empty-state"><BookOpen size={48} /><h3>Resource not found</h3></div></div></AppShell>;

  return (
    <AppShell>
      <div className="page-container">
        <Link href="/resources" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Library
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* ─── Main Content ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Resource Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className={`badge ${RESOURCE_TYPE_CLASSES[resource.type]}`}>{RESOURCE_TYPE_LABELS[resource.type]}</span>
                {resource.isVerified && <span className="badge badge-accent"><CheckCircle size={10} /> Faculty Verified</span>}
                {resource.facultyPick && <span style={{ background: 'rgba(245,158,11,0.1)', color: '#FCD34D', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>⭐ Faculty Pick</span>}
                {resource.isFeatured && <span className="badge badge-info">Featured</span>}
              </div>

              <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>
                {resource.title}
              </h1>

              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                {resource.description}
              </p>

              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { icon: BookOpen, label: 'Subject', value: resource.subject?.name },
                  { icon: User, label: 'Branch', value: `${resource.branch?.name} · Sem ${resource.semester?.number}` },
                  { icon: Calendar, label: 'Uploaded', value: formatDate(resource.createdAt) },
                  { icon: Award, label: 'Author', value: resource.author || 'N/A' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Icon size={14} color="var(--text-muted)" style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{value || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {resource.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {resource.tags.map((t: any) => <span key={t.name} className="badge badge-ghost" style={{ cursor: 'pointer' }}><Tag size={10} />#{t.name}</span>)}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => downloadMutation.mutate()} className="btn btn-primary" disabled={downloadMutation.isPending}>
                  {downloadMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                  Download File
                </button>
                <button className="btn btn-secondary"><Share2 size={14} /> Share</button>
                <button onClick={() => setShowReportModal(true)} className="btn btn-ghost" style={{ color: 'var(--error)' }}><Flag size={14} /> Report</button>
              </div>
            </motion.div>

            {/* File Preview */}
            {resource.fileType === 'application/pdf' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>Preview</h3>
                  <a href={`${process.env.NEXT_PUBLIC_API_URL}${resource.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                    <ExternalLink size={12} /> Open in new tab
                  </a>
                </div>
                <iframe
                  src={`${process.env.NEXT_PUBLIC_API_URL}${resource.fileUrl}#toolbar=0`}
                  style={{ width: '100%', height: 500, border: 'none' }}
                  title={resource.title}
                />
              </div>
            )}

            {/* Rating Section */}
            {user && user.id !== resource.uploaderId && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Star size={16} color="var(--accent)" /> Rate this Resource
                </h3>
                <div style={{ marginBottom: 16 }}>
                  <StarRating value={resource.userRating?.rating || myRating} onChange={setMyRating} />
                </div>
                <textarea
                  className="input"
                  placeholder="Write a review (optional)..."
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  rows={3}
                  style={{ marginBottom: 12, resize: 'vertical' }}
                />
                <button onClick={() => ratingMutation.mutate()} className="btn btn-primary btn-sm" disabled={!myRating || ratingMutation.isPending}>
                  {ratingMutation.isPending ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Rating'}
                </button>
              </div>
            )}

            {/* Comments */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={16} color="var(--accent)" />
                Comments <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>({resource._count?.comments || 0})</span>
              </h3>

              {user && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {user.firstName[0]}
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <input className="input" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && comment && commentMutation.mutate(comment)} />
                    <button onClick={() => commentMutation.mutate(comment)} className="btn btn-primary btn-sm" disabled={!comment || commentMutation.isPending}>
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}

              {commentsData?.data?.length
                ? commentsData.data.map((c: any) => <CommentItem key={c.id} comment={c} resourceId={id} />)
                : <div className="empty-state" style={{ padding: '24px 0' }}><MessageCircle size={32} /><span style={{ fontSize: 13 }}>No comments yet. Be the first!</span></div>
              }
            </div>
          </div>

          {/* ─── Sidebar ────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
            {/* Stats */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Resource Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: Eye, label: 'Views', value: formatNumber(resource.viewCount) },
                  { icon: Download, label: 'Downloads', value: formatNumber(resource.downloadCount) },
                  { icon: Bookmark, label: 'Bookmarks', value: formatNumber(resource.bookmarkCount) },
                  { icon: MessageCircle, label: 'Comments', value: formatNumber(resource._count?.comments || 0) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <Icon size={13} /> {label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Summary */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Ratings</h3>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: 'Outfit', fontSize: 40, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{resource.averageRating?.toFixed(1) || '—'}</div>
                <StarRating value={Math.round(resource.averageRating || 0)} readonly />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{resource.ratingCount} ratings</div>
              </div>
            </div>

            {/* Uploader */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Uploaded by</h3>
              <Link href={`/profile/${resource.uploader?.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {resource.uploader?.avatarUrl
                    ? <img src={resource.uploader.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    : resource.uploader?.firstName?.[0]
                  }
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{resource.uploader?.firstName} {resource.uploader?.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{resource.uploader?.collegeId} · Lv.{resource.uploader?.level}</div>
                </div>
              </Link>
              {resource.reviewer && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Verified by</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                    <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {resource.reviewer.firstName} {resource.reviewer.lastName}
                  </div>
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>File Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>File name</span>
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{resource.fileName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Size</span>
                  <span style={{ fontWeight: 500 }}>{formatFileSize(resource.fileSize)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Type</span>
                  <span style={{ fontWeight: 500 }}>{resource.fileType.split('/')[1]?.toUpperCase() || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowReportModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal" style={{ maxWidth: 480, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Report Resource</h2>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Reason</label>
              <select className="input" value={reportReason} onChange={e => setReportReason(e.target.value)}>
                <option value="WRONG_CONTENT">Wrong Content</option>
                <option value="DUPLICATE">Duplicate</option>
                <option value="SPAM">Spam</option>
                <option value="INAPPROPRIATE">Inappropriate</option>
                <option value="BROKEN_FILE">Broken File</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">Description (Optional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Provide more details..."
                value={reportDescription}
                onChange={e => setReportDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReportModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={() => reportMutation.mutate()} className="btn btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)', color: 'white' }} disabled={reportMutation.isPending}>
                {reportMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Report'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
