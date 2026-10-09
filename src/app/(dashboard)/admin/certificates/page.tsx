'use client'
// src/app/admin/certificates/page.tsx
// Monitor Sertifikat yang telah diterbitkan
// Sesuai concept doc Section 14 + system_flow.md Certificate trigger:
// Bootcamp: progress>=100 + score>=70 + attendance>=80%
// Mini Course: progress>=100
// Certificate fields: id, credentialId, productType, issuedAt, userId, bootcampId?, courseId?

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Download, Award } from 'lucide-react'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

let _cachedCertificates: Certificate[] = []
let _cachedPagination: any = null
let _certificatesHasLoaded = false

interface Certificate {
  id: string; credentialId: string; productType: string; issuedAt: string
  user: { id: string; name: string; email: string }
  product: { id: string; title: string }
}
interface Filters { productType?: string; page: number; limit: number }

export default function AdminCertificatesPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 })
  const [previewId, setPreviewId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'certificates', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/certificates', { params: filters }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  if (data !== undefined) {
    _cachedCertificates = data.items || []
    _cachedPagination = data.pagination
    _certificatesHasLoaded = true
  }

  const items = _cachedCertificates
  const pagination = _cachedPagination

  const getEmptyMessage = () => {
    if (!filters.productType) {
      return "Sistem belum mendeteksi adanya data Sertifikat yang diterbitkan."
    }
    
    return `Sistem tidak menemukan Sertifikat dengan kriteria: tipe "${filters.productType === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'}".`
  }



  return (
    <div>
      <AdminPageHeader
        title="Sertifikat"
        description="Monitor sertifikat yang diterbitkan otomatis oleh sistem."
        action={
          <button
            onClick={() => window.location.href = '/admin/certificates/templates'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
          >
            <Award size={15} /> Kelola Template
          </button>
        }
      />


      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <CleanCombobox
          value={filters.productType ?? ''}
          onChange={(val) => setFilters(f => ({ ...f, productType: val || undefined, page: 1 }))}
          placeholder="Semua Tipe"
          options={[
            { value: 'BOOTCAMP', label: 'Bootcamp' },
            { value: 'MINI_COURSE', label: 'Mini Course' }
          ]}
          width={180}
        />
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Total Sertifikat', value: (pagination?.total ?? 0).toLocaleString() },
          { label: 'Sertifikat Bootcamp', value: items.filter(c => c.productType === 'BOOTCAMP').length },
          { label: 'Sertifikat Mini Course', value: items.filter(c => c.productType === 'MINI_COURSE').length },
        ].map(s => (
          <div key={s.label} style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <AnimatePresence mode="wait">
        {!_certificatesHasLoaded && isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <AdminTableSkeleton rows={10} cols={6} />
          </motion.div>
        ) : items.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ background: 'transparent' }}>
            <AdminEmptyState 
              type={filters.productType ? 'no-results' : 'empty'} 
              message={getEmptyMessage()} 
            />
          </motion.div>
        ) : (
          <motion.div key="content" className="card" style={{ overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Credential ID', 'Mentee', 'Produk', 'Tipe', 'Diterbitkan', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(cert => (
                  <tr key={cert.id}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {cert.credentialId}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 600 }}>{cert.user.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{cert.user.email}</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{cert.product.title}</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <AdminStatusChip status={cert.productType} label={cert.productType === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'} />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {formatDate(cert.issuedAt)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <button
                        onClick={() => setPreviewId(cert.credentialId)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        <Download size={12} /> Unduh
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

      <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent style={{ maxWidth: '900px', width: '100%', height: '85vh', padding: 0, overflow: 'hidden' }}>
          {previewId && (
            <iframe 
              src={`/certificate/${previewId}?modal=true`} 
              style={{ width: '100%', height: '100%', border: 'none' }} 
              title="Certificate Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
