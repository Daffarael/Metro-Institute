'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Crown, Medal, Flame, Zap, ChevronDown } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { BADGE_LABELS, FIELD_LABELS, getInitials } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  photoUrl?: string
  totalXp: number
  badgeLevel: string
  selectedField?: string
  currentStreak: number
}

interface LeaderboardData {
  entries: LeaderboardEntry[]
  myRank?: LeaderboardEntry
}

const RANK_STYLES: Record<number, { bg: string; color: string; icon: React.ReactNode }> = {
  1: { bg: '#FEF3C7', color: '#D97706', icon: <Crown size={16} color="#D97706" fill="#D97706" /> },
  2: { bg: '#F1F5F9', color: '#475569', icon: <Medal size={16} color="#475569" fill="#475569" /> },
  3: { bg: '#FEF2F2', color: '#B91C1C', icon: <Medal size={16} color="#B45309" fill="#B45309" /> },
}

const PERIOD_LABELS = { 'all-time': 'Sepanjang Waktu', monthly: 'Bulan Ini', weekly: 'Minggu Ini' }

export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const [period, setPeriod] = useState<'all-time' | 'monthly' | 'weekly'>('all-time')
  const [field, setField] = useState('')

  const { data, isLoading } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard', period, field],
    queryFn: () => api.get('/leaderboard', { params: { period, field } }).then((r) => r.data.data),
  })

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Leaderboard</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Bersaing dengan sesama mentee dan buktikan kemampuanmu.
        </p>
      </div>

      {/* Period Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
        <PeriodTabs period={period} setPeriod={setPeriod} />
      </div>

      {/* My rank (if not in top 50) */}
      {data?.myRank && !data.entries.find((e) => e.userId === user?.id) && (
        <div className="card card-body-sm" style={{
          marginBottom: 'var(--space-4)',
          border: '2px solid var(--color-primary)',
          background: 'var(--color-primary-xlight)',
        }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
            Posisimu Saat Ini
          </div>
          <LeaderboardRow entry={data.myRank} isMe />
        </div>
      )}

      {/* Main list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {data?.entries.map((entry, idx) => {
            const isMe = entry.userId === user?.id
            return (
              <div key={entry.userId} style={{ borderBottom: idx < (data.entries.length - 1) ? '1px solid var(--color-border-subtle)' : 'none' }}>
                <LeaderboardRow entry={entry} isMe={isMe} />
              </div>
            )
          })}
          {(!data?.entries || data.entries.length === 0) && (
            <div className="empty-state">
              <p className="empty-state-title">Belum ada data</p>
              <p className="empty-state-desc">Mulai belajar untuk masuk leaderboard!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe?: boolean }) {
  const rankStyle = RANK_STYLES[entry.rank]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
      padding: 'var(--space-4) var(--space-5)',
      background: isMe ? 'var(--color-primary-xlight)' : 'transparent',
      transition: 'background var(--transition-fast)',
    }}>
      {/* Rank */}
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: rankStyle?.bg || 'var(--color-border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontWeight: 800, fontSize: 'var(--text-sm)',
        color: rankStyle?.color || 'var(--color-text-secondary)',
      }}>
        {rankStyle?.icon || `#${entry.rank}`}
      </div>

      {/* Avatar */}
      <div className="avatar avatar-md">
        {entry.photoUrl ? <img src={entry.photoUrl} alt={entry.name} /> : getInitials(entry.name)}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }} className="truncate">{entry.name}</span>
          {isMe && <span className="badge badge-primary" style={{ fontSize: '10px', flexShrink: 0 }}>Saya</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 2 }}>
          <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 500 }}>
            {BADGE_LABELS[entry.badgeLevel]}
          </span>
          {entry.currentStreak > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '11px', color: 'var(--color-streak)' }}>
              <Flame size={11} /> {entry.currentStreak}d
            </span>
          )}
        </div>
      </div>

      {/* XP */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <Zap size={12} color="var(--color-xp)" />
          <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
            {entry.totalXp.toLocaleString()}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>XP</div>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'all-time', label: 'Sepanjang Waktu' },
  { key: 'monthly',  label: 'Bulan Ini' },
  { key: 'weekly',   label: 'Minggu Ini' },
] as const

function PeriodTabs({
  period,
  setPeriod,
}: {
  period: 'all-time' | 'monthly' | 'weekly'
  setPeriod: (p: 'all-time' | 'monthly' | 'weekly') => void
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pill, setPill] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.key === period)
    const el = btnRefs.current[idx]
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
  }, [period])

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 9999,
        padding: 4,
      }}
    >
      {/* Sliding pill background */}
      <motion.div
        animate={{ left: pill.left, width: pill.width }}
        transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-sm)',
          borderRadius: 9999,
          border: '1px solid var(--color-border)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {TABS.map((tab, i) => (
        <button
          key={tab.key}
          ref={(el) => { btnRefs.current[i] = el }}
          type="button"
          onClick={() => setPeriod(tab.key)}
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '8px 20px',
            border: 'none',
            background: 'transparent',
            borderRadius: 9999,
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontWeight: period === tab.key ? 600 : 500,
            color: period === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            transition: 'color 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
