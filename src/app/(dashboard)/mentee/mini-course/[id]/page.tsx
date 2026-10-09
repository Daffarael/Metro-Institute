'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Star, Users, Clock, ChevronDown, ChevronRight, PlayCircle,
  FileText, CheckCircle2, Lock, Heart, Share2, Award, Shield, BookOpen, Infinity
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { ROUTES, formatRupiah, formatDuration, FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'
import { CardTabs } from '@/components/ui/AnimatedTabs'

interface CourseDetail {
  id: string
  title: string
  shortDescription: string
  description: string
  field: string
  level: string
  price: number
  thumbnailUrl?: string
  totalDuration: number
  accessDays: number
  rating: number
  reviewCount: number
  enrollmentCount: number
  tags: string[]
  isEnrolled: boolean
  isWishlisted: boolean
  chapters: Array<{
    id: string; title: string; orderIndex: number
    sessions: Array<{
      id: string; title: string; type: string
      videoDuration?: number; isFreePreview: boolean; orderIndex: number
    }>
  }>
  reviews: Array<{
    id: string; rating: number; content?: string
    user: { name: string; photoUrl?: string }; createdAt: string
  }>
}

const SESSION_ICONS: Record<string, React.ReactNode> = {
  VIDEO:      <PlayCircle size={14} strokeWidth={1.5} />,
  ASSIGNMENT: <FileText size={14} strokeWidth={1.5} />,
  QUIZ:       <CheckCircle2 size={14} strokeWidth={1.5} />,
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const { setSearchPlaceholder } = useUIStore()
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set(['0']))
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview')

  const { data: course, isLoading, refetch } = useQuery<CourseDetail>({
    queryKey: ['course-detail', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data),
  })

  useEffect(() => { if (course) setIsWishlisted(course.isWishlisted) }, [course])

  const wishlistMutation = useMutation({
    mutationFn: () =>
      isWishlisted
        ? api.delete(`/wishlist/course/${id}`)
        : api.post('/wishlist', { productType: 'MINI_COURSE', courseId: id }),
    onSuccess: () => {
      setIsWishlisted(!isWishlisted)
      toast.success(isWishlisted ? 'Dihapus dari wishlist' : 'Ditambahkan ke wishlist')
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: () => api.post('/transactions/initiate', { productType: 'MINI_COURSE', courseId: id }).then((r) => r.data),
    onSuccess: (data) => {
      if (data.data.snapToken && typeof window !== 'undefined') {
        (window as any).snap?.pay(data.data.snapToken, {
          onSuccess: () => router.push(`${ROUTES.CHECKOUT_SUCCESS}?type=course&id=${id}`),
          onError: () => toast.error('Pembayaran gagal.'),
          onClose: () => toast('Pembayaran dibatalkan.'),
        })
      }
    },
    onError: () => toast.error('Gagal memulai checkout.'),
  })

  const toggleChapter = (idx: string) => {
    setOpenChapters((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  useEffect(() => {
    if (course) {
      setSearchPlaceholder(`Mini Course / ${course.title}`)
    }
    return () => setSearchPlaceholder(null)
  }, [course, setSearchPlaceholder])

  if (isLoading) return <CourseDetailSkeleton />
  if (!course) return null

  const totalSessions = course.chapters.reduce((acc, ch) => acc + ch.sessions.length, 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48 }}>

        {/* ── LEFT ──────────────────────────────────────── */}
        <div>
          {/* Breadcrumb */}
          <nav style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 28, fontSize: '13px',
            color: 'var(--color-text-tertiary)',
          }}>
            <Link href={ROUTES.COURSE_LIST} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
              Mini Course
            </Link>
            <ChevronRight size={13} strokeWidth={1.5} />
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {course.title}
            </span>
          </nav>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {FIELD_LABELS[course.field]}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--color-border)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              {LEVEL_LABELS[course.level]}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '28px', fontWeight: 800, lineHeight: 1.25,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            marginBottom: 14,
          }}>
            {course.title}
          </h1>

          <p style={{
            fontSize: '15px', color: 'var(--color-text-secondary)',
            lineHeight: 1.6, marginBottom: 24,
          }}>
            {course.shortDescription}
          </p>

          {/* Meta strip */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            gap: 20, marginBottom: 32,
            paddingBottom: 24,
            borderBottom: '1px solid var(--color-border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {course.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                ({course.reviewCount} ulasan)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              <Users size={13} strokeWidth={1.5} />
              <span>{course.enrollmentCount} pelajar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              <Clock size={13} strokeWidth={1.5} />
              <span>{formatDuration(course.totalDuration)}</span>
            </div>
          </div>

          {/* Thumbnail (left side, mobile visible) */}
          <div style={{
            aspectRatio: '16/9', borderRadius: 12,
            border: '1px solid var(--color-border-subtle)',
            marginBottom: 36, overflow: 'hidden',
            background: 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {course.thumbnailUrl
              ? <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <BookOpen size={48} color="var(--color-border)" strokeWidth={1} />
            }
          </div>

          {/* About */}
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
                <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 12, color: 'var(--color-text-primary)' }}>
                  Tentang Kursus
                </h2>
                <div style={{
                  fontSize: '14px', color: 'var(--color-text-secondary)',
                  lineHeight: 1.7, whiteSpace: 'pre-line',
                }}>
                  {course.description}
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-text-primary)' }}>
                    Kurikulum
                  </h2>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                    {course.chapters.length} bab · {totalSessions} sesi · {formatDuration(course.totalDuration)}
                  </span>
                </div>

                <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
                  {course.chapters.map((chapter, idx) => {
                    const isOpen = openChapters.has(String(idx))
                    return (
                      <div key={chapter.id} style={{ borderBottom: idx < course.chapters.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                        <button
                          onClick={() => toggleChapter(String(idx))}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            background: isOpen ? 'var(--color-bg)' : 'var(--color-surface)',
                            cursor: 'pointer', border: 'none',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ChevronDown
                              size={15}
                              color="var(--color-text-tertiary)"
                              strokeWidth={2}
                              style={{
                                transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                transition: 'transform 0.2s ease',
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontWeight: 600, fontSize: '14px', textAlign: 'left', color: 'var(--color-text-primary)' }}>
                              {chapter.title}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', marginLeft: 16 }}>
                            {chapter.sessions.length} sesi
                          </span>
                        </button>

                        {isOpen && (
                          <div>
                            {chapter.sessions.map((session) => (
                              <div key={session.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '11px 18px 11px 46px',
                                borderTop: '1px solid var(--color-border-subtle)',
                              }}>
                                <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                                  {SESSION_ICONS[session.type] || <PlayCircle size={14} strokeWidth={1.5} />}
                                </span>
                                <span style={{ fontSize: '13px', flex: 1, color: 'var(--color-text-primary)' }}>
                                  {session.title}
                                </span>
                                {session.isFreePreview ? (
                                  <span style={{
                                    fontSize: '11px', fontWeight: 600,
                                    color: 'var(--color-primary)',
                                    background: 'rgba(var(--color-primary-rgb, 0,128,77), 0.08)',
                                    padding: '2px 8px', borderRadius: 20,
                                  }}>
                                    Preview Gratis
                                  </span>
                                ) : course.isEnrolled ? null : (
                                  <Lock size={12} color="var(--color-border)" strokeWidth={1.5} />
                                )}
                                {session.videoDuration && (
                                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                                    {formatDuration(session.videoDuration)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {course.reviews.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', border: '1px solid var(--color-border-subtle)', borderRadius: 10 }}>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>Belum ada ulasan</p>
                  </div>
                ) : (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 16, color: 'var(--color-text-primary)' }}>
                      Ulasan <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)', fontSize: '15px' }}>({course.reviewCount})</span>
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {course.reviews.slice(0, 5).map((review) => (
                        <div key={review.id} style={{
                          padding: '16px 18px',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: 10,
                          background: 'var(--color-surface)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'var(--color-bg)',
                              border: '1px solid var(--color-border-subtle)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)',
                              flexShrink: 0,
                            }}>
                              {review.user.name[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                                {review.user.name}
                              </div>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} size={11} color="#F59E0B" fill={i < review.rating ? '#F59E0B' : 'none'} />
                                ))}
                              </div>
                            </div>
                          </div>
                          {review.content && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                              {review.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardTabs>
        </div>

        {/* ── RIGHT: Sticky CTA ─────────────────────────── */}
        <div style={{ position: 'sticky', top: 32, alignSelf: 'start' }}>
          <div style={{
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 12, overflow: 'hidden',
            background: 'var(--color-surface)',
          }}>
            {/* Thumbnail */}
            <div style={{
              aspectRatio: '16/9', background: 'var(--color-bg)',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {course.thumbnailUrl
                ? <img src={course.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <BookOpen size={40} color="var(--color-border)" strokeWidth={1} />
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
                {course.price === 0 ? 'Gratis' : formatRupiah(course.price)}
              </div>

              {/* CTA */}
              {course.isEnrolled ? (
                <Link href={ROUTES.LEARN_COURSE(course.id)} style={{ textDecoration: 'none', display: 'block' }}>
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
                <motion.button
                  whileHover={!checkoutMutation.isPending ? { scale: 1.02 } : {}}
                  whileTap={!checkoutMutation.isPending ? { scale: 0.98 } : {}}
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  style={{
                    width: '100%', padding: '12px 0',
                    background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: '14px',
                    cursor: checkoutMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: checkoutMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {checkoutMutation.isPending ? 'Memproses...' : 'Beli Sekarang'}
                </motion.button>
              )}

              {/* Secondary CTAs */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <motion.button
                  whileHover={!wishlistMutation.isPending ? { scale: 1.02, backgroundColor: 'var(--color-surface)' } : {}}
                  whileTap={!wishlistMutation.isPending ? { scale: 0.98 } : {}}
                  onClick={() => wishlistMutation.mutate()}
                  disabled={wishlistMutation.isPending}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0', fontSize: '13px', fontWeight: 600,
                    color: isWishlisted ? 'var(--color-error)' : 'var(--color-text-secondary)',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 8, cursor: 'pointer',
                  }}
                >
                  <Heart size={14} strokeWidth={1.5} fill={isWishlisted ? 'currentColor' : 'none'} />
                  {isWishlisted ? 'Disimpan' : 'Simpan'}
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

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '18px 0' }} />

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  Fasilitas Kursus
                </p>
                {[
                  { icon: course.accessDays > 10000 ? Infinity : Clock,        text: course.accessDays > 10000 ? 'Akses seumur hidup' : `Akses ${course.accessDays} hari` },
                  { icon: CheckCircle2, text: `${totalSessions} sesi pembelajaran` },
                  { icon: FileText,     text: 'Materi & project files' },
                  { icon: Award,        text: 'Sertifikat penyelesaian' },
                  { icon: Shield,       text: 'Garansi uang kembali 3 hari' },
                ].map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: '13px', color: 'var(--color-text-secondary)',
                  }}>
                    <f.icon size={14} strokeWidth={1.5} color="var(--color-text-tertiary)" />
                    {f.text}
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

function CourseDetailSkeleton() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48 }}>
      <div>
        <div className="skeleton" style={{ height: 13, width: 220, marginBottom: 24, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 36, width: '75%', marginBottom: 12, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 18, width: '55%', marginBottom: 28, borderRadius: 4 }} />
        <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 12, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 180, borderRadius: 10 }} />
      </div>
      <div>
        <div className="skeleton" style={{ height: 420, borderRadius: 12 }} />
      </div>
    </div>
  )
}
