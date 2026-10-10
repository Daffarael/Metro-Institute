'use client'

import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { History, ChevronDown, Search } from 'lucide-react'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

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

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  SKILL_TEST_COMPLETE:   { label: 'Skill Test Selesai',  color: '#8B5CF6' },
  PROFILE_PHOTO_UPLOAD:  { label: 'Upload Foto Profil',  color: '#3B82F6' },
  VIDEO_COMPLETE:        { label: 'Video Selesai',        color: 'var(--color-primary)' },
  LIVE_ATTEND:           { label: 'Hadir Live Session',   color: '#3B82F6' },
  CHALLENGE_QUIZ_CORRECT:{ label: 'Challenge Benar',      color: '#F59E0B' },
  ASSIGNMENT_ON_TIME:    { label: 'Tugas Tepat Waktu',    color: 'var(--color-primary)' },
  ASSIGNMENT_GRADED:     { label: 'Tugas Dinilai',        color: '#6B7280' },
  STREAK_7:              { label: 'Streak 7 Hari!',       color: '#F59E0B' },
  STREAK_30:             { label: 'Streak 30 Hari!',      color: '#EF4444' },
  STREAK_100:            { label: 'Streak 100 Hari!',     color: '#8B5CF6' },
  MANUAL_GRANT:          { label: 'Bonus dari Admin',     color: '#6B7280' },
}

const SOURCE_OPTIONS = [
  { value: '', label: 'Semua Aktivitas' },
  ...Object.keys(SOURCE_LABELS).map(k => ({ value: k, label: SOURCE_LABELS[k].label }))
]

export default function XpActivityPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('')
  const limit = 20
  const [isFiltering, setIsFiltering] = useState(false)
  const [activeSearch, setActiveSearch] = useState('')
  const [activeSource, setActiveSource] = useState('')
  
  // Unified debounce like Kelas Saya
  useEffect(() => {
    setIsFiltering(true)
    const t = setTimeout(() => {
      setActiveSearch(search)
      setActiveSource(source)
      setPage(1)
      setIsFiltering(false)
    }, 400)
    return () => clearTimeout(t)
  }, [search, source])

  const { data, isLoading, isFetching } = useQuery<XpSummary>({
    queryKey: ['xp-logs', page, activeSearch, activeSource],
    queryFn: () =>
      api.get('/users/me/xp-logs', { 
        params: { page, limit, search: activeSearch || undefined, source: activeSource || undefined } 
      }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })

  const logs = data?.logs || []
  const totalPages = data?.meta ? Math.ceil(data.meta.total / limit) : 1
  const showSkeleton = isLoading && logs.length === 0
  const showEmpty = !showSkeleton && logs.length === 0
  const showList = !showSkeleton && logs.length > 0
  const isTransitioning = isFetching || isFiltering

  const getEmptyMessage = () => {
    if (!activeSearch && !activeSource) {
      return 'Mulai belajar, ikuti challenge, dan hadir live session untuk mendapatkan XP!'
    }
    const parts: string[] = []
    if (activeSearch) parts.push(`kata kunci "${activeSearch}"`)
    if (activeSource) parts.push(`aktivitas "${SOURCE_LABELS[activeSource]?.label || activeSource}"`)
    return `Tidak ada riwayat yang cocok dengan kriteria: ${parts.join(', ')}.`
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
        <div className="grid-cols-3" style={{ display: 'grid', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {[
            { label: 'Total XP',      value: data.totalXp,    color: 'var(--color-text-primary)' },
            { label: 'Bulan Ini',     value: data.thisMonth,  color: 'var(--color-text-primary)' },
            { label: 'Minggu Ini',    value: data.thisWeek,   color: 'var(--color-text-primary)' },
          ].map((s) => (
            <div key={s.label} className="card card-body-sm" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: s.color }}>
                {s.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Cari riwayat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            border: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            minWidth: 220,
            flex: 1,
            maxWidth: 320,
            boxSizing: 'border-box',
          }}
        />
        <CleanCombobox
          options={SOURCE_OPTIONS}
          value={source}
          onChange={setSource}
          placeholder="Semua Aktivitas"
          width={220}
        />
      </div>

      {/* Log list */}
      <div style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait">
          {showSkeleton ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />
                ))}
              </div>
            </motion.div>
          ) : showEmpty ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AdminEmptyState
                type={activeSearch || activeSource ? 'no-results' : 'empty'}
                message={getEmptyMessage()}
                action={
                  (activeSearch || activeSource) ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                      onClick={() => { setSearch(''); setSource('') }}
                    >
                      Reset Filter
                    </motion.button>
                  ) : undefined
                }
              />
            </motion.div>
          ) : showList ? (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="card" style={{ overflow: 'hidden', opacity: isTransitioning ? 0.5 : 1, transition: 'opacity 0.25s ease' }}>
                {logs.map((log, idx) => {
                  const cfg = SOURCE_LABELS[log.source] || { label: log.source, color: 'var(--color-text-secondary)' }
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                        padding: 'var(--space-4) var(--space-5)',
                        borderBottom: idx < logs.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                      }}
                    >
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
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

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
