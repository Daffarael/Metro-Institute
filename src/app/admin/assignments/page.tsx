'use client'
// src/app/admin/assignments/page.tsx
// Penilaian Tugas PROJECT (ChallengeAttempt type=PROJECT yang belum dinilai)
// Sesuai concept doc Section 7 + system_flow.md "Admin nilai → score > 0 → trigger XP ASSIGNMENT_GRADED"
// Flow: ChallengeAttempt.type=PROJECT, status=SUBMITTED → admin beri score → GRADED

import {  useState , useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Star, Eye, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────
interface Assignment {
  id: string; score?: number; feedback?: string; status: string
  submittedAt: string; gradedAt?: string
  submissionUrl?: string; submissionText?: string
  user: { id: string; name: string; email: string }
  challenge: { id: string; title: string; field: string; maxScore: number }
}
interface Filters { status?: string; field?: string; search?: string; page: number; limit: number }

const FIELD_LABELS: Record<string, string> = { UI_UX: 'UI/UX', FRONTEND: 'Frontend', BACKEND: 'Backend', MOBILE: 'Mobile' }
const FIELD_OPTS = ['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'] as const

// ─── Grade Modal ───────────────────────────────────────────
function GradeModal({ attempt, onClose }: { attempt: Assignment; onClose: () => void }) {
  const qc = useQueryClient()
  const [score, setScore]       = useState(attempt.score ?? 0)
  const [feedback, setFeedback] = useState(attempt.feedback ?? '')

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/admin/assignments/${attempt.id}/grade`, { score, feedback }).then(r => r.data),
    onSuccess: () => {
      toast.success('Penilaian berhasil disimpan. XP diberikan otomatis.')
      qc.invalidateQueries({ queryKey: ['admin', 'assignments'], placeholderData: keepPreviousData, })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan.'),
  })

  const maxScore = attempt.challenge.maxScore
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
       style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
       style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Nilai Tugas</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>{attempt.challenge.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}><X size={20} /></button>
        </div>

        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Mentee info */}
          <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <div style={{ fontWeight: 600 }}>{attempt.user.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>{attempt.user.email}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 4 }}>Dikumpulkan: {formatDate(attempt.submittedAt)}</div>
          </div>

          {/* Submission */}
          {attempt.submissionUrl && (
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Link Submission</label>
              <a href={attempt.submissionUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Eye size={14} /> Buka Submission
              </a>
            </div>
          )}
          {attempt.submissionText && (
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Teks Submission</label>
              <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto', border: '1px solid var(--color-border)' }}>
                {attempt.submissionText}
              </div>
            </div>
          )}

          {/* Score slider */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Skor: <span style={{ color: 'var(--color-primary)', fontSize: 'var(--text-xl)' }}>{score}</span>
              <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}> / {maxScore}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginLeft: 8 }}>({pct}%)</span>
            </label>
            <input
              type="range"
              min={0} max={maxScore} step={1}
              value={score}
              onChange={e => setScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {[0, 25, 50, 60, 70, 80, 90, 100].map(pctVal => {
                const val = Math.round((pctVal / 100) * maxScore)
                return (
                  <button key={pctVal} onClick={() => setScore(val)} style={{ flex: 1, padding: '4px 2px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${score === val ? 'var(--color-primary)' : 'var(--color-border)'}`, background: score === val ? 'var(--color-primary-light)' : 'transparent', color: score === val ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    {pctVal}%
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Catatan / Feedback <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>(opsional)</span></label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-surface)', outline: 'none', resize: 'vertical' }}
              placeholder="Berikan feedback konstruktif untuk mentee..."
            />
          </div>

          <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500 }}>
            Setelah dinilai, XP ASSIGNMENT_GRADED akan diberikan otomatis ke mentee.
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer' }}>Batal</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer', opacity: mutation.isPending ? 0.7 : 1 }}>
              <Check size={16} /> {mutation.isPending ? 'Menyimpan...' : 'Simpan Penilaian'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

let _cachedAssignments: Assignment[] = []
let _cachedPagination: any = null
let _assignmentHasLoaded = false

// ─── Page ──────────────────────────────────────────────────
export default function AdminAssignmentsPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 10 })
  const [search, setSearch] = useState('')
  const [gradeTarget, setGradeTarget] = useState<Assignment | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'assignments', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/assignments', { params: filters }).then(r => r.data.data),
    staleTime: 60 * 1000,
  })

  if (data?.items !== undefined) {
    _cachedAssignments = data.items
    _cachedPagination = data.pagination
    _assignmentHasLoaded = true
  }

  const items: Assignment[] = _cachedAssignments
  const pagination = _cachedPagination

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: search || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getEmptyMessage = () => {
    if (!filters.search && !filters.field && !filters.status) {
      return "Sistem belum mendeteksi adanya data Penilaian Tugas."
    }
    const parts = []
    if (filters.search) parts.push(`kata kunci "${filters.search}"`)
    if (filters.status) parts.push(`status "${filters.status === 'SUBMITTED' ? 'Belum Dinilai' : 'Sudah Dinilai'}"`)
    if (filters.field) parts.push(`bidang "${FIELD_LABELS[filters.field] ?? filters.field}"`)
    
    return `Sistem tidak menemukan Penilaian Tugas dengan kriteria: ${parts.join(', ')}.`
  }

  return (
    <div>
      <AdminPageHeader
        title="Penilaian Tugas"
        description="Nilai submission PROJECT dari mentee secara manual. Tugas QUIZ dinilai otomatis oleh sistem."
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama mentee atau judul challenge..."
          suppressHydrationWarning
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300 }}
        />
        <CleanCombobox
          value={filters.status ?? ''}
          onChange={val => setFilters(f => ({ ...f, status: val || undefined, page: 1 }))}
          placeholder="Semua Status"
          options={[
            { value: 'SUBMITTED', label: 'Belum Dinilai' },
            { value: 'GRADED', label: 'Sudah Dinilai' }
          ]}
          width={180}
        />
        <CleanCombobox
          value={filters.field ?? ''}
          onChange={val => setFilters(f => ({ ...f, field: val || undefined, page: 1 }))}
          placeholder="Semua Bidang"
          options={FIELD_OPTS.map(f => ({ value: f, label: FIELD_LABELS[f] }))}
          width={180}
        />
      </div>

      {/* Table */}
      <AnimatePresence mode="wait">
        {!_assignmentHasLoaded && isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <AdminTableSkeleton rows={8} cols={7} />
          </motion.div>
        ) : items.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ background: 'transparent' }}>
            <AdminEmptyState
              type={filters.search || filters.status || filters.field ? 'no-results' : 'empty'}
              message={getEmptyMessage()}
            />
          </motion.div>
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Mentee', 'Challenge', 'Bidang', 'Dikumpulkan', 'Skor', 'Status', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(a => (
                    <tr key={a.id}
                      style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 600 }}>{a.user.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{a.user.email}</div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{a.challenge.title}</div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{FIELD_LABELS[a.challenge.field] ?? a.challenge.field}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(a.submittedAt)}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                        {a.score != null ? (
                          <span style={{ color: a.score / a.challenge.maxScore >= 0.6 ? 'var(--color-primary)' : 'var(--color-error)' }}>
                            {a.score} / {a.challenge.maxScore}
                          </span>
                        ) : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <AdminStatusChip status={a.status} />
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <button
                          onClick={() => setGradeTarget(a)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: `1px solid ${a.status === 'SUBMITTED' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: a.status === 'SUBMITTED' ? 'var(--color-primary-light)' : 'transparent', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: a.status === 'SUBMITTED' ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                        >
                          <Star size={12} /> {a.status === 'SUBMITTED' ? 'Nilai' : 'Edit Nilai'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && (
              <AdminPagination
                page={filters.page} totalPages={pagination.totalPages}
                limit={filters.limit} total={pagination.total}
                onPageChange={p => setFilters(f => ({ ...f, page: p }))}
                onLimitChange={l => setFilters(f => ({ ...f, limit: l, page: 1 }))}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {gradeTarget && <GradeModal attempt={gradeTarget} onClose={() => setGradeTarget(null)} />}
    </div>
  )
}
