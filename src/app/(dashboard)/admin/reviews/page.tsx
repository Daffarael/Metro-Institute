'use client'
// src/app/admin/reviews/page.tsx
// Moderasi Ulasan Mentee
// Sesuai concept doc Section 12 + Prisma Review model:
// id, rating, comment, isVisible, createdAt
// user: { name, email }
// product: { title } via bootcampId / courseId

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { toast } from 'sonner'

interface Review {
  id: string; rating: number; comment?: string; isVisible: boolean
  productType: string; createdAt: string
  user: { id: string; name: string; email: string }
  product: { id: string; title: string }
}
interface Filters { isVisible?: boolean | string; rating?: number; page: number; limit: number }

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: 14, color: s <= rating ? '#F59E0B' : 'var(--color-border)' }}>★</span>
      ))}
    </div>
  )
}

let _cachedReviews: Review[] = []
let _cachedPagination: any = null
let _reviewsHasLoaded = false

export default function AdminReviewsPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/reviews', { params: filters }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

  if (data?.items !== undefined) {
    _cachedReviews = data.items
    _cachedPagination = data.pagination
    _reviewsHasLoaded = true
  }

  const items: Review[] = _cachedReviews
  const pagination = _cachedPagination

  const getEmptyMessage = () => {
    if (filters.isVisible === undefined && filters.rating === undefined) {
      return "Sistem belum mendeteksi adanya data Ulasan Mentee."
    }
    const parts = []
    if (filters.isVisible !== undefined) parts.push(`status "${filters.isVisible ? 'Ditampilkan' : 'Disembunyikan'}"`)
    if (filters.rating !== undefined) parts.push(`bintang "${filters.rating}"`)
    
    return `Sistem tidak menemukan Ulasan Mentee dengan kriteria: ${parts.join(', ')}.`
  }

  const toggleVisibility = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      api.patch(`/admin/reviews/${id}/visibility`, { isVisible }),
    onSuccess: (_, vars) => {
      toast.success(vars.isVisible ? 'Ulasan ditampilkan.' : 'Ulasan disembunyikan.')
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'], placeholderData: keepPreviousData, })
    },
    onError: () => toast.error('Gagal mengubah status.'),
  })

  return (
    <div>
      <AdminPageHeader
        title="Ulasan Mentee"
        description="Moderasi ulasan yang diberikan mentee untuk Bootcamp dan Mini Course."
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <CleanCombobox
          value={filters.isVisible?.toString() ?? ''}
          onChange={val => setFilters(f => ({ ...f, isVisible: val === '' ? undefined : val === 'true', page: 1 }))}
          placeholder="Semua Status"
          options={[
            { value: 'true', label: 'Ditampilkan' },
            { value: 'false', label: 'Disembunyikan' }
          ]}
          width={180}
        />
        <CleanCombobox
          value={filters.rating?.toString() ?? ''}
          onChange={val => setFilters(f => ({ ...f, rating: val ? Number(val) : undefined, page: 1 }))}
          placeholder="Semua Bintang"
          options={[
            { value: '5', label: '★★★★★ (5)' },
            { value: '4', label: '★★★★ (4)' },
            { value: '3', label: '★★★ (3)' },
            { value: '2', label: '★★ (2)' },
            { value: '1', label: '★ (1)' }
          ]}
          width={180}
        />
      </div>

      {/* Table */}
      <div style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait">
          {!_reviewsHasLoaded && isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AdminTableSkeleton rows={10} cols={6} />
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AdminEmptyState type={filters.isVisible !== undefined || filters.rating !== undefined ? 'no-results' : 'empty'} message={getEmptyMessage()} />
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                      {['Mentee', 'Produk', 'Rating', 'Komentar', 'Tanggal', 'Visibilitas', 'Aksi'].map(h => (
                        <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.id}
                        style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ fontWeight: 600 }}>{r.user.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{r.user.email}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{r.product.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{r.productType === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <StarRating rating={r.rating} />
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>{r.rating}/5</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: 240 }}>
                          {r.comment ? (
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              "{r.comment}"
                            </div>
                          ) : <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontSize: '12px' }}>Tanpa komentar</span>}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 600, background: r.isVisible ? '#ECFDF5' : '#F3F4F6', color: r.isVisible ? 'var(--color-primary)' : '#6B7280' }}>
                            {r.isVisible ? 'Ditampilkan' : 'Disembunyikan'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <button
                            onClick={() => toggleVisibility.mutate({ id: r.id, isVisible: !r.isVisible })}
                            disabled={toggleVisibility.isPending}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer', opacity: toggleVisibility.isPending ? 0.6 : 1 }}
                          >
                            {r.isVisible ? <><EyeOff size={12} /> Sembunyikan</> : <><Eye size={12} /> Tampilkan</>}
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
      </div>
    </div>
  )
}
