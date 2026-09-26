'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Zap, ChevronDown } from 'lucide-react'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'

interface XpLog {
  id: string
  source: string
  amount: number
  note?: string
  createdAt: string
}

interface XpSummary {
  totalXp: number
  thisMonth: number
  thisWeek: number
  logs: XpLog[]
  meta: { total: number; page: number; limit: number }
}

const SOURCE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  SKILL_TEST_COMPLETE:   { label: 'Skill Test Selesai',  emoji: '🎯', color: '#8B5CF6' },
  PROFILE_PHOTO_UPLOAD:  { label: 'Upload Foto Profil',  emoji: '📸', color: '#3B82F6' },
  VIDEO_COMPLETE:        { label: 'Video Selesai',        emoji: '🎬', color: 'var(--color-primary)' },
  LIVE_ATTEND:           { label: 'Hadir Live Session',   emoji: '📡', color: '#3B82F6' },
  CHALLENGE_QUIZ_CORRECT:{ label: 'Challenge Benar',      emoji: '⚡', color: '#F59E0B' },
  ASSIGNMENT_ON_TIME:    { label: 'Tugas Tepat Waktu',    emoji: '✅', color: 'var(--color-primary)' },
  ASSIGNMENT_GRADED:     { label: 'Tugas Dinilai',        emoji: '📝', color: '#6B7280' },
  STREAK_7:              { label: 'Streak 7 Hari!',       emoji: '🔥', color: '#F59E0B' },
  STREAK_30:             { label: 'Streak 30 Hari!',      emoji: '🔥', color: '#EF4444' },
  STREAK_100:            { label: 'Streak 100 Hari!',     emoji: '🏆', color: '#8B5CF6' },
  MANUAL_GRANT:          { label: 'Bonus dari Admin',     emoji: '🎁', color: '#6B7280' },
}

export default function XpActivityPage() {
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useQuery<XpSummary>({
    queryKey: ['xp-logs', page],
    queryFn: () =>
      api.get('/users/me/xp-logs', { params: { page, limit } }).then((r) => r.data.data),
    keepPreviousData: true,
  })

  const logs = data?.logs || []
  const totalPages = data?.meta ? Math.ceil(data.meta.total / limit) : 1

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Riwayat XP
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Semua aktivitas yang menghasilkan XP untukmu.
        </p>
      </div>

      {/* Summary cards */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {[
            { label: 'Total XP',      value: data.totalXp,    color: 'var(--color-xp)', emoji: '⚡' },
            { label: 'Bulan Ini',     value: data.thisMonth,  color: 'var(--color-primary)', emoji: '📅' },
            { label: 'Minggu Ini',    value: data.thisWeek,   color: '#3B82F6', emoji: '🗓️' },
          ].map((s) => (
            <div key={s.label} className="card card-body-sm" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--space-1)' }}>{s.emoji}</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: s.color }}>
                {s.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <Zap className="empty-state-icon" />
          <p className="empty-state-title">Belum ada aktivitas XP</p>
          <p className="empty-state-desc">Mulai belajar, ikuti challenge, dan hadir live session untuk mendapatkan XP!</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {logs.map((log, idx) => {
            const cfg = SOURCE_LABELS[log.source] || { label: log.source, emoji: '✨', color: 'var(--color-text-secondary)' }
            return (
              <div
                key={log.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-5)',
                  borderBottom: idx < logs.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `${cfg.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {cfg.emoji}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    {cfg.label}
                  </div>
                  {log.note && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }} className="line-clamp-1">
                      {log.note}
                    </div>
                  )}
                </div>

                {/* XP + date */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: cfg.color, fontSize: 'var(--text-sm)' }}>
                    +{log.amount} XP
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">←</button>
          <span style={{ alignSelf: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">→</button>
        </div>
      )}
    </div>
  )
}
