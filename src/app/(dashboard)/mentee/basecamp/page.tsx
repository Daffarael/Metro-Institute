'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PlaySquare, Flame, CheckCircle2, Circle, ArrowRight, Calendar, PlayCircle, Clock, Trophy, ChevronRight, Search, Zap, Code, Layout, Smartphone, Star, MessageCircle, GraduationCap } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, formatRupiah, formatDate, BADGE_LABELS } from '@/lib/utils'
import { motion } from 'framer-motion'

interface BasecampData {
  user: {
    id: string; name: string; photoUrl?: string; totalXp: number
    currentStreak: number; badgeLevel: string; selectedField?: string
  }
  continueLearning?: {
    type: 'bootcamp' | 'mini-course'; id: string; sessionId: string
    title: string; sessionTitle: string; progress: number; thumbnail?: string
  }
  activeCourses: Array<{
    id: string; title: string; type: 'bootcamp' | 'mini-course'
    progress: number; thumbnail?: string; accessUntil?: string; field: string
  }>
  upcomingLive?: Array<{
    id: string; bootcampId: string; title: string
    scheduledAt: string; liveUrl: string
  }>
  recommendations: Array<{
    id: string; title: string; type: 'bootcamp' | 'mini-course'
    price: number; field: string; level: string; thumbnail?: string; rating: number
  }>
  missionComplete: boolean
  nextBadgeXp: number
  nextBadgeLevel: string
}

const BADGE_XP: Record<string, number> = {
  METRO_ROOKIE: 500, METRO_EXPLORER: 2000,
  METRO_ACHIEVER: 5000, METRO_EXPERT: 10000, METRO_MASTER: 10000,
}

