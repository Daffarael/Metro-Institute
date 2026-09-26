'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Star, Users, Clock, ChevronDown, ChevronRight, PlayCircle,
  FileText, CheckCircle2, Lock, Heart, Share2, Award, Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, formatRupiah, formatDuration, FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'

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
  VIDEO: <PlayCircle size={14} />,
  ASSIGNMENT: <FileText size={14} />,
  QUIZ: <CheckCircle2 size={14} />,
}

const FIELD_ICONS: Record<string, string> = {
  UI_UX: '🎨', FRONTEND: '💻', BACKEND: '⚙️', MOBILE: '📱',
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set(['0']))
  const [isWishlisted, setIsWishlisted] = useState(false)

  const { data: course, isLoading, refetch } = useQuery<CourseDetail>({
    queryKey: ['course-detail', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data),
    onSuccess: (data) => setIsWishlisted(data.isWishlisted),
  })

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

  if (isLoading) return <CourseDetailSkeleton />
  if (!course) return null

  const totalSessions = course.chapters.reduce((acc, ch) => acc + ch.sessions.length, 0)
  const freePreviews = course.chapters.flatMap((ch) => ch.sessions.filter((s) => s.isFreePreview))

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-8)', alignItems: 'start' }}>
        {/* ── Left: Detail ─────────────────────────────────── */}
        <div>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <Link href={ROUTES.COURSE_LIST} style={{ color: 'var(--color-primary)' }}>Mini Course</Link>
            <ChevronRight size={14} />
            <span>{FIELD_LABELS[course.field]}</span>
            <ChevronRight size={14} />
            <span className="truncate" style={{ maxWidth: 200 }}>{course.title}</span>
          </nav>

          {/* Title */}
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, lineHeight: 'var(--leading-tight)', marginBottom: 'var(--space-4)' }}>
            {course.title}
          </h1>

          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-5)' }}>
            {course.shortDescription}
          </p>

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <span style={{ fontWeight: 700 }}>{course.rating.toFixed(1)}</span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>({course.reviewCount} ulasan)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              <Users size={14} />
              <span>{course.enrollmentCount} pelajar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              <Clock size={14} />
              <span>{formatDuration(course.totalDuration)}</span>
            </div>
            <span className="badge badge-primary">{FIELD_ICONS[course.field]} {FIELD_LABELS[course.field]}</span>
            <span className="badge badge-neutral">{LEVEL_LABELS[course.level]}</span>
          </div>

          {/* Thumbnail (mobile) */}
          <div style={{
            height: 220, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {course.thumbnailUrl
              ? <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 72 }}>{FIELD_ICONS[course.field]}</span>
            }
          </div>

          {/* Description */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Tentang Kursus Ini</h2>
            <div style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-line' }}>
              {course.description}
            </div>
          </section>

          {/* Curriculum */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Kurikulum</h2>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {course.chapters.length} bab · {totalSessions} sesi · {formatDuration(course.totalDuration)}
              </span>
            </div>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {course.chapters.map((chapter, idx) => {
                const isOpen = openChapters.has(String(idx))
                return (
                  <div key={chapter.id} style={{ borderBottom: idx < course.chapters.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    {/* Chapter header */}
                    <button
                      onClick={() => toggleChapter(String(idx))}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: 'var(--space-4) var(--space-5)',
                        background: isOpen ? 'var(--color-bg)' : 'var(--color-surface)',
                        cursor: 'pointer', transition: 'background var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <ChevronDown size={16} color="var(--color-text-tertiary)"
                          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform var(--transition-base)' }} />
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'left' }}>{chapter.title}</span>
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', marginLeft: 'var(--space-4)' }}>
                        {chapter.sessions.length} sesi
                      </span>
                    </button>

                    {/* Sessions */}
                    {isOpen && (
                      <div>
                        {chapter.sessions.map((session) => (
                          <div key={session.id} style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-5) var(--space-3) calc(var(--space-5) + 28px)',
                            borderTop: '1px solid var(--color-border-subtle)',
                          }}>
                            <span style={{ color: session.isFreePreview ? 'var(--color-primary)' : 'var(--color-text-tertiary)', flexShrink: 0 }}>
                              {SESSION_ICONS[session.type] || <PlayCircle size={14} />}
                            </span>
                            <span style={{ fontSize: 'var(--text-sm)', flex: 1, color: 'var(--color-text-primary)' }}>
                              {session.title}
                            </span>
                            {session.isFreePreview ? (
                              <span className="badge badge-success" style={{ fontSize: '10px' }}>Preview Gratis</span>
                            ) : course.isEnrolled ? null : (
                              <Lock size={12} color="var(--color-text-tertiary)" />
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
          </section>

          {/* Reviews */}
          {course.reviews.length > 0 && (
            <section>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Ulasan ({course.reviewCount})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {course.reviews.slice(0, 5).map((review) => (
                  <div key={review.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <div className="avatar avatar-sm">{review.user.name[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{review.user.name}</div>
                        <div style={{ display: 'flex' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} color="#F59E0B" fill={i < review.rating ? '#F59E0B' : 'none'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.content && (
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                        {review.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Right: Sticky CTA Card ────────────────────── */}
        <div style={{ position: 'sticky', top: 'calc(var(--topbar-height) + var(--space-6))' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Thumbnail */}
            <div style={{ height: 160, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {course.thumbnailUrl
                ? <img src={course.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 56 }}>{FIELD_ICONS[course.field]}</span>
              }
            </div>

            <div style={{ padding: 'var(--space-5)' }}>
              {/* Price */}
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 'var(--space-4)' }}>
                {formatRupiah(course.price)}
              </div>

              {/* CTAs */}
              {course.isEnrolled ? (
                <Link href={ROUTES.LEARN_COURSE(course.id)} className="btn btn-primary btn-full">
                  <PlayCircle size={16} /> Lanjut Belajar
                </Link>
              ) : (
                <button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className={`btn btn-primary btn-full ${checkoutMutation.isPending ? 'btn-loading' : ''}`}
                >
                  {!checkoutMutation.isPending && 'Beli Sekarang'}
                </button>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <button
                  onClick={() => wishlistMutation.mutate()}
                  disabled={wishlistMutation.isPending}
                  className="btn btn-secondary"
                  style={{ flex: 1, gap: 'var(--space-2)' }}
                >
                  <Heart size={15} fill={isWishlisted ? 'var(--color-error)' : 'none'} color={isWishlisted ? 'var(--color-error)' : 'currentColor'} />
                  {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>
                <button className="btn btn-secondary" style={{ gap: 'var(--space-2)' }}
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link disalin!') }}>
                  <Share2 size={15} />
                </button>
              </div>

              {/* Features */}
              <div style={{ marginTop: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { icon: Clock, text: `Akses ${course.accessDays} hari` },
                  { icon: CheckCircle2, text: `${totalSessions} sesi pembelajaran` },
                  { icon: FileText, text: 'Materi & project files' },
                  { icon: Award, text: 'Sertifikat penyelesaian' },
                  { icon: Shield, text: 'Garansi uang kembali 3 hari' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    <f.icon size={14} color="var(--color-primary)" />
                    {f.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          {course.tags.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {course.tags.map((tag) => (
                <span key={tag} className="badge badge-neutral">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CourseDetailSkeleton() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
      <div>
        <div className="skeleton" style={{ height: 14, width: 250, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 40, width: '80%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 16, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      </div>
      <div>
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    </div>
  )
}
