'use client'
// src/app/admin/mini-course/[courseId]/stats/page.tsx
// Statistik Mini Course + perpanjang akses mentee
// Sesuai concept doc Section 5D + design doc API: PATCH /mini-course/enrollments/:id/extend

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { CalendarPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import { formatDate, formatRupiah } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import { toast } from 'sonner'

interface CourseStats {
  course: {
    id: string; title: string; price: number; accessDays: number
    rating: number; totalDuration: number
  }
  totalEnrollments: number
  totalRevenue: number
  avgProgress: number
  completionRate: number
  enrollments: {
    id: string
    progress: number
    accessUntil: string
    purchasedAt: string
    user: { id: string; name: string; email: string }
  }[]
  pagination: { page: number; totalPages: number; total: number }
}

export default function MiniCourseStatsPage() {
  const params = useParams<{ courseId: string }>()
  const { courseId } = params
  const qc = useQueryClient()
  const [filters, setFilters] = useState<{ page: number; limit: number; search?: string }>({ page: 1, limit: 10 })
  const [search, setSearch] = useState('')
  const [extendModal, setExtendModal] = useState<{ enrollmentId: string; name: string } | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: search || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExtendModal(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { data, isLoading } = useQuery<CourseStats>({
    queryKey: ['admin', 'course', courseId, 'stats', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get(`/admin/courses/${courseId}/stats`, { params: filters }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const extendMutation = useMutation({
    mutationFn: ({ enrollmentId, days }: { enrollmentId: string; days: number }) =>
      api.patch(`/admin/courses/enrollments/${enrollmentId}/extend`, { days }),
    onSuccess: () => {
      toast.success('Akses berhasil diperpanjang.')
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId, 'stats']})
      setExtendModal(null)
    },
    onError: () => toast.error('Gagal memperpanjang akses.'),
  })

  if (isLoading && !data) return (
    <div>
      <AdminPageHeader title="Statistik Mini Course" breadcrumbs={[{ label: 'Mini Course', href: '/admin/mini-course' }, { label: '...' }]} />
      <AdminTableSkeleton rows={5} cols={5} />
    </div>
  )

  const { course, totalEnrollments, totalRevenue, avgProgress, completionRate, enrollments, pagination } = data!

  return (
    <div>
      <AdminPageHeader
        title={`Statistik — ${course.title}`}
        breadcrumbs={[
          { label: 'Mini Course', href: '/admin/mini-course' },
          { label: course.title, href: '/admin/mini-course' },
          { label: 'Statistik' },
        ]}
      />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total Siswa', value: totalEnrollments.toLocaleString() },
          { label: 'Total Revenue', value: formatRupiah(totalRevenue) },
          { label: 'Rata-rata Progress', value: `${avgProgress.toFixed(1)}%` },
          { label: 'Completion Rate', value: `${completionRate.toFixed(1)}%` },
        ].map(kpi => (
          <div key={kpi.label} className="card card-body-sm">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>{kpi.label}</div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau email siswa..."
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300 }}
        />
      </div>

      {/* Enrollments table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>Daftar Siswa</h2>
        </div>
        {enrollments.length === 0 ? (
          <AdminEmptyState type="empty" message={search ? "Silakan coba kata kunci atau filter lain." : "Belum ada siswa yang mendaftar."} />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Siswa', 'Progress', 'Akses Sampai', 'Beli Tanggal', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => {
                    const accessDate = new Date(e.accessUntil)
                    const isExpired = accessDate < new Date()
                    const isSoon = !isExpired && (accessDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000

                    return (
                      <tr key={e.id}
                        style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--color-bg)')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ fontWeight: 600 }}>{e.user.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{e.user.email}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ height: '100%', width: `${e.progress}%`, background: e.progress >= 100 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{e.progress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ fontWeight: 500, color: isExpired ? 'var(--color-error)' : isSoon ? 'var(--color-warning)' : 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                            {formatDate(e.accessUntil)}
                          </span>
                          {isExpired && <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-error)' }}>Sudah kadaluarsa</span>}
                          {isSoon && !isExpired && <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-warning)' }}>Segera kadaluarsa</span>}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '12px' }}>{formatDate(e.purchasedAt)}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <button
                            onClick={() => setExtendModal({ enrollmentId: e.id, name: e.user.name })}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                          >
                            <CalendarPlus size={12} /> Perpanjang
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={filters.page} totalPages={pagination.totalPages}
              limit={filters.limit} total={pagination.total}
              onPageChange={p => setFilters(f => ({ ...f, page: p }))}
              onLimitChange={l => setFilters(f => ({ ...f, limit: l, page: 1 }))}
            />
          </>
        )}
      </div>

      {/* Extend modal */}
      <AnimatePresence>
        {extendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setExtendModal(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
              style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 380, padding: 'var(--space-6)' }}
            >
              <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>Perpanjang Akses</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                Tambah hari akses untuk <strong>{extendModal.name}</strong>:
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-5)' }}>
                {[7, 14, 30, 60, 90].map(d => (
                  <button key={d} onClick={() => setDays(d)} style={{ flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${days === d ? 'var(--color-primary)' : 'var(--color-border)'}`, background: days === d ? 'var(--color-primary-light)' : 'transparent', color: days === d ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
                    +{d}h
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button onClick={() => setExtendModal(null)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Batal</button>
                <button onClick={() => extendMutation.mutate({ enrollmentId: extendModal.enrollmentId, days })} disabled={extendMutation.isPending} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)', opacity: extendMutation.isPending ? 0.7 : 1 }}>
                  {extendMutation.isPending ? 'Menyimpan...' : `Tambah ${days} Hari`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
