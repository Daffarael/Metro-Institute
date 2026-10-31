'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Star, Users, Clock, ChevronRight, Play, Lock, Heart,
  CheckCircle2, Calendar, Zap, User, ChevronDown, ChevronUp, Share2, PlayCircle,
  FileText, HelpCircle, FileEdit, Award, ShieldCheck, XCircle, AlertCircle
} from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { ROUTES, FIELD_LABELS, LEVEL_LABELS, FIELD_COLORS, formatRupiah, formatDuration, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { CardTabs } from '@/components/ui/AnimatedTabs'

const getSessionIcon = (type: string, color: string) => {
  switch(type) {
    case 'LIVE': return <Calendar size={15} color={color} />
    case 'VIDEO': return <Play size={15} color={color} />
    case 'MATERIAL': return <FileText size={15} color={color} />
    case 'QUIZ': return <HelpCircle size={15} color={color} />
    case 'ASSIGNMENT': return <FileEdit size={15} color={color} />
    default: return <Play size={15} color={color} />
  }
}


export default function BootcampDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const { setSearchPlaceholder } = useUIStore()
  const queryClient = useQueryClient()
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'attendance' | 'reviews'>('overview')
  const [reviewRating, setReviewRating] = useState<number>(0)
  const [reviewContent, setReviewContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['bootcamp', id],
    queryFn: () => api.get(`/bootcamps/${id}`).then((r) => r.data.data),
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['my-bootcamp-attendance', id],
    queryFn: () => api.get(`/bootcamps/${id}/my-attendance`).then((r) => r.data.data),
    enabled: Boolean(data?.isEnrolled),
  })

  const submitReviewMutation = useMutation({
    mutationFn: () => api.post(`/bootcamps/${id}/reviews`, { rating: reviewRating, content: reviewContent }),
    onSuccess: () => {
      toast.success('Ulasan berhasil dikirim!')
      setReviewRating(0)
      setReviewContent('')
      queryClient.invalidateQueries({ queryKey: ['bootcamp', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulasan')
    }
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
      console.error('Enroll Error:', err)
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error).message || 'Gagal memulai pembayaran'
      toast.error(msg)
    },
  })

  useEffect(() => {
    if (data) {
      setSearchPlaceholder(`Bootcamp / ${data.title}`)
    }
    return () => setSearchPlaceholder(null)
  }, [data, setSearchPlaceholder])

  if (isLoading) return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="skeleton" style={{ height: 300, borderRadius: 16, marginBottom: 'var(--space-6)' }} />
      <div className="detail-layout-grid" style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
        <div className="skeleton" style={{ height: 380, borderRadius: 16 }} />
      </div>
    </div>
  )

  if (!data) return null

  const totalSessions = data.chapters?.reduce((acc: number, ch: { sessions: unknown[] }) => acc + ch.sessions.length, 0) || 0
  const canEnroll = data.batchStatus === 'OPEN' && !data.isEnrolled

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }} className="animate-fade-in">
      {/* Main layout */}
      <div className="detail-layout-grid" style={{ display: 'grid', gap: 48 }}>
        
        {/* ── LEFT ──────────────────────────────────────── */}
        <div>
          {/* Hero */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            {/* Breadcrumb */}
            <nav style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 28, fontSize: '13px',
              color: 'var(--color-text-tertiary)',
            }}>
              <Link href={ROUTES.BOOTCAMP_LIST} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                Bootcamp
              </Link>
              <ChevronRight size={13} strokeWidth={1.5} />
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.title}
              </span>
            </nav>

            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {FIELD_LABELS[data.field]}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--color-border)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                {LEVEL_LABELS[data.level]}
              </span>
              {data.batchStatus !== 'CLOSED' && (
                <>
                  <span style={{ fontSize: '14px', color: 'var(--color-border)' }}>•</span>
                  <span style={{
                    fontSize: '12px', fontWeight: 600,
                    color: data.batchStatus === 'OPEN' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}>
                    {data.batchStatus === 'OPEN' ? 'Pendaftaran Dibuka'
                      : data.batchStatus === 'ONGOING' ? 'Sedang Berjalan'
                      : 'Segera Hadir'}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '28px', fontWeight: 800, lineHeight: 1.25,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em', marginBottom: 14,
            }}>
              {data.title}
            </h1>

            {data.shortDescription && (
              <p style={{
                fontSize: '15px', color: 'var(--color-text-secondary)',
                lineHeight: 1.6, marginBottom: 24,
              }}>
                {data.shortDescription}
              </p>
            )}

            {/* Meta strip */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              gap: 20, marginBottom: 32,
              paddingBottom: 24,
              borderBottom: '1px solid var(--color-border-subtle)',
            }}>
              {data.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {data.rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                    ({data.reviewCount} ulasan)
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                <Users size={13} strokeWidth={1.5} />
                <span>{data.enrollmentCount} peserta</span>
              </div>
              {data.totalDuration > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  <Clock size={13} strokeWidth={1.5} />
                  <span>{formatDuration(data.totalDuration)}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                <Play size={13} strokeWidth={1.5} />
                <span>{totalSessions} sesi</span>
              </div>
            </div>

          </div>

          {/* CardTabs — browser-tab style */}
          <CardTabs
            items={[
              { id: 'overview', label: 'Overview' },
              { id: 'curriculum', label: 'Kurikulum' },
              ...(data.isEnrolled ? [{ id: 'attendance', label: 'Presensi & Sertifikat' }] : []),
              { id: 'reviews', label: 'Ulasan' },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as 'overview' | 'curriculum' | 'attendance' | 'reviews')}
          >
            {activeTab === 'overview' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {data.mentorName && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border-subtle)',
                  }}>
                    <div className="avatar avatar-lg">
                      {data.mentorPhotoUrl ? <img src={data.mentorPhotoUrl} alt={data.mentorName} /> : data.mentorName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 3 }}>Mentor</div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>{data.mentorName}</div>
                      {data.mentorBio && <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{data.mentorBio}</div>}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {(data.mentorName && data.description) && <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />}

                {data.description && (
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>Tentang Bootcamp</h2>
                    <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>{data.description}</p>
                  </div>
                )}

                {/* Divider */}
                {data.outcomes?.length > 0 && <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />}

                {data.outcomes?.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Yang akan kamu pelajari</h2>
                    <div className="grid-cols-2" style={{ display: 'grid', gap: '8px 16px' }}>
                      {data.outcomes.map((outcome: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                          <CheckCircle2 size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                          <span>{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            )}
            {activeTab === 'curriculum' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {data.chapters?.map((chapter: { id: string; title: string; sessions: Array<{ id: string; title: string; type: string; videoDuration?: number; liveScheduledAt?: string }> }) => {
                  const isOpen = expandedChapter === chapter.id
                  return (
                    <div key={chapter.id} className="card" style={{
                      overflow: 'hidden',
                      transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)',
                      borderRadius: isOpen ? 16 : 12,
                    }}>
                      <button
                        onClick={() => setExpandedChapter(isOpen ? null : chapter.id)}
                        style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14.5px', color: 'var(--color-text-primary)' }}
                      >
                        <span style={{ flex: 1, textAlign: 'left', lineHeight: 1.4, paddingRight: 16 }}>{chapter.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>{chapter.sessions.length} sesi</span>
                          <div style={{ display: 'flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronUp
                              size={16}
                              color="var(--color-text-tertiary)"
                              style={{
                                transition: 'transform 500ms cubic-bezier(0.4,0,0.2,1)',
                                transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)'
                              }}
                            />
                          </div>
                        </div>
                      </button>

                      <div
                        style={{
                          display: 'grid',
                          transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)',
                          gridTemplateRows: isOpen ? '1fr' : '0fr',
                          opacity: isOpen ? 1 : 0,
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '0 8px 12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {chapter.sessions.map((session, idx: number) => {
                                const sessionContent = (
                                  <div
                                    key={session.id}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 12,
                                      padding: '10px 12px',
                                      borderRadius: 10,
                                      transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)',
                                      transform: isOpen ? 'translateY(0)' : 'translateY(16px)',
                                      opacity: isOpen ? 1 : 0,
                                      transitionDelay: isOpen ? `${idx * 75}ms` : '0ms',
                                      cursor: data.isEnrolled ? 'pointer' : 'default',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--color-text-primary) 3%, transparent)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <div style={{
                                      display: 'flex', height: 36, width: 36, flexShrink: 0,
                                      alignItems: 'center', justifyContent: 'center',
                                      borderRadius: 10, background: 'var(--color-bg)',
                                      border: '1px solid var(--color-border-subtle)'
                                    }}>
                                      {getSessionIcon(session.type, session.type === 'LIVE' ? 'var(--color-primary)' : 'var(--color-text-tertiary)')}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                                      <div style={{ fontSize: '13.5px', fontWeight: 500, color: data.isEnrolled ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {session.title}
                                      </div>
                                    </div>
                                    {session.type === 'LIVE' && session.liveScheduledAt ? (
                                      <span style={{ fontSize: '11px', color: 'var(--color-primary)', flexShrink: 0 }}>{formatDate(session.liveScheduledAt)}</span>
                                    ) : session.videoDuration ? (
                                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDuration(session.videoDuration)}</span>
                                    ) : null}
                                    {!data.isEnrolled && <Lock size={13} color="var(--color-text-tertiary)" style={{ flexShrink: 0, marginLeft: 4 }} />}
                                  </div>
                                )

                                return data.isEnrolled ? (
                                  <Link key={session.id} href={ROUTES.LEARN_BOOTCAMP_SESSION(id, session.id)} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                    {sessionContent}
                                  </Link>
                                ) : (
                                  sessionContent
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {activeTab === 'attendance' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {/* ── Status Sertifikat Card ────────────────────────── */}
                {attendanceData?.certificate?.isUnlocked ? (
                  <div style={{
                    padding: '24px 28px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '1px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#22c55e',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Award size={26} />
                      </div>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: '#166534', lineHeight: 1.3 }}>
                          E-Sertifikat Kelulusan Terbuka! 🎓
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#15803d' }}>
                          Selamat! Kamu telah menyelesaikan seluruh syarat kehadiran 100%. Sertifikat resmi Metro Institute siap diunduh.
                        </p>
                      </div>
                    </div>

                    <Link href="/mentee/certificates" style={{ textDecoration: 'none' }}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 20px',
                          borderRadius: 8,
                          background: '#166534',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                        }}
                      >
                        <Award size={16} /> Lihat & Unduh Sertifikat
                      </motion.div>
                    </Link>
                  </div>
                ) : (
                  <div style={{
                    padding: '24px 28px',
                    borderRadius: 16,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Lock size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                              E-Sertifikat Kelulusan
                            </div>
                            <span style={{
                              padding: '2px 9px',
                              borderRadius: 20,
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              color: '#475569',
                              fontSize: '11.5px',
                              fontWeight: 600,
                            }}>
                              Terkunci · {attendanceData?.attendedCount || 0}/{attendanceData?.totalSessions || 0} Sesi
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.4 }}>
                            Wajib hadir minimal 80% pada seluruh sesi live Google Meet untuk menerbitkan e-sertifikat resmi.
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
                          {attendanceData?.totalSessions ? Math.round(((attendanceData?.attendedCount || 0) / attendanceData.totalSessions) * 100) : 0}%
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>
                          Kehadiran
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', marginBottom: 18 }}>
                      <div style={{
                        width: `${attendanceData?.totalSessions ? Math.round(((attendanceData?.attendedCount || 0) / attendanceData.totalSessions) * 100) : 0}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #018556 0%, #10b981 100%)',
                        borderRadius: 999,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>

                    {/* Missing sessions notice if any */}
                    {attendanceData?.missingSessions && attendanceData.missingSessions.length > 0 && (
                      <div style={{
                        padding: '16px 20px',
                        borderRadius: 12,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertCircle size={16} color="#64748b" />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                              Belum Memenuhi Syarat ({attendanceData.missingSessions.length} sesi belum tuntas)
                            </span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                            Selesaikan presensi sesi berikut:
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {attendanceData.missingSessions.slice(0, 3).map((ms: any) => (
                            <div
                              key={ms.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                fontSize: '12.5px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                                <span style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ms.title}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '11.5px', flexShrink: 0 }}>
                                  ({ms.chapterTitle})
                                </span>
                              </div>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#64748b',
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                flexShrink: 0,
                                marginLeft: 8,
                              }}>
                                Belum Hadir
                              </span>
                            </div>
                          ))}
                          {attendanceData.missingSessions.length > 3 && (
                            <div style={{ fontSize: '11.5px', color: '#64748b', textAlign: 'center', marginTop: 4, fontWeight: 500 }}>
                              + {attendanceData.missingSessions.length - 3} sesi lainnya tercantum pada daftar presensi di bawah
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Checklist Kehadiran Sesi ─────────────────────── */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                }}>
                  <div style={{
                    padding: '16px 22px',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      Daftar Kehadiran Sesi Pembelajaran
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      Minimal hadir 80% per sesi
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {attendanceData?.sessions?.map((s: any, idx: number) => {
                      const isPresent = s.attendance?.status === 'PRESENT' || s.attendance?.status === 'MANUAL'
                      const isExcused = s.attendance?.status === 'EXCUSED'
                      const isAbsent = s.attendance?.status === 'ABSENT'

                      return (
                        <div
                          key={s.id}
                          style={{
                            padding: '14px 20px',
                            borderBottom: idx === attendanceData.sessions.length - 1 ? 'none' : '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12,
                            background: '#ffffff',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 260px' }}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: isPresent ? '#f0fdf4' : isExcused ? '#eff6ff' : isAbsent ? '#f1f5f9' : '#f8fafc',
                              color: isPresent ? '#166534' : isExcused ? '#1e40af' : isAbsent ? '#475569' : '#94a3b8',
                              border: isPresent ? '1px solid #bbf7d0' : isExcused ? '1px solid #bfdbfe' : isAbsent ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {isPresent ? <CheckCircle2 size={16} /> : isExcused ? <ShieldCheck size={16} /> : isAbsent ? <XCircle size={16} /> : <Clock size={16} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                                {s.title}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {s.chapterTitle} {s.type === 'LIVE' ? '· Sesi Live Google Meet' : ''}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Duration or schedule info */}
                            {s.attendance?.durationMinutes > 0 ? (
                              <div style={{ textAlign: 'right', fontSize: '12px' }}>
                                <div style={{ fontWeight: 700, color: isPresent ? '#166534' : isExcused ? '#1e40af' : '#475569' }}>
                                  {s.attendance.durationMinutes} / {s.durationMinutes} menit
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                                  min. {s.minRequiredMinutes} mnt
                                </div>
                              </div>
                            ) : s.liveScheduledAt ? (
                              <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                                {formatDate(s.liveScheduledAt)}
                              </div>
                            ) : null}

                            {/* Status badge */}
                            {isPresent ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 20,
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#166534',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}>
                                <CheckCircle2 size={12} color="#16a34a" /> Hadir
                              </span>
                            ) : isExcused ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 20,
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1e40af',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}>
                                <ShieldCheck size={12} color="#2563eb" /> Izin
                              </span>
                            ) : isAbsent ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 20,
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}>
                                <XCircle size={12} color="#64748b" /> Tidak Hadir
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 20,
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                color: '#64748b',
                                fontSize: '12px',
                                fontWeight: 500,
                              }}>
                                <Clock size={12} color="#94a3b8" /> Terjadwal
                              </span>
                            )}

                            {/* Link to Session */}
                            <Link
                              href={ROUTES.LEARN_BOOTCAMP_SESSION(id, s.id)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 8,
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: '#1e293b',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-primary)'
                                e.currentTarget.style.color = 'var(--color-primary)'
                                e.currentTarget.style.background = 'rgba(1, 133, 86, 0.04)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1'
                                e.currentTarget.style.color = '#1e293b'
                                e.currentTarget.style.background = '#ffffff'
                              }}
                            >
                              Masuk
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {data.isEnrolled && data.progress >= 100 ? (
                  <div style={{ padding: '20px', border: '1px solid var(--color-border-subtle)', borderRadius: 10, background: 'var(--color-surface)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 12 }}>Berikan Ulasan Anda</h3>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={24} 
                          strokeWidth={1.5}
                          color={star <= reviewRating ? '#F59E0B' : 'var(--color-border)'} 
                          fill={star <= reviewRating ? '#F59E0B' : 'none'} 
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          onClick={() => setReviewRating(star)}
                        />
                      ))}
                    </div>
                    <textarea 
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Bagaimana pengalaman Anda belajar di bootcamp ini?"
                      style={{ 
                        width: '100%', minHeight: 80, padding: 12, borderRadius: 8, 
                        border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg)',
                        color: 'var(--color-text-primary)', fontSize: '14px', marginBottom: 16,
                        fontFamily: 'inherit', resize: 'vertical'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <motion.button
                        whileHover={!submitReviewMutation.isPending && reviewRating > 0 ? { scale: 1.02 } : {}}
                        whileTap={!submitReviewMutation.isPending && reviewRating > 0 ? { scale: 0.98 } : {}}
                        onClick={() => submitReviewMutation.mutate()}
                        disabled={submitReviewMutation.isPending || reviewRating === 0}
                        style={{
                          padding: '10px 20px', background: 'var(--color-primary)', color: '#fff',
                          border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '13px',
                          cursor: submitReviewMutation.isPending || reviewRating === 0 ? 'not-allowed' : 'pointer',
                          opacity: submitReviewMutation.isPending || reviewRating === 0 ? 0.6 : 1,
                        }}
                      >
                        {submitReviewMutation.isPending ? 'Mengirim...' : 'Kirim Ulasan'}
                      </motion.button>
                    </div>
                  </div>
                ) : data.isEnrolled ? (
                  <div style={{ padding: '20px', textAlign: 'center', border: '1px solid var(--color-border-subtle)', borderRadius: 10, background: 'var(--color-surface)' }}>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Selesaikan bootcamp ini (Progres 100%) untuk memberikan ulasan.</p>
                  </div>
                ) : null}
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
          </CardTabs>
        </div>

        {/* ── RIGHT (Purchase Card) ───────────────────────── */}
        <div style={{ position: 'sticky', top: 32, alignSelf: 'start' }}>
          <div style={{
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 12, overflow: 'hidden',
            background: 'var(--color-surface)',
          }}>
            {/* Thumbnail */}
            <div style={{
              height: 160, background: 'var(--color-bg)',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {data.thumbnailUrl
                ? <img src={data.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Users size={40} color="var(--color-border)" strokeWidth={1} />
              }
            </div>

            <div style={{ padding: '20px' }}>
              {/* Price */}
              <div style={{
                fontSize: '26px', fontWeight: 800,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: 16,
              }}>
                {formatRupiah(data.price)}
              </div>

              {/* CTA */}
              {data.isEnrolled ? (
                (!data.batchStartDate || new Date(data.batchStartDate) <= new Date()) ? (
                  <>
                    <Link href={ROUTES.LEARN_BOOTCAMP(id)} style={{ textDecoration: 'none', display: 'block' }}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          width: '100%', padding: '12px 0',
                          background: 'var(--color-primary)', color: '#fff',
                          borderRadius: 8, fontWeight: 700, fontSize: '14px',
                        }}
                      >
                        <PlayCircle size={16} strokeWidth={2} /> Lanjut Belajar
                      </motion.div>
                    </Link>
                    {attendanceData && (
                      <div style={{
                        marginTop: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: attendanceData.allSessionsAttended ? '#f0fdf4' : '#f8fafc',
                        border: attendanceData.allSessionsAttended ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: attendanceData.allSessionsAttended ? '#166534' : '#475569', marginBottom: 4 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {attendanceData.allSessionsAttended ? <Award size={14} color="#22c55e" /> : <Lock size={14} color="#64748b" />}
                            Presensi Sertifikat
                          </span>
                          <span>{attendanceData.attendedCount} / {attendanceData.totalSessions} Sesi</span>
                        </div>
                        <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(((attendanceData.attendedCount || 0) / (attendanceData.totalSessions || 1)) * 100)}%`, height: '100%', background: attendanceData.allSessionsAttended ? '#22c55e' : 'var(--color-primary)', borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      width: '100%', padding: '12px 0',
                      background: 'var(--color-bg)', color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 8, fontWeight: 700, fontSize: '14px',
                      cursor: 'not-allowed',
                    }}
                  >
                    <Lock size={16} strokeWidth={2} /> Belum Dimulai
                  </div>
                )
              ) : (
                <motion.button
                  whileHover={(!enrollMutation.isPending && canEnroll) ? { scale: 1.02 } : {}}
                  whileTap={(!enrollMutation.isPending && canEnroll) ? { scale: 0.98 } : {}}
                  onClick={() => enrollMutation.mutate()}
                  disabled={!canEnroll || enrollMutation.isPending}
                  style={{
                    width: '100%', padding: '12px 0',
                    background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: '14px',
                    cursor: (!canEnroll || enrollMutation.isPending) ? 'not-allowed' : 'pointer',
                    opacity: (!canEnroll || enrollMutation.isPending) ? 0.6 : 1,
                  }}
                >
                  {enrollMutation.isPending ? 'Memproses...' : (canEnroll ? 'Daftar Sekarang' : data.batchStatus === 'CLOSED' ? 'Pendaftaran Ditutup' : 'Segera Tersedia')}
                </motion.button>
              )}

              {/* Secondary CTAs */}
              {!data.isEnrolled && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <motion.button
                    whileHover={!wishlistMutation.isPending ? { scale: 1.02, backgroundColor: 'var(--color-surface)' } : {}}
                    whileTap={!wishlistMutation.isPending ? { scale: 0.98 } : {}}
                    onClick={() => wishlistMutation.mutate()}
                    disabled={wishlistMutation.isPending}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 0', fontSize: '13px', fontWeight: 600,
                      color: data.isWishlisted ? 'var(--color-error)' : 'var(--color-text-secondary)',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 8, cursor: 'pointer',
                    }}
                  >
                    <Heart size={14} strokeWidth={1.5} fill={data.isWishlisted ? 'currentColor' : 'none'} />
                    {data.isWishlisted ? 'Disimpan' : 'Simpan'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: 'var(--color-surface)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                      color: 'var(--color-text-secondary)',
                    }}
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link disalin!') }}
                  >
                    <Share2 size={14} strokeWidth={1.5} />
                  </motion.button>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '18px 0' }} />

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  Fasilitas Bootcamp
                </p>
                {[
                  { icon: Zap,      text: 'XP dari setiap sesi', color: 'var(--color-xp)' },
                  { icon: Users,    text: `${data.enrollmentCount} peserta terdaftar`, color: 'var(--color-text-tertiary)' },
                  { icon: Clock,    text: formatDuration(data.totalDuration), color: 'var(--color-text-tertiary)' },
                  ...(data.batchStartDate ? [{ icon: Calendar, text: `Mulai: ${formatDate(data.batchStartDate)}`, color: 'var(--color-text-tertiary)' }] : []),
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <item.icon size={14} strokeWidth={1.5} color={item.color} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
