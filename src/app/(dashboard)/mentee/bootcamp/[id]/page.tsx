'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Star, Users, Clock, ChevronRight, Play, Lock, Heart,
  CheckCircle2, Calendar, Zap, User, ChevronDown, ChevronUp, Share2, PlayCircle,
  FileText, HelpCircle, FileEdit
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
              { id: 'reviews', label: 'Ulasan' },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as 'overview' | 'curriculum' | 'reviews')}
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
                              {chapter.sessions.map((session, idx: number) => (
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
                                    cursor: 'default',
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
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
                new Date(data.startDate) <= new Date() ? (
                  <Link href={data.chapters?.[0]?.sessions?.[0] ? ROUTES.LEARN_BOOTCAMP_SESSION(id, data.chapters[0].sessions[0].id) : '#'} style={{ textDecoration: 'none', display: 'block' }}>
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
