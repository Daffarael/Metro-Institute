'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PlaySquare, Flame, GraduationCap, CheckCircle2, Circle, ArrowRight, MessageCircle } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, formatRupiah, formatDate, BADGE_LABELS } from '@/lib/utils'

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
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

      {/* ── Greeting ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        {/* Left: Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-full)', overflow: 'hidden',
            border: '2px solid var(--color-border)', background: 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {user?.photoUrl
              ? <img src={user.photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>{user?.name?.charAt(0).toUpperCase() || 'M'}</span>
            }
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {BADGE_LABELS[user?.badgeLevel || 'METRO_ROOKIE']}
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Hai, {user?.name ? user.name.split(' ')[0] : 'Sobat'}!
            </h1>
          </div>
        </div>

        {/* Right: XP Progress */}
        <div style={{ flex: '0 1 280px', minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Flame size={14} color="var(--color-streak)" />
              {user?.currentStreak || 0} hari streak
            </span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
              {(user?.totalXp || 0).toLocaleString()}
              <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)' }}> / {nextXp.toLocaleString()} XP</span>
            </span>
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 6, textAlign: 'right' }}>
            Menuju <strong style={{ color: 'var(--color-text-secondary)' }}>{BADGE_LABELS['METRO_EXPLORER']}</strong>
          </div>
        </div>
      </div>

      {/* ── Main 2-Column ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* Left: Continue Learning or Empty State */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {data?.continueLearning ? (
            <section>
              <SectionHeader title="Lanjutkan Belajar" />
              <Link
                href={data.continueLearning.type === 'bootcamp'
                  ? ROUTES.LEARN_BOOTCAMP_SESSION(data.continueLearning.id, data.continueLearning.sessionId)
                  : ROUTES.LEARN_COURSE_SESSION(data.continueLearning.id, data.continueLearning.sessionId)
                }
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
                  background: '#111', height: 200, display: 'flex', alignItems: 'flex-end', padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-md)',
                }}>
                  <div style={{ position: 'absolute', inset: 0 }}>
                    {data.continueLearning.thumbnail
                      ? <img src={data.continueLearning.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: 'blur(8px) brightness(0.8)' }} />
                      : <div style={{ width: '100%', height: '100%', background: 'var(--gradient-hero)' }} />
                    }
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(1,133,86,0.95) 0%, rgba(1,133,86,0.4) 60%, transparent 100%)' }} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ maxWidth: '70%' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Sesi: {data.continueLearning.sessionTitle}
                      </div>
                      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'white', lineHeight: 1.3 }}>
                        {data.continueLearning.title}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ position: 'relative', width: 56, height: 56 }}>
                        <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                          <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-xp)" strokeWidth="5"
                            strokeDasharray="150" strokeDashoffset={150 - (150 * data.continueLearning.progress) / 100} />
                        </svg>
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 700 }}>
                          {data.continueLearning.progress}%
                        </span>
                      </div>
                      <span style={{ background: 'var(--color-xp)', color: '#0A2B1E', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                        ▶ Putar
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          ) : (
            <section>
              <SectionHeader title="Mulai Perjalananmu" />
              <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
                <GraduationCap size={44} color="var(--color-primary)" style={{ opacity: 0.15, margin: '0 auto var(--space-4)' }} />
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Belum ada kelas aktif</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', maxWidth: 380, margin: '0 auto var(--space-6)', lineHeight: 1.6 }}>
                  Eksplorasi Bootcamp atau Mini Course untuk memulai perjalanan belajarmu.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                  <Link href={ROUTES.BOOTCAMP_LIST} className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '10px 24px' }}>Eksplorasi Bootcamp</Link>
                  <Link href={ROUTES.COURSE_LIST} className="btn btn-secondary" style={{ borderRadius: 'var(--radius-full)', padding: '10px 24px' }}>Lihat Mini Course</Link>
                </div>
              </div>
            </section>
          )}

          {/* Kelas Aktif */}
          {data?.activeCourses && data.activeCourses.length > 0 && (
            <section>
              <SectionHeader title="Kelas Aktif" href={ROUTES.MY_COURSES} />
              <div className="hide-scrollbar" style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
                {data.activeCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={course.type === 'bootcamp' ? ROUTES.LEARN_BOOTCAMP(course.id) : ROUTES.LEARN_COURSE(course.id)}
                    style={{ textDecoration: 'none', flexShrink: 0, width: 260 }}
                  >
                    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ height: 110, background: 'var(--color-primary-light)', position: 'relative', flexShrink: 0 }}>
                        {course.thumbnail
                          ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <PlaySquare size={28} color="var(--color-primary)" style={{ opacity: 0.3 }} />
                            </div>
                        }
                      </div>
                      <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {course.type === 'bootcamp' ? 'Bootcamp' : 'Mini Course'}
                        </div>
                        <div className="line-clamp-2" style={{ fontSize: 'var(--text-sm)', fontWeight: 700, lineHeight: 1.4, flex: 1 }}>
                          {course.title}
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                            <span>Progress</span><span style={{ fontWeight: 600 }}>{course.progress}%</span>
                          </div>
                          <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${course.progress}%` }} /></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Jadwal Live */}
          {data?.upcomingLive && data.upcomingLive.length > 0 && (
            <section>
              <SectionHeader title="Jadwal Live Terdekat" />
              <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {data.upcomingLive.map((live) => {
                  const isSoon = new Date(live.scheduledAt).getTime() - Date.now() < 15 * 60 * 1000
                  return (
                    <div key={live.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{formatDate(live.scheduledAt, true)}</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }} className="line-clamp-1">{live.title}</div>
                      </div>
                      <a href={live.liveUrl} target="_blank" rel="noopener noreferrer"
                        className={`btn btn-sm ${isSoon ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flexShrink: 0, opacity: isSoon ? 1 : 0.5, pointerEvents: isSoon ? 'auto' : 'none' }}>
                        Masuk
                      </a>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* Misi Hari Ini */}
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Misi Hari Ini</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {!user?.photoUrl && (
                <MissionItem title="Pasang Foto Profil" xp={20} done={false} link={ROUTES.SETTINGS} />
              )}
              <MissionItem title="Tonton 1 materi video" xp={5}  done={false} />
              <MissionItem title="Kerjakan 1 challenge"  xp={10} done={false} />
            </div>
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Selesaikan semua misi</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Bonus 15 XP</span>
            </div>
          </div>

          {/* Rekomendasi */}
          {data?.recommendations && data.recommendations.length > 0 && (
            <div>
              <SectionHeader title="Rekomendasi" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {data.recommendations.slice(0, 3).map((rec) => (
                  <Link key={rec.id} href={rec.type === 'bootcamp' ? ROUTES.BOOTCAMP_DETAIL(rec.id) : ROUTES.COURSE_DETAIL(rec.id)} style={{ textDecoration: 'none' }}>
                    <div className="card card-hover" style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3)', alignItems: 'center' }}>
                      <div style={{ width: 52, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {rec.thumbnail
                          ? <img src={rec.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <PlaySquare size={16} color="var(--color-primary)" style={{ opacity: 0.4 }} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="line-clamp-2" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, lineHeight: 1.4 }}>{rec.title}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 700, marginTop: 2 }}>{formatRupiah(rec.price)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Discord */}
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Komunitas</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
              Bergabung di Discord eksklusif Metro Institute.
            </p>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <MessageCircle size={16} /> Gabung Discord
            </a>
          </div>

        </div>
      </div>

    </div>
  )
}

// ── Helper Components ────────────────────────────────────────

function MissionItem({ title, xp, done, link }: { title: string; xp: number; done: boolean; link?: string }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '8px 0' }}>
      {done
        ? <CheckCircle2 size={18} color="var(--color-primary)" />
        : <Circle size={18} color="var(--color-border)" />
      }
      <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: done ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
        {title}
      </span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-xp)', background: 'var(--color-xp-bg)', padding: '2px 7px', borderRadius: 'var(--radius-sm)' }}>
        +{xp} XP
      </span>
    </div>
  )
  if (link) return <Link href={link} style={{ textDecoration: 'none' }}>{content}</Link>
  return content
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
      <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>{title}</h2>
      {href && (
        <Link href={href} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
          Lihat semua <ArrowRight size={13} />
        </Link>
      )}
    </div>
  )
}

function BasecampSkeleton() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div className="skeleton" style={{ height: 60, borderRadius: 12, width: 300 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="skeleton" style={{ height: 180, width: 260, borderRadius: 12, flexShrink: 0 }} />
            <div className="skeleton" style={{ height: 180, width: 260, borderRadius: 12, flexShrink: 0 }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="skeleton" style={{ height: 180, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  )
}
