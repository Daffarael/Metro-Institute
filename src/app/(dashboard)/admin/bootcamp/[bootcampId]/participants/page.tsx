'use client'
// src/app/admin/bootcamp/[bootcampId]/participants/page.tsx
// Monitoring peserta + penilaian PROJECT + tandai hadir manual
// Sesuai concept doc Section 4E + system_flow.md ChallengeAttempt PROJECT logic

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { UserX, CheckCircle, ExternalLink } from 'lucide-react'
import api from '@/lib/axios'
import { formatDate, FIELD_LABELS, BADGE_LABELS } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { toast } from 'sonner'

// ─── Types (sesuai Prisma Bootcamp Registration + User) ────
interface Participant {
  id: string // registration ID
  status: 'ACTIVE' | 'REMOVED'
  field: string
  progress: number
  attendanceCount: number
  createdAt: string
  user: {
    id: string; name: string; email: string
    badgeLevel: string; totalXp: number; photoUrl?: string
  }
}
interface Bootcamp { id: string; name: string }

interface Filters { field?: string; status?: string; page: number; limit: number }

// ─── Page ──────────────────────────────────────────────────
export default function BootcampParticipantsPage() {
  const params = useParams<{ bootcampId: string }>()
  const { bootcampId } = params
  const qc = useQueryClient()

  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 25 })
  const [removeTarget, setRemoveTarget] = useState<Participant | null>(null)

  const { data: bootcamp } = useQuery<Bootcamp>({
    queryKey: ['admin', 'bootcamp', bootcampId],
    queryFn: () => api.get(`/admin/bootcamps/${bootcampId}`).then(r => r.data.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'bootcamp', bootcampId, 'participants', filters],
    queryFn: () => api.get(`/bootcamp/${bootcampId}/participants`, { params: filters }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

  const participants: Participant[] = data?.items ?? []
  const pagination = data?.pagination

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      api.patch(`/bootcamp/${bootcampId}/participants/${userId}/remove`),
    onSuccess: () => {
      toast.success('Mentee berhasil dikeluarkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'participants'] })
      setRemoveTarget(null)
    },
    onError: () => toast.error('Gagal mengeluarkan mentee.'),
  })

  const FIELD_OPTS = ['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE']
  const BADGE_COLORS: Record<string, string> = {
    METRO_ROOKIE: '#6B7280', METRO_EXPLORER: '#3B82F6',
    METRO_ACHIEVER: '#8B5CF6', METRO_EXPERT: '#F59E0B', METRO_MASTER: '#018556',
  }

  return (
    <div>
      <AdminPageHeader
        title="Peserta Bootcamp"
        description={bootcamp?.title}
        breadcrumbs={[
          { label: 'Bootcamp', href: '/admin/bootcamp' },
          { label: bootcamp?.title ?? '...', href: '/admin/bootcamp' },
          { label: 'Peserta' },
        ]}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <CleanCombobox
          value={filters.field ?? ''}
          onChange={val => setFilters(f => ({ ...f, field: val || undefined, page: 1 }))}
          placeholder="Semua Bidang"
          options={FIELD_OPTS.map(f => ({ value: f, label: (FIELD_LABELS as any)?.[f] ?? f }))}
          width={180}
        />
        <CleanCombobox
          value={filters.status ?? ''}
          onChange={val => setFilters(f => ({ ...f, status: val || undefined, page: 1 }))}
          placeholder="Semua Status"
          options={[
            { value: 'ACTIVE', label: 'Aktif' },
            { value: 'REMOVED', label: 'Dikeluarkan' }
          ]}
          width={180}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <AdminTableSkeleton rows={10} cols={8} />
      ) : participants.length === 0 ? (
        <div className="card">
          <AdminEmptyState type="empty" message="Belum ada peserta terdaftar di bootcamp ini." />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  {['#', 'Mentee', 'Bidang', 'Progress', 'Hadir', 'Badge / XP', 'Status', 'Bergabung', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p, i) => (
                  <tr key={p.id}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-tertiary)' }}>
                      {(filters.page - 1) * filters.limit + i + 1}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--color-primary)', flexShrink: 0, overflow: 'hidden' }}>
                          {p.user.photoUrl ? <img src={p.user.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.user.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{p.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {(FIELD_LABELS as any)?.[p.field] ?? p.field}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ height: '100%', width: `${p.progress}%`, background: p.progress >= 100 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{p.progress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      {p.attendanceCount}x
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${BADGE_COLORS[p.user.badgeLevel] ?? '#6B7280'}18`, color: BADGE_COLORS[p.user.badgeLevel] ?? '#6B7280', fontSize: '11px', fontWeight: 600 }}>
                        {(BADGE_LABELS as any)?.[p.user.badgeLevel] ?? p.user.badgeLevel}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>{p.user.totalXp.toLocaleString()} XP</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <AdminStatusChip status={p.status} />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {formatDate(p.createdAt)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a href={`/admin/mentees/${p.user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', fontWeight: 500, textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                          <ExternalLink size={12} /> Profil
                        </a>
                        {p.status === 'ACTIVE' && (
                          <button
                            onClick={() => setRemoveTarget(p)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-error)', background: 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-error)' }}
                          >
                            <UserX size={12} /> Keluarkan
                          </button>
                        )}
                      </div>
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
        </div>
      )}

      {/* Remove confirm */}
      <AdminConfirmModal
        isOpen={removeTarget !== null}
        title="Keluarkan Mentee?"
        description={`${removeTarget?.user.name ?? 'Mentee'} akan dikeluarkan dari Bootcamp ini. Progress dan data pembelajaran tetap tersimpan, tapi akses dibatalkan.`}
        confirmText="KELUARKAN"
        confirmLabel="Ya, Keluarkan"
        isDangerous
        isLoading={removeMutation.isPending}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.user.id)}
        onClose={() => setRemoveTarget(null)}
      />
    </div>
  )
}
