'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import Link from 'next/link'
import { 
  Trophy, Lock, CheckCircle2, ChevronRight, RefreshCw, 
  Sparkles, GraduationCap, BookOpen, ArrowRight, ShieldCheck, Zap
} from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

interface Challenge {
  id: string
  title: string
  description?: string
  type: 'QUIZ' | 'PROJECT'
  field: string
  level: string
  xpReward: number
  tags: string[]
  isCompleted: boolean
  xpClaimed?: boolean
  canRetryAt?: string
  cooldownHoursLeft?: number
}

interface PurchasedClass {
  id: string
  title: string
  type: 'BOOTCAMP' | 'MINI_COURSE'
  field: string
}

interface ChallengesResponse {
  hasAccess: boolean
  message?: string
  enrolledFields?: string[]
  purchasedClasses?: PurchasedClass[]
  data: Challenge[]
}

const LEVEL_ORDER = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED']

export default function ChallengeBankPage() {
  const { user } = useAuthStore()
  const [field, setField] = useState('')
  const [level, setLevel] = useState('')

  const { data: responseData, isLoading, refetch } = useQuery<ChallengesResponse>({
    queryKey: ['challenges', { field, level }],
    queryFn: () => api.get('/challenges', { params: { field, level } }).then((r) => r.data),
  })

  const hasAccess = responseData?.hasAccess ?? true
  const challenges = responseData?.data || []
  const enrolledFields = responseData?.enrolledFields || []
  const purchasedClasses = responseData?.purchasedClasses || []

  // Dynamic field filter options based on what the mentee has actually purchased
  const dynamicFieldOptions = useMemo(() => {
    if (enrolledFields.length === 0) {
      return [{ value: '', label: 'Semua Bidang' }]
    }
    const options = [{ value: '', label: 'Semua Kelas Saya' }]
    enrolledFields.forEach((f) => {
      options.push({
        value: f,
        label: FIELD_LABELS[f] || f,
      })
    })
    return options
  }, [enrolledFields])

  const levelOptions = useMemo(() => [
    { value: '', label: 'Semua Level' },
    ...LEVEL_ORDER.map((l) => ({ value: l, label: LEVEL_LABELS[l] || l }))
  ], [])

  const completedCount = challenges.filter((c) => c.isCompleted).length
  const totalCount = challenges.length
  const totalXpEarnable = challenges.filter((c) => !c.isCompleted).reduce((a, c) => a + c.xpReward, 0)
  const totalXpClaimed = challenges.filter((c) => c.isCompleted).reduce((a, c) => a + c.xpReward, 0)

  // ─────────────────────────────────────────────────────────────
  // 1. LOCKED STATE: Mentee belum membeli kelas sama sekali
  // ─────────────────────────────────────────────────────────────
  if (!isLoading && !hasAccess) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 880, margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(234, 88, 12, 0.1)', color: '#EA580C', fontSize: '12px', fontWeight: 700, marginBottom: 12 }}>
            <Lock size={13} /> Fitur Eksklusif Mentee
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Metro Challenge Bank
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', maxWidth: 640, lineHeight: 1.6 }}>
            Kumpulan soal latihan teknis dan studi kasus interaktif untuk mengasah kompetensi nyata serta mengumpulkan poin Metro XP.
          </p>
        </div>

        {/* Hero Locked Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '24px',
          padding: '36px 32px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
          marginBottom: 'var(--space-8)',
        }}>
          {/* Subtle decoration */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 120, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={22} color="#FBBF24" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Akses Terbuka Setelah Membeli Kelas
                </h2>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                  Challenge Bank diselaraskan langsung dengan kurikulum kelas yang kamu ambil.
                </p>
              </div>
            </div>

            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#CBD5E1', maxWidth: 660, marginBottom: 24 }}>
              Untuk menjaga kualitas belajar yang terstruktur, soal-soal latihan teknis di Challenge Bank hanya terbuka bagi mentee yang telah terdaftar di program <strong>Bootcamp</strong> atau <strong>Mini Course</strong>. Setelah membeli kelas, bank soal di bidang terkait akan otomatis muncul di sini!
            </p>

            {/* Feature highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '13px', color: '#F1F5F9', marginBottom: 6 }}>
                  <ShieldCheck size={16} color="#38BDF8" /> Selaras Materi Kelas
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
                  Tantangan langsung menguji pemahaman dari modul Bootcamp atau Mini Course yang kamu pelajari.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '13px', color: '#F1F5F9', marginBottom: 6 }}>
                  <Trophy size={16} color="#FBBF24" /> Hadiah XP & Badge
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
                  Raih poin Metro XP untuk setiap kelulusan pertama guna menaikkan rank & level badge profilmu.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '13px', color: '#F1F5F9', marginBottom: 6 }}>
                  <RefreshCw size={16} color="#34D399" /> Latihan Berulang Kali
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
                  Bisa diulang kapan saja tanpa batas untuk memperdalam keahlian teknismu sebelum ujian akhir.
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={ROUTES.BOOTCAMP_LIST} style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 22px', borderRadius: '12px',
                    background: 'var(--color-primary, #2563EB)', color: '#ffffff',
                    border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  }}
                >
                  <GraduationCap size={18} /> Jelajahi Bootcamp <ArrowRight size={16} />
                </motion.button>
              </Link>

              <Link href={ROUTES.COURSE_LIST} style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 22px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.1)', color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <BookOpen size={18} /> Jelajahi Mini Course <ArrowRight size={16} />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ACTIVE STATE: Mentee memiliki kelas aktif yang dibeli
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Challenge Bank
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Uji pemahamanmu dengan tantangan yang selaras dengan kelas yang kamu ambil. Raih XP pada kelulusan pertama dan latih kemampuanmu berulang kali!
        </p>
      </div>

      {/* Info Kelas Terdaftar Mentee */}
      {purchasedClasses.length > 0 && (
        <div style={{
          padding: '12px 18px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Kelas Terdaftar:
            </span>
            {purchasedClasses.map((pc) => (
              <span
                key={pc.id}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(37, 99, 235, 0.08)',
                  color: 'var(--color-primary, #2563EB)',
                  fontSize: '12px', fontWeight: 600,
                }}
              >
                {pc.type === 'BOOTCAMP' ? '🎓' : '⚡'} {pc.title} ({FIELD_LABELS[pc.field] || pc.field})
              </span>
            ))}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={13} color="#F59E0B" /> XP hanya didapat 1x per challenge
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total Tantangan', value: totalCount, icon: BookOpen, color: 'var(--color-text-primary)' },
          { label: 'Diselesaikan', value: `${completedCount} / ${totalCount}`, icon: CheckCircle2, color: 'var(--color-primary)' },
          { label: 'XP Diklaim', value: `+${totalXpClaimed} XP`, icon: Trophy, color: 'var(--color-xp)' },
          { label: 'XP Tersisa', value: `${totalXpEarnable} XP`, icon: Zap, color: 'var(--color-text-secondary)' },
        ].map((stat) => (
          <div key={stat.label} style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'center' }}>
        <CleanCombobox
          options={dynamicFieldOptions}
          value={field}
          onChange={setField}
          placeholder="Semua Kelas Saya"
          width={200}
        />

        <CleanCombobox
          options={levelOptions}
          value={level}
          onChange={setLevel}
          placeholder="Semua Level"
          width={180}
        />
      </div>

      {/* Result count */}
      {!isLoading && challenges.length > 0 && (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 500, marginBottom: 'var(--space-4)' }}>
          Menampilkan {challenges.length} challenge sesuai kelas yang kamu ikuti
        </div>
      )}

      {/* Challenge Grid */}
      {isLoading && challenges.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: 'var(--space-5)', height: 180, display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
              <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 2, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '80%', height: 16, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '50%', height: 16, borderRadius: 4, marginBottom: 'auto' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <div className="skeleton" style={{ width: 60, height: 14, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
          <AdminEmptyState
            type={field || level ? 'no-results' : 'empty'}
            message={
              field || level 
                ? 'Tidak ada challenge dengan filter yang dipilih.'
                : 'Belum ada challenge yang ditambahkan untuk kelas ini. Cek kembali nanti!'
            }
            action={
              (field || level) ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                  onClick={() => { setField(''); setLevel('') }}
                >
                  Reset Filter
                </motion.button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)', opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.25s ease' }} className="stagger-children">
          {challenges.map((challenge) => {
            const locked = !!challenge.cooldownHoursLeft && !challenge.isCompleted

            return (
              <Link
                key={challenge.id}
                href={locked ? '#' : ROUTES.CHALLENGE_DETAIL(challenge.id)}
                style={{ textDecoration: 'none' }}
                className="animate-fade-in-up"
              >
                <div
                  style={{
                    padding: 'var(--space-5)', height: '100%',
                    opacity: locked ? 0.6 : 1,
                    position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    border: `1px solid ${challenge.isCompleted ? 'rgba(34, 197, 94, 0.3)' : 'var(--color-border-subtle)'}`,
                    borderRadius: 'var(--radius-lg)',
                    background: challenge.isCompleted ? 'rgba(34, 197, 94, 0.02)' : 'var(--color-surface)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  }}
                  onMouseEnter={!locked ? e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)'
                  } : undefined}
                  onMouseLeave={!locked ? e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  } : undefined}
                >
                  {/* Status Badge di kanan atas */}
                  {challenge.isCompleted && (
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34, 197, 94, 0.1)', color: '#16A34A', padding: '3px 8px', borderRadius: 12, fontSize: '11px', fontWeight: 700 }}>
                      <CheckCircle2 size={13} color="#16A34A" /> Selesai
                    </div>
                  )}

                  {locked && (
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', padding: '3px 8px', borderRadius: 12, fontSize: '11px', fontWeight: 600 }}>
                      <Lock size={12} color="#EF4444" /> {challenge.cooldownHoursLeft}j lagi
                    </div>
                  )}

                  {/* Meta: Type · Field · Level */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '11px', paddingRight: challenge.isCompleted || locked ? 80 : 0 }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                      {challenge.type === 'QUIZ' ? 'Quiz' : 'Project'}
                    </span>
                    <span style={{ color: 'var(--color-border)', lineHeight: 0 }}>•</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {FIELD_LABELS[challenge.field] || challenge.field}
                    </span>
                    <span style={{ color: 'var(--color-border)', lineHeight: 0 }}>•</span>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                      {LEVEL_LABELS[challenge.level] || challenge.level}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    lineHeight: 1.4,
                    color: 'var(--color-text-primary)',
                    margin: '0 0 16px 0',
                    letterSpacing: '-0.01em',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {challenge.title}
                  </h3>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--color-border-subtle)' }}>
                    <div>
                      {challenge.isCompleted ? (
                        <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> XP Diklaim ({challenge.xpReward} XP)
                        </span>
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-xp)' }}>
                          +{challenge.xpReward} XP
                        </span>
                      )}
                    </div>

                    <div>
                      {locked ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                          <RefreshCw size={12} /> Cooldown
                        </div>
                      ) : challenge.isCompleted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600 }}>
                          <RefreshCw size={12} /> Ulangi Latihan
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700 }}>
                          Mulai <ChevronRight size={14} />
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
