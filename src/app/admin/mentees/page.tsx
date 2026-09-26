'use client'

import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import api from '@/lib/axios'
import { formatDate, FIELD_LABELS, BADGE_LABELS } from '@/lib/utils'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import CleanCombobox from '@/components/admin/CleanCombobox'

import { motion, AnimatePresence } from 'motion/react'

interface Mentee {
  id: string; name: string; email: string; phone?: string
  photoUrl?: string; badgeLevel: string; totalXp: number
  selectedField?: string; currentStreak: number; isEmailVerified: boolean
  createdAt: string; totalEnrollments: number
}

interface Meta { total: number; page: number; limit: number }

// ── helpers ──────────────────────────────────────
function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  if (photoUrl) return (
    <img src={photoUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  )
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 700, color: 'var(--color-text-tertiary)',
      flexShrink: 0, userSelect: 'none',
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const TH_STYLE: React.CSSProperties = {
  padding: '11px 20px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  borderBottom: '1px solid var(--color-border-subtle)',
}

const TD_STYLE: React.CSSProperties = {
  padding: '14px 20px',
  verticalAlign: 'middle',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
}

let _cachedMentees: Mentee[] = []
let _cachedTotal = 0
let _menteesHasLoaded = false

// ── Page ──────────────────────────────────────────
export default function AdminMenteesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [field, setField]   = useState('')
  const [badge, setBadge]   = useState('')
  const [page, setPage]     = useState(1)
  const limit = 20

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getEmptyMessage = () => {
    if (!debouncedSearch && !field && !badge) {
      return "Sistem belum mendeteksi adanya data Mentee yang terdaftar."
    }
    const parts = []
    if (debouncedSearch) parts.push(`kata kunci "${debouncedSearch}"`)
    if (field) parts.push(`bidang "${FIELD_LABELS[field] ?? field}"`)
    if (badge) parts.push(`badge "${BADGE_LABELS[badge] ?? badge}"`)
    
    return `Sistem tidak menemukan data Mentee dengan kriteria: ${parts.join(', ')}.`
  }

  const { data, isLoading } = useQuery<{ data: Mentee[]; meta: Meta }>({
    queryKey: ['admin-mentees', debouncedSearch, field, badge, page],
    placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/mentees', {
      params: { search: debouncedSearch || undefined, field: field || undefined, badge: badge || undefined, page, limit },
    }).then((r) => r.data),
  })

  if (data?.data !== undefined) {
    _cachedMentees = data.data
    _cachedTotal = data.meta?.total || 0
    _menteesHasLoaded = true
  }

  const mentees    = _cachedMentees
  const total      = _cachedTotal
  const totalPages = Math.ceil(total / limit)

  const isFiltered = !!(debouncedSearch || field || badge)

  return (
    <div>
      <AdminPageHeader
        title="Manajemen Mentee"
        description={`${total.toLocaleString()} mentee terdaftar`}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama / email..."
          suppressHydrationWarning
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300 }}
        />
        <CleanCombobox
          value={field}
          onChange={(val) => { setField(val); setPage(1) }}
          placeholder="Semua Bidang"
          options={Object.entries(FIELD_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          width={180}
        />
        <CleanCombobox
          value={badge}
          onChange={(val) => { setBadge(val); setPage(1) }}
          placeholder="Semua Badge"
          options={Object.entries(BADGE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          width={180}
        />
      </div>

      {/* Table */}
      <AnimatePresence mode="wait">
        {!_menteesHasLoaded && isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AdminTableSkeleton rows={8} cols={7} />
            </motion.div>
          ) : mentees.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ background: 'transparent' }}>
              <AdminEmptyState 
                type={isFiltered ? 'no-results' : 'empty'} 
                message={getEmptyMessage()} 
              />
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Mentee</th>
                    <th style={TH_STYLE}>Bidang</th>
                    <th style={TH_STYLE}>Badge</th>
                    <th style={{ ...TH_STYLE, textAlign: 'center' }}>XP</th>
                    <th style={{ ...TH_STYLE, textAlign: 'center' }}>Enrollment</th>
                    <th style={{ ...TH_STYLE, textAlign: 'center' }}>Streak</th>
                    <th style={TH_STYLE}>Bergabung</th>
                    <th style={TH_STYLE} />
                  </tr>
                </thead>
                <tbody>
                  {mentees.map((m) => (
                    <tr
                      key={m.id}
                      style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Name + email */}
                      <td style={TD_STYLE}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={m.name} photoUrl={m.photoUrl} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{m.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: 2 }}>{m.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Field */}
                      <td style={TD_STYLE}>
                        {m.selectedField ? FIELD_LABELS[m.selectedField] || m.selectedField : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}
                      </td>

                      {/* Badge */}
                      <td style={TD_STYLE}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '12px', fontWeight: 500,
                          color: 'var(--color-text-primary)',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          padding: '3px 10px', borderRadius: '6px',
                          whiteSpace: 'nowrap',
                        }}>
                          {BADGE_LABELS[m.badgeLevel] || m.badgeLevel}
                        </span>
                      </td>

                      {/* XP */}
                      <td style={{ ...TD_STYLE, textAlign: 'center', fontWeight: 500 }}>
                        {m.totalXp.toLocaleString()}
                      </td>

                      {/* Enrollments */}
                      <td style={{ ...TD_STYLE, textAlign: 'center', fontWeight: 500 }}>
                        {m.totalEnrollments}
                      </td>

                      {/* Streak */}
                      <td style={{ ...TD_STYLE, textAlign: 'center' }}>
                        {m.currentStreak > 0
                          ? <span style={{ fontWeight: 600 }}>{m.currentStreak}d</span>
                          : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}
                      </td>

                      {/* Joined */}
                      <td style={{ ...TD_STYLE, fontSize: '12px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                        {formatDate(m.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ ...TD_STYLE, textAlign: 'right' }}>
                        <Link
                          href={`/admin/mentees/${m.id}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: '12px', fontWeight: 600,
                            color: 'var(--color-text-tertiary)',
                            padding: '5px 10px', borderRadius: '7px',
                            textDecoration: 'none', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-tertiary)' }}
                        >
                          <Eye size={13} /> Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              total={total}
              onPageChange={setPage}
              onLimitChange={() => {}}
            />
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}
