'use client'
// src/app/admin/leads/page.tsx
// Daftar Lead Ebook + Export CSV
// Sesuai concept doc Section 11 + Prisma EbookLead model:
// id, name, email, phone, ebookTitle, createdAt

import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import { toast } from 'sonner'

interface EbookLead {
  id: string; name: string; email: string; phone?: string
  ebookTitle?: string; createdAt: string
}
interface Filters { search?: string; page: number; limit: number }

let _cachedLeads: EbookLead[] = []
let _cachedPagination: any = null
let _leadsHasLoaded = false

export default function AdminLeadsPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 25 })
  const [search, setSearch] = useState('')
  const [downloading, setDownloading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'leads', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/leads', { params: filters }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

  if (data?.items !== undefined) {
    _cachedLeads = data.items
    _cachedPagination = data.pagination
    _leadsHasLoaded = true
  }

  const items: EbookLead[] = _cachedLeads
  const pagination = _cachedPagination

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: search || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getEmptyMessage = () => {
    if (!filters.search) {
      return "Sistem belum mendeteksi adanya data Leads Ebook."
    }
    const parts = []
    if (filters.search) parts.push(`kata kunci "${filters.search}"`)
    
    return `Sistem tidak menemukan data Leads Ebook dengan kriteria: ${parts.join(', ')}.`
  }

  const exportCSV = async () => {
    setDownloading(true)
    try {
      const res = await api.get('/admin/leads/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `leads-ebook-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('CSV berhasil diunduh.')
    } catch {
      toast.error('Gagal mengunduh CSV.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Leads Ebook"
        description={`${pagination?.total ?? 0} leads terdaftar dari form e-book gratis.`}
        action={
          <button onClick={exportCSV} disabled={downloading} className="btn btn-secondary">
            <Download size={16} /> {downloading ? 'Mengunduh...' : 'Export CSV'}
          </button>
        }
      />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300 }}
        />
      </div>

      {/* Table */}
      <div style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait">
          {!_leadsHasLoaded && isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AdminTableSkeleton rows={10} cols={5} />
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AdminEmptyState type={filters.search ? 'no-results' : 'empty'} message={getEmptyMessage()} />
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  {['#', 'Nama', 'Email', 'No. HP', 'E-Book', 'Tanggal'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((lead, i) => (
                  <tr key={lead.id}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-tertiary)' }}>{(filters.page - 1) * filters.limit + i + 1}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>{lead.name}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      <a href={`mailto:${lead.email}`} style={{ color: 'var(--color-primary)' }}>{lead.email}</a>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{lead.phone ?? '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.ebookTitle ?? '—'}</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(lead.createdAt)}</td>
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