export default function BasecampPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery<BasecampData>({
    queryKey: ['basecamp'],
    queryFn: () => api.get('/users/basecamp').then((r) => r.data.data),
    enabled: !!user,
  })

  if (isLoading) return <BasecampSkeleton />

  const nextXp      = BADGE_XP[user?.badgeLevel || 'METRO_ROOKIE'] || 500
  const progressPct = Math.min(100, ((user?.totalXp || 0) / nextXp) * 100)

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="basecamp-header-container" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
              {BADGE_LABELS[user?.badgeLevel || 'METRO_ROOKIE']}
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Hai, {user?.name ? user.name.split(' ')[0] : 'Sobat'}!
            </h1>
          </div>
        </div>

        {/* XP & Streak */}
        <div className="basecamp-xp-container" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
          <div className="basecamp-xp-inner" style={{ textAlign: 'right', width: '100%' }}>
            <div className="basecamp-streak" style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginBottom: 6 }}>
              <Flame size={13} color="var(--color-streak)" />
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                {user?.currentStreak || 0} hari streak
              </span>
            </div>
            <div className="basecamp-xp-bar" style={{ width: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>XP</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {(user?.totalXp || 0).toLocaleString()} / {nextXp.toLocaleString()}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--color-primary)', borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
              <div className="basecamp-next-badge" style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 5, textAlign: 'right' }}>
                Menuju <strong style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{BADGE_LABELS['METRO_EXPLORER']}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────── */}
      <div className="basecamp-grid" style={{ display: 'grid', gap: 'var(--space-5)', alignItems: 'start' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* Continue / Empty State */}
          {data?.continueLearning ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Lanjutkan Belajar</span>
              </div>
              <Link
                href={data.continueLearning.type === 'bootcamp'
                  ? ROUTES.LEARN_BOOTCAMP_SESSION(data.continueLearning.id, data.continueLearning.sessionId)
                  : ROUTES.LEARN_COURSE_SESSION(data.continueLearning.id, data.continueLearning.sessionId)
                }
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  position: 'relative', height: 180, background: '#111',
                  display: 'flex', alignItems: 'flex-end', padding: 'var(--space-5)',
                }}>
                  <div style={{ position: 'absolute', inset: 0 }}>
                    {data.continueLearning.thumbnail
                      ? <img src={data.continueLearning.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
                      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-primary) 0%, #012a1a 100%)' }} />
                    }
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)' }} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ maxWidth: '70%' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {data.continueLearning.sessionTitle}
                      </div>
                      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                        {data.continueLearning.title}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ position: 'relative', width: 52, height: 52 }}>
                        <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                          <circle cx="26" cy="26" r="22" fill="none" stroke="white" strokeWidth="4"
                            strokeDasharray="138" strokeDashoffset={138 - (138 * data.continueLearning.progress) / 100} />
                        </svg>
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 700 }}>
                          {data.continueLearning.progress}%
                        </span>
                      </div>
                      <span style={{ background: 'white', color: '#0a0a0a', padding: '5px 14px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 700 }}>
                        Lanjutkan
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="card" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Mulai Perjalananmu</span>
              </div>
              <div style={{ padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
                <GraduationCap size={40} color="var(--color-border)" />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>Belum ada kelas aktif</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
                    Eksplorasi Bootcamp atau Mini Course untuk memulai perjalanan belajarmu.
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  <Link href={ROUTES.BOOTCAMP_LIST} style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '10px 20px',
                        background: 'var(--color-primary)', color: '#fff',
                        borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px',
                      }}
                    >
                      Cari Bootcamp
                    </motion.div>
                  </Link>
                  <Link href={ROUTES.COURSE_LIST} style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '10px 20px',
                        background: '#fff', color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px',
                      }}
                    >
                      Cari Mini Course
                    </motion.div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Kelas Aktif */}
          {data?.activeCourses && data.activeCourses.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Kelas Aktif</span>
                <Link href={ROUTES.MY_COURSES} style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                  Lihat semua <ArrowRight size={12} />
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', padding: 'var(--space-4) var(--space-5)' }} className="hide-scrollbar">
                {data.activeCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={course.type === 'bootcamp' ? ROUTES.LEARN_BOOTCAMP(course.id) : ROUTES.LEARN_COURSE(course.id)}
                    style={{ textDecoration: 'none', flexShrink: 0, width: 220 }}
                  >
                    <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'box-shadow 0.2s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{ height: 100, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-subtle)', position: 'relative', flexShrink: 0 }}>
                        {course.thumbnail
                          ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <PlaySquare size={24} color="var(--color-border)" />
                            </div>
                        }
                      </div>
                      <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                          {course.type === 'bootcamp' ? 'Bootcamp' : 'Mini Course'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.4, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {course.title}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 5 }}>
                          <span>Progress</span><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{course.progress}%</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${course.progress}%`, background: 'var(--color-primary)', borderRadius: 2, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Jadwal Live */}
          {data?.upcomingLive && data.upcomingLive.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Jadwal Live Terdekat</span>
              </div>
              <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {data.upcomingLive.map((live) => {
                  const isSoon = new Date(live.scheduledAt).getTime() - Date.now() < 15 * 60 * 1000
                  return (
                    <div key={live.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{formatDate(live.scheduledAt)}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{live.title}</div>
                      </div>
                      <a href={live.liveUrl} target="_blank" rel="noopener noreferrer"
                        className={`btn btn-sm ${isSoon ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flexShrink: 0, opacity: isSoon ? 1 : 0.5, pointerEvents: isSoon ? 'auto' : 'none', fontSize: '12px' }}>
                        Masuk
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* Misi Hari Ini */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Misi Hari Ini</span>
            </div>
            <div style={{ padding: 'var(--space-3) var(--space-5)', display: 'flex', flexDirection: 'column' }}>
              {!user?.photoUrl && (
                <MissionItem title="Pasang Foto Profil" xp={20} done={false} link={ROUTES.SETTINGS} />
              )}
              <MissionItem title="Tonton 1 materi video" xp={5}  done={false} />
              <MissionItem title="Kerjakan 1 challenge"  xp={10} done={false} />
            </div>
            <div style={{ padding: 'var(--space-3) var(--space-5)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Selesaikan semua misi</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>+15 XP</span>
            </div>
          </div>

          {/* Rekomendasi */}
          {data?.recommendations && data.recommendations.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Rekomendasi</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.recommendations.slice(0, 3).map((rec, i) => (
                  <Link key={rec.id} href={rec.type === 'bootcamp' ? ROUTES.BOOTCAMP_DETAIL(rec.id) : ROUTES.COURSE_DETAIL(rec.id)} style={{ textDecoration: 'none' }}>
                    <div
                      style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-5)', alignItems: 'center', borderBottom: i < 2 ? '1px solid var(--color-border-subtle)' : 'none', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 44, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {rec.thumbnail
                          ? <img src={rec.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <PlaySquare size={14} color="var(--color-border)" />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-primary)' }}>{rec.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600, marginTop: 2 }}>{formatRupiah(rec.price)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Discord */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Komunitas</span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
                Bergabung di Discord eksklusif Metro Institute.
              </p>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600 }}>
                <MessageCircle size={14} /> Gabung Discord
              </a>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

// ── Helper Components ──────────────────────────────────────────

function MissionItem({ title, xp, done, link }: { title: string; xp: number; done: boolean; link?: string }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
      {done
        ? <CheckCircle2 size={16} color="var(--color-primary)" />
        : <Circle size={16} color="var(--color-border)" />
      }
      <span style={{ flex: 1, fontSize: '13px', color: done ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
        {title}
      </span>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
        +{xp} XP
      </span>
    </div>
  )
  if (link) return <Link href={link} style={{ textDecoration: 'none' }}>{content}</Link>
  return content
}

function BasecampSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 10, width: 80, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 24, width: 200, borderRadius: 6 }} />
        </div>
      </div>
      <div className="basecamp-grid" style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="skeleton" style={{ height: 160, width: 220, borderRadius: 10, flexShrink: 0 }} />
            <div className="skeleton" style={{ height: 160, width: 220, borderRadius: 10, flexShrink: 0 }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 100, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  )
}
