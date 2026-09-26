'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Star, Users, Clock, ChevronRight, Play, Lock, Heart,
  CheckCircle2, Calendar, Zap, User, ChevronDown, ChevronUp
} from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, FIELD_LABELS, LEVEL_LABELS, FIELD_COLORS, formatRupiah, formatDuration, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const BATCH_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: '🟢 Pendaftaran Dibuka', color: '#018556', bg: '#D1FAE5' },
  ONGOING: { label: '🔵 Sedang Berjalan', color: '#3B82F6', bg: '#DBEAFE' },
  CLOSED: { label: '🔴 Pendaftaran Ditutup', color: '#EF4444', bg: '#FEE2E2' },
  COMING_SOON: { label: '🟣 Segera Hadir', color: '#8B5CF6', bg: '#EDE9FE' },
}

export default function BootcampDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview')

  const { data, isLoading } = useQuery({
    queryKey: ['bootcamp', id],
    queryFn: () => api.get(`/bootcamps/${id}`).then((r) => r.data.data),
  })

  const wishlistMutation = useMutation({
    mutationFn: () =>
      data?.isWishlisted
        ? api.delete(`/wishlist/bootcamp/${id}`)
        : api.post('/wishlist', { productType: 'BOOTCAMP', bootcampId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bootcamp', id] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-ids'] })
      toast.success(data?.isWishlisted ? 'Dihapus dari wishlist' : 'Ditambahkan ke wishlist ❤️')
    },
  })

  const enrollMutation = useMutation({
    mutationFn: () => api.post('/transactions/initiate', { productType: 'BOOTCAMP', bootcampId: id }).then((r) => r.data.data),
    onSuccess: (txData) => {
      // Open Midtrans Snap
      const w = window as unknown as { snap?: { pay: (token: string, opts: object) => void } }
      if (w.snap) {
        w.snap.pay(txData.snapToken, {
          onSuccess: () => { toast.success('Pembayaran berhasil!'); queryClient.invalidateQueries({ queryKey: ['bootcamp', id] }) },
          onError: () => toast.error('Pembayaran gagal'),
          onClose: () => {},
        })
      } else {
        router.push(ROUTES.TRANSACTIONS)
        toast.info('Token pembayaran dibuat. Cek halaman transaksi.')
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal memulai pembayaran'
      toast.error(msg)
    },
  })

  if (isLoading) return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="skeleton" style={{ height: 300, borderRadius: 16, marginBottom: 'var(--space-6)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
        <div className="skeleton" style={{ height: 380, borderRadius: 16 }} />
      </div>
    </div>
  )

  if (!data) return null

  const statusStyle = BATCH_STATUS[data.batchStatus] || BATCH_STATUS.COMING_SOON
  const totalSessions = data.chapters?.reduce((acc: number, ch: { sessions: unknown[] }) => acc + ch.sessions.length, 0) || 0
  const canEnroll = data.batchStatus === 'OPEN' && !data.isEnrolled

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }} className="animate-fade-in">
      {/* Hero */}
      <div style={{
        borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: 'var(--space-6)',
        background: `linear-gradient(135deg, ${FIELD_COLORS[data.field]}CC, ${FIELD_COLORS[data.field]}88)`,
        minHeight: 220, position: 'relative', display: 'flex', alignItems: 'flex-end',
      }}>
        {data.thumbnailUrl && (
          <img src={data.thumbnailUrl} alt={data.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, padding: 'var(--space-8)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span style={{ padding: '4px 12px', background: statusStyle.bg, color: statusStyle.color, borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 700 }}>
              {statusStyle.label}
            </span>
            <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600 }}>
              {LEVEL_LABELS[data.level]}
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, maxWidth: 600, lineHeight: 1.3 }}>{data.title}</h1>
          {data.shortDescription && (
            <p style={{ marginTop: 'var(--space-2)', opacity: 0.9, fontSize: 'var(--text-sm)', maxWidth: 560 }}>{data.shortDescription}</p>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', opacity: 0.9, flexWrap: 'wrap' }}>
            {data.rating > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={14} fill="currentColor" />{data.rating.toFixed(1)} ({data.reviewCount})</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} />{data.enrollmentCount} peserta</span>
            {data.totalDuration > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} />{formatDuration(data.totalDuration)}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Play size={14} />{totalSessions} sesi</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left: content */}
        <div>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
            {([['overview', 'Overview'], ['curriculum', 'Kurikulum'], ['reviews', 'Ulasan']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`tab-item ${activeTab === id ? 'active' : ''}`}>{label}</button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Mentor */}
              {data.mentorName && (
                <div className="card card-body-sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div className="avatar avatar-lg">
                    {data.mentorPhotoUrl ? <img src={data.mentorPhotoUrl} alt={data.mentorName} /> : data.mentorName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Mentor</div>
                    <div style={{ fontWeight: 700 }}>{data.mentorName}</div>
                    {data.mentorBio && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>{data.mentorBio}</div>}
                  </div>
                </div>
              )}

              {/* Description */}
              {data.description && (
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Tentang Bootcamp</h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>{data.description}</p>
                </div>
              )}

              {/* What you'll learn */}
              {data.outcomes?.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Yang akan kamu pelajari</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                    {data.outcomes.map((outcome: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} /> {outcome}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.chapters?.map((chapter: { id: string; title: string; sessions: Array<{ id: string; title: string; type: string; videoDuration?: number; liveScheduledAt?: string }> }) => (
                <div key={chapter.id} className="card" style={{ overflow: 'hidden' }}>
                  <button
                    onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                    style={{ width: '100%', padding: 'var(--space-4) var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}
                  >
                    <span>{chapter.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{chapter.sessions.length} sesi</span>
                      {expandedChapter === chapter.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </button>
                  {expandedChapter === chapter.id && (
                    <div style={{ borderTop: '1px solid var(--color-border)' }}>
                      {chapter.sessions.map((session, idx: number) => (
                        <div key={session.id} style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                          padding: 'var(--space-3) var(--space-5)',
                          borderBottom: idx < chapter.sessions.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                        }}>
                          {session.type === 'LIVE' ? <Calendar size={14} color="#3B82F6" /> : <Play size={14} color="var(--color-text-tertiary)" />}
                          <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: data.isEnrolled ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                            {session.title}
                          </span>
                          {session.type === 'LIVE' && session.liveScheduledAt ? (
                            <span style={{ fontSize: '11px', color: '#3B82F6' }}>{formatDate(session.liveScheduledAt)}</span>
                          ) : session.videoDuration ? (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{formatDuration(session.videoDuration)}</span>
                          ) : null}
                          {!data.isEnrolled && <Lock size={12} color="var(--color-text-tertiary)" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {data.reviews?.length === 0 ? (
                <div className="empty-state"><p className="empty-state-title">Belum ada ulasan</p></div>
              ) : data.reviews?.map((review: { id: string; rating: number; comment?: string; createdAt: string; user: { name: string; photoUrl?: string } }) => (
                <div key={review.id} className="card card-body-sm">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <div className="avatar avatar-sm">{review.user.photoUrl ? <img src={review.user.photoUrl} alt={review.user.name} /> : review.user.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{review.user.name}</div>
                      <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} fill={i < review.rating ? '#F59E0B' : 'none'} color={i < review.rating ? '#F59E0B' : 'var(--color-border)'} />)}
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{formatDate(review.createdAt)}</div>
                  </div>
                  {review.comment && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Purchase card */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-primary)' }}>{formatRupiah(data.price)}</div>

            {data.isEnrolled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  <CheckCircle2 size={18} /> Sudah Terdaftar
                </div>
                <Link href={data.chapters?.[0]?.sessions?.[0] ? ROUTES.LEARN_BOOTCAMP_SESSION(id, data.chapters[0].sessions[0].id) : '#'} className="btn btn-primary">
                  <Play size={16} /> Lanjutkan Belajar
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button onClick={() => enrollMutation.mutate()} disabled={!canEnroll || enrollMutation.isPending} className={`btn btn-primary ${enrollMutation.isPending ? 'btn-loading' : ''}`}>
                  {!enrollMutation.isPending && (canEnroll ? 'Daftar Sekarang' : data.batchStatus === 'CLOSED' ? 'Pendaftaran Ditutup' : 'Segera Tersedia')}
                </button>
                <button onClick={() => wishlistMutation.mutate()} className="btn btn-secondary" style={{ gap: 'var(--space-2)' }}>
                  <Heart size={15} fill={data.isWishlisted ? '#EF4444' : 'none'} color={data.isWishlisted ? '#EF4444' : 'currentColor'} />
                  {data.isWishlisted ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
                </button>
              </div>
            )}

            {/* Info list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              {[
                { icon: <Zap size={12} color="var(--color-xp)" />, text: `XP dari setiap sesi` },
                { icon: <Users size={12} />, text: `${data.enrollmentCount} peserta terdaftar` },
                { icon: <Clock size={12} />, text: formatDuration(data.totalDuration) },
                ...(data.batchStartDate ? [{ icon: <Calendar size={12} />, text: `Mulai: ${formatDate(data.batchStartDate)}` }] : []),
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {item.icon} {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
