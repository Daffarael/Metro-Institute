'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Trophy, Zap, Lock, CheckCircle2, ChevronRight, Filter, RefreshCw, ChevronDown } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'

interface Challenge {
  id: string; title: string; type: 'QUIZ' | 'PROJECT'
  field: string; level: string; xpReward: number
  tags: string[]; isCompleted: boolean; canRetryAt?: string
  cooldownHoursLeft?: number
}

const LEVEL_ORDER = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED']
const FIELD_ICONS: Record<string, string> = { UI_UX: '🎨', FRONTEND: '💻', BACKEND: '⚙️', MOBILE: '📱' }
const TYPE_ICONS: Record<string, string> = { QUIZ: '❓', PROJECT: '🛠️' }
const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: '#018556', ELEMENTARY: '#3B82F6',
  INTERMEDIATE: '#8B5CF6', ADVANCED: '#EF4444',
}

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
    <div style={{ maxWidth: 1100, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Challenge Bank
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
          Uji pemahamanmu dan kumpulkan XP dari setiap tantangan yang berhasil diselesaikan.
        </p>
      </div>

      {/* Stats row - Cleaner Design */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {[
          { label: 'Total Challenge', value: total, icon: <Trophy size={18} color="var(--color-text-primary)" /> },
          { label: 'Diselesaikan', value: `${completed}/${total}`, icon: <CheckCircle2 size={18} color="var(--color-primary)" /> },
          { label: 'XP Tersisa', value: `+${totalXpEarnable}`, icon: <Zap size={18} color="var(--color-xp)" /> },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Field filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="form-input"
            style={{ paddingRight: 'var(--space-8)', appearance: 'none', cursor: 'pointer', minWidth: 160 }}
          >
            <option value="">Semua Bidang</option>
            {['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'].map((f) => (
              <option key={f} value={f}>{FIELD_LABELS[f]}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
        </div>

        {/* Level filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="form-input"
            style={{ paddingRight: 'var(--space-8)', appearance: 'none', cursor: 'pointer', minWidth: 160 }}
          >
            <option value="">Semua Level</option>
            {LEVEL_ORDER.map((l) => (
              <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Result count */}
      {!isLoading && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
          Menampilkan <strong>{challenges.length}</strong> challenge
          {field && ` · ${FIELD_LABELS[field]}`}
          {level && ` · ${LEVEL_LABELS[level]}`}
        </p>
      )}

      {/* Challenge Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="empty-state">
          <Trophy className="empty-state-icon" />
          <p className="empty-state-title">Belum ada challenge</p>
          <p className="empty-state-desc">Ubah filter atau cek kembali nanti.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }} className="stagger-children">
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
                  className={`card ${!locked ? 'card-hover' : ''}`}
                  style={{
                    padding: 'var(--space-5)', height: '100%',
                    opacity: locked ? 0.6 : 1,
                    position: 'relative', overflow: 'hidden',
                  }}
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

                  {/* Type & Field */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    <span style={{ fontSize: 24 }}>{TYPE_ICONS[challenge.type]}</span>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                        {FIELD_ICONS[challenge.field]} {FIELD_LABELS[challenge.field]}
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: 700,
                        color: LEVEL_COLORS[challenge.level] || 'var(--color-text-secondary)',
                      }}>
                        {LEVEL_LABELS[challenge.level]}
                      </div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, lineHeight: 'var(--leading-snug)', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }} className="line-clamp-2">
                    {challenge.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <Zap size={12} color="var(--color-xp)" />
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-xp)' }}>
                        +{challenge.xpReward} XP
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

                  {/* Bottom accent */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                    background: challenge.isCompleted ? 'var(--color-primary)' : LEVEL_COLORS[challenge.level],
                    opacity: 0.5,
                  }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
