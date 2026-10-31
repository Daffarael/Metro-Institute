'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Star, Users, Clock, ChevronRight, Play, Lock, Heart,
  CheckCircle2, Calendar, Zap, User, ChevronDown, ChevronUp, Share2, PlayCircle,
  FileText, HelpCircle, FileEdit, Award, ShieldCheck, XCircle, AlertCircle, Video
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
                    borderRadius: 16,
                    background: '#ffffff',
                    border: '2px solid #018556',
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
                    border: '1.5px solid #cbd5e1',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: '#018556',
                          color: '#FAE653',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Lock size={20} color="#FAE653" strokeWidth={2.2} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                              Status Kelulusan & E-Sertifikat
                            </div>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 20,
                              background: '#ffffff',
                              border: '1.5px solid #0f172a',
                              color: '#0f172a',
                              fontSize: '11.5px',
                              fontWeight: 700,
                            }}>
                              Terkunci · {attendanceData?.attendedCount || 0} dari {attendanceData?.totalSessions || 0} Sesi Tuntas
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                            Syarat Penerbitan: Tuntaskan 100% seluruh sesi (hadir min. 80% pada setiap sesi Live Google Meet, serta selesaikan semua materi, kuis, dan tugas praktik).
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#018556', lineHeight: 1 }}>
                          {attendanceData?.totalSessions ? Math.round(((attendanceData?.attendedCount || 0) / attendanceData.totalSessions) * 100) : 0}%
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
                          Progres Kelulusan
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginBottom: 18 }}>
                      <div style={{
                        width: `${attendanceData?.totalSessions ? Math.round(((attendanceData?.attendedCount || 0) / attendanceData.totalSessions) * 100) : 0}%`,
                        height: '100%',
                        background: '#018556',
                        borderRadius: 999,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>

                    {/* Panduan Keterangan Syarat Presensi & Belajar */}
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: 12,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 16,
                      
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#018556', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <Video size={15} color="#ffffff" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                            Sesi Live Google Meet (Syarat Hadir 80%)
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45, marginTop: 2 }}>
                            Durasi hadir dihitung otomatis oleh server Google Meet. Wajib aktif minimal 80% dari total menit sesi agar tercatat Hadir.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#018556', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <FileText size={15} color="#ffffff" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                            Sesi Mandiri (Materi, Kuis & Tugas)
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45, marginTop: 2 }}>
                            Tonton video pembelajaran min. 90%, baca dokumen materi, kerjakan kuis evaluasi, atau kirimkan tugas praktik untuk menuntaskannya.
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ── Checklist Kehadiran Sesi ─────────────────────── */}
                <div style={{
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#ffffff',
                }}>
                  <div style={{
                    padding: '16px 22px',
                    borderBottom: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                        Daftar Sesi Pembelajaran & Status Kehadiran
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: 2 }}>
                        Total {attendanceData?.totalSessions || 0} sesi kurikulum bootcamp
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                      Sesi Live: min. hadir 80% · Sesi Mandiri: tonton video / kuis / tugas
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {attendanceData?.sessions?.map((s: any, idx: number) => {
                      const isLive = s.type === 'LIVE'
                      const isPresent = s.attendance?.status === 'PRESENT' || s.attendance?.status === 'MANUAL'
                      const isExcused = s.attendance?.status === 'EXCUSED'
                      const isAbsent = s.attendance?.status === 'ABSENT'
                      const isDone = s.isCompleted

                      // Status label & badge
                      let badgeBg = '#ffffff'
                      let badgeColor = '#475569'
                      let badgeBorder = '1.5px solid #cbd5e1'
                      let badgeText = 'Terjadwal'
                      let badgeIcon = <Clock size={13} color="#64748b" />

                      if (isLive) {
                        if (isPresent) {
                          badgeBg = '#018556'
                          badgeColor = '#ffffff'
                          badgeBorder = 'none'
                          badgeText = 'Hadir Live'
                          badgeIcon = <CheckCircle2 size={13} color="#ffffff" />
                        } else if (isExcused) {
                          badgeBg = '#2563eb'
                          badgeColor = '#ffffff'
                          badgeBorder = 'none'
                          badgeText = 'Izin Disetujui'
                          badgeIcon = <ShieldCheck size={13} color="#ffffff" />
                        } else if (isAbsent) {
                          badgeBg = '#475569'
                          badgeColor = '#ffffff'
                          badgeBorder = 'none'
                          badgeText = 'Tidak Hadir'
                          badgeIcon = <XCircle size={13} color="#ffffff" />
                        } else {
                          badgeText = 'Belum Dimulai'
                        }
                      } else {
                        if (isDone) {
                          badgeBg = '#018556'
                          badgeColor = '#ffffff'
                          badgeBorder = 'none'
                          badgeText = 'Selesai'
                          badgeIcon = <CheckCircle2 size={13} color="#ffffff" />
                        } else {
                          if (s.type === 'QUIZ') badgeText = 'Kuis Belum Selesai'
                          else if (s.type === 'ASSIGNMENT') badgeText = 'Tugas Belum Kirim'
                          else if (s.type === 'VIDEO') badgeText = 'Video Belum Selesai'
                          else badgeText = 'Materi Belum Dibaca'
                        }
                      }

                      // Type Label
                      const typeLabel = s.type === 'LIVE'
                        ? 'Sesi Live Google Meet'
                        : s.type === 'QUIZ'
                        ? 'Kuis Evaluasi'
                        : s.type === 'ASSIGNMENT'
                        ? 'Tugas Praktik'
                        : s.type === 'VIDEO'
                        ? 'Video Pembelajaran'
                        : 'Materi / Dokumen'

                      const isPassed = isLive ? (isPresent || isExcused) : isDone

                      return (
                        <div
                          key={s.id}
                          style={{
                            padding: '16px 22px',
                            borderBottom: idx === attendanceData.sessions.length - 1 ? 'none' : '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12,
                            background: '#ffffff',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 280px' }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: isPassed ? '#018556' : isLive && isAbsent ? '#475569' : '#ffffff',
                              color: isPassed || (isLive && isAbsent) ? '#ffffff' : '#64748b',
                              border: isPassed || (isLive && isAbsent) ? 'none' : '1.5px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {isPassed ? <CheckCircle2 size={18} /> : isLive && isAbsent ? <XCircle size={18} /> : <Clock size={18} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                {s.title}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: isLive ? '#018556' : '#475569',
                                  background: '#ffffff',
                                  border: isLive ? '1.5px solid #018556' : '1px solid #cbd5e1',
                                  padding: '1px 7px',
                                  borderRadius: 4,
                                }}>
                                  {typeLabel}
                                </span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                  {s.chapterTitle}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {/* Duration or schedule info */}
                            {isLive ? (
                              s.attendance?.durationMinutes > 0 ? (
                                <div style={{ textAlign: 'right', fontSize: '12.5px' }}>
                                  <div style={{ fontWeight: 800, color: isPresent ? '#018556' : isExcused ? '#2563eb' : '#475569' }}>
                                    {s.attendance.durationMinutes} / {s.durationMinutes} menit
                                  </div>
                                  <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                                    min. {s.minRequiredMinutes} mnt (80%)
                                  </div>
                                </div>
                              ) : s.liveScheduledAt ? (
                                <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                                  <div>{formatDate(s.liveScheduledAt)}</div>
                                  <div style={{ color: '#64748b', fontSize: '11px' }}>Syarat hadir min. 80%</div>
                                </div>
                              ) : null
                            ) : (
                              s.videoDuration ? (
                                <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                                  <div style={{ fontWeight: 700 }}>{formatDuration(s.videoDuration)}</div>
                                  <div style={{ color: '#64748b', fontSize: '11px' }}>Tonton min. 90%</div>
                                </div>
                              ) : (
                                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#64748b' }}>
                                  {s.type === 'QUIZ' ? 'Passing grade 80%' : s.type === 'ASSIGNMENT' ? 'Kirim tugas praktik' : 'Baca modul'}
                                </div>
                              )
                            )}

                            {/* Status badge */}
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 20,
                              background: badgeBg,
                              border: badgeBorder,
                              color: badgeColor,
                              fontSize: '12px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}>
                              {badgeIcon} {badgeText}
                            </span>

                            {/* Solid Masuk Button */}
                            <Link
                              href={ROUTES.LEARN_BOOTCAMP_SESSION(id, s.id)}
                              style={{
                                padding: '7px 18px',
                                borderRadius: 8,
                                background: '#018556',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'opacity 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.9'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1'
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
