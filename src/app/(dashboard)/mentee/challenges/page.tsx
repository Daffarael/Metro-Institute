'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'

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

  const { data: responseData, isLoading } = useQuery<ChallengesResponse>({
    queryKey: ['challenges', { field, level }],
    queryFn: () => api.get('/challenges', { params: { field, level } }).then((r) => r.data),
  })

  const hasAccess = responseData?.hasAccess ?? true
  const challenges = responseData?.data || []
  const enrolledFields = responseData?.enrolledFields || []
  const purchasedClasses = responseData?.purchasedClasses || []

  const dynamicFieldOptions = useMemo(() => {
    if (enrolledFields.length === 0) {
      return [{ value: '', label: 'Semua Bidang' }]
    }
    const options = [{ value: '', label: 'Semua Bidang Terdaftar' }]
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

  // ── 1. Locked State: Belum Beli Kelas ──────────────────────
  if (!isLoading && !hasAccess) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{
          padding: '40px 32px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '16px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>
            Akses Khusus Peserta Kelas
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
            Challenge Bank aktif otomatis setelah kamu terdaftar pada Bootcamp atau Mini Course Metro Institute.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href={ROUTES.BOOTCAMP_LIST} style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '9px 18px', borderRadius: '8px',
                background: 'var(--color-primary, #018556)', color: '#fff',
                border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              }}>
                Lihat Bootcamp
              </button>
            </Link>
            <Link href={ROUTES.COURSE_LIST} style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '9px 18px', borderRadius: '8px',
                background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              }}>
                Lihat Mini Course
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── 2. Active State: Ultra Clean & Minimalis ───────────────
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Challenge Bank
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', margin: 0 }}>
          Uji pemahamanmu dengan tantangan yang selaras dengan kelas yang kamu ikuti. Dapatkan XP pada kelulusan pertama dan latih kemampuanmu berulang kali tanpa batas.
        </p>

        {/* Clean Class Pills */}
        {purchasedClasses.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              Kelas Terdaftar:
            </span>
            {purchasedClasses.map((pc) => (
              <span
                key={pc.id}
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 9px',
                  borderRadius: 9999,
                  background: 'var(--color-bg)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {pc.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Clean Typography Stats (Tanpa icon-icon kotak) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        maxWidth: 720,
      }}>
        {[
          { label: 'Total Tantangan', value: totalCount },
          { label: 'Telah Diselesaikan', value: `${completedCount} / ${totalCount}` },
          { label: 'XP Tersedia', value: `${totalXpEarnable} XP` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '16px 20px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '12px',
            }}
          >
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--color-text-tertiary)',
              marginBottom: 6,
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <CleanCombobox
          options={dynamicFieldOptions}
          value={field}
          onChange={setField}
          placeholder="Semua Bidang Terdaftar"
          width={220}
        />

        <CleanCombobox
          options={levelOptions}
          value={level}
          onChange={setLevel}
          placeholder="Semua Level"
          width={180}
        />
      </div>

      {/* Content Area */}
      {isLoading && challenges.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '20px',
                height: 150,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--color-border-subtle)',
                background: 'var(--color-surface)',
                borderRadius: '12px',
              }}
            >
              <div className="skeleton" style={{ width: '35%', height: 11, borderRadius: 3, marginBottom: 14 }} />
              <div className="skeleton" style={{ width: '80%', height: 15, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '55%', height: 13, borderRadius: 4, marginBottom: 'auto' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <div className="skeleton" style={{ width: 45, height: 13, borderRadius: 3 }} />
                <div className="skeleton" style={{ width: 50, height: 13, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        /* Clean Minimalist Empty State (Tanpa icon kotak) */
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          background: 'var(--color-surface)',
          borderRadius: '14px',
          border: '1px dashed var(--color-border-subtle)',
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 6px 0',
            letterSpacing: '-0.01em',
          }}>
            {field || level ? 'Tidak ada tantangan yang sesuai filter' : 'Belum ada tantangan tersedia'}
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            maxWidth: 420,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            {field || level
              ? 'Silakan reset atau ubah pilihan filter untuk melihat tantangan lainnya.'
              : enrolledFields.length > 0
                ? `Tantangan untuk kelasmu (${enrolledFields.map((f) => FIELD_LABELS[f] || f).join(', ')}) akan segera dirilis oleh instruktur.`
                : 'Tantangan latihan akan muncul di sini setelah kelasmu aktif.'}
          </p>

          {(field || level) && (
            <div style={{ marginTop: 18 }}>
              <button
                onClick={() => { setField(''); setLevel('') }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-primary, #018556)',
                  border: '1px solid var(--color-primary, #018556)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Challenge Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
          {challenges.map((challenge) => {
            const locked = !!challenge.cooldownHoursLeft && !challenge.isCompleted

            return (
              <Link
                key={challenge.id}
                href={locked ? '#' : ROUTES.CHALLENGE_DETAIL(challenge.id)}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '20px',
                    height: '100%',
                    opacity: locked ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '12px',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    cursor: locked ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={!locked ? (e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)'
                  } : undefined}
                  onMouseLeave={!locked ? (e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                    e.currentTarget.style.boxShadow = 'none'
                  } : undefined}
                >
                  {/* Category & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-tertiary)',
                    }}>
                      {FIELD_LABELS[challenge.field] || challenge.field} · {LEVEL_LABELS[challenge.level] || challenge.level}
                    </span>

                    {challenge.isCompleted && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--color-primary, #018556)',
                        background: 'rgba(1, 133, 86, 0.08)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}>
                        Selesai
                      </span>
                    )}

                    {locked && (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        {challenge.cooldownHoursLeft}j lagi
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    lineHeight: 1.45,
                    color: 'var(--color-text-primary)',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {challenge.title}
                  </h3>

                  {challenge.description && (
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                      margin: '0 0 14px 0',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {challenge.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: 12,
                    borderTop: '1px solid var(--color-border-subtle)',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {challenge.xpReward} XP
                    </span>

                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: challenge.isCompleted ? 'var(--color-text-secondary)' : 'var(--color-primary, #018556)',
                    }}>
                      {locked ? 'Terkunci' : challenge.isCompleted ? 'Ulangi Latihan' : 'Mulai Tantangan →'}
                    </span>
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
