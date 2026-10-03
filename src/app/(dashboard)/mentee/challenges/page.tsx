'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Trophy, Lock, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

interface Challenge {
  id: string; title: string; type: 'QUIZ' | 'PROJECT'
  field: string; level: string; xpReward: number
  tags: string[]; isCompleted: boolean; canRetryAt?: string
  cooldownHoursLeft?: number
}

const LEVEL_ORDER = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED']

const FIELD_OPTIONS = [
  { value: '', label: 'Semua Bidang' },
  { value: 'UI_UX',    label: FIELD_LABELS['UI_UX'] },
  { value: 'FRONTEND', label: FIELD_LABELS['FRONTEND'] },
  { value: 'BACKEND',  label: FIELD_LABELS['BACKEND'] },
  { value: 'MOBILE',   label: FIELD_LABELS['MOBILE'] },
]

const LEVEL_OPTIONS = [
  { value: '', label: 'Semua Level' },
  ...LEVEL_ORDER.map(l => ({ value: l, label: LEVEL_LABELS[l] }))
]

export default function ChallengeBankPage() {
  const { user } = useAuthStore()
  const [field, setField] = useState('')
  const [level, setLevel] = useState('')

  const { data: challenges = [], isLoading, refetch } = useQuery<Challenge[]>({
    queryKey: ['challenges', { field, level }],
    queryFn: () => api.get('/challenges', { params: { field, level } }).then((r) => r.data.data),
  })

  const completed = challenges.filter((c) => c.isCompleted).length
  const total = challenges.length
  const totalXpEarnable = challenges.filter((c) => !c.isCompleted).reduce((a, c) => a + c.xpReward, 0)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Challenge Bank
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '15px' }}>
          Uji pemahamanmu dan kumpulkan XP dari setiap tantangan yang berhasil diselesaikan.
        </p>
      </div>

      {/* Stats row - Cleaner Design */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {[
          { label: 'Total Challenge', value: total },
          { label: 'Diselesaikan', value: `${completed}/${total}` },
          { label: 'XP Tersisa', value: totalXpEarnable },
        ].map((stat) => (
          <div key={stat.label} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 8 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
        <CleanCombobox
          options={FIELD_OPTIONS}
          value={field}
          onChange={setField}
          placeholder="Semua Bidang"
          width={180}
        />

        <CleanCombobox
          options={LEVEL_OPTIONS}
          value={level}
          onChange={setLevel}
          placeholder="Semua Level"
          width={180}
        />
      </div>

      {/* Result count */}
      {!isLoading && challenges.length > 0 && (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 500, marginBottom: 'var(--space-5)' }}>
          Menampilkan {challenges.length} challenge
        </div>
      )}

      {/* Challenge Grid */}
      {isLoading && challenges.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: 'var(--space-5)', height: 160, display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                 <div className="skeleton" style={{ width: 40, height: 12, borderRadius: 2 }} />
                 <span style={{ fontSize: '14px', color: 'var(--color-border)', lineHeight: 0 }}>•</span>
                 <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 2 }} />
                 <span style={{ fontSize: '14px', color: 'var(--color-border)', lineHeight: 0 }}>•</span>
                 <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 2 }} />
              </div>
              <div className="skeleton" style={{ width: '80%', height: 16, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '50%', height: 16, borderRadius: 4, marginBottom: 'auto' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
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
            message="Ubah filter atau cek kembali nanti."
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)', opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.25s ease' }} className="stagger-children">
          {challenges.map((challenge) => {
            const locked = !!challenge.cooldownHoursLeft
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
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-surface)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
                  {/* Completed overlay */}
                  {challenge.isCompleted && !locked && (
                    <div style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)' }}>
                      <CheckCircle2 size={20} color="var(--color-primary)" />
                    </div>
                  )}

                  {/* Cooldown overlay */}
                  {locked && (
                    <div style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Lock size={14} color="var(--color-text-tertiary)" />
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        {challenge.cooldownHoursLeft}j lagi
                      </span>
                    </div>
                  )}

                  {/* Meta: Type · Field · Level */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '12px', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0 }}>
                      {challenge.type === 'QUIZ' ? 'Quiz' : 'Project'}
                    </span>
                    <span style={{ color: 'var(--color-border)', flexShrink: 0 }}>•</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {FIELD_LABELS[challenge.field]}
                    </span>
                    <span style={{ color: 'var(--color-border)', flexShrink: 0 }}>•</span>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                      {LEVEL_LABELS[challenge.level]}
                    </span>
                  </div>

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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-xp)' }}>
                        {challenge.xpReward} XP
                      </span>
                    </div>
                    {locked ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                        <RefreshCw size={12} /> Cooldown
                      </div>
                    ) : (
                      <ChevronRight size={16} color="var(--color-text-tertiary)" />
                    )}
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
