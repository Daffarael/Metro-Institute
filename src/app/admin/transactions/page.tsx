'use client'
// src/app/admin/transactions/page.tsx
// Manajemen Transaksi + Export CSV
// Sesuai concept doc Section 9 + Prisma Transaction model:
// id, orderId, title, amount, finalAmount, status, productType, createdAt, paidAt
// user: { name, email }

import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import { formatRupiah, formatDate } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { toast } from 'sonner'
import * as xlsx from 'xlsx'

interface Tx {
  id: string; orderId: string; title: string; amount: number; finalAmount: number
  status: string; productType: string; createdAt: string; paidAt?: string
  user: { name: string; email: string }
}
interface Filters { status?: string; productType?: string; search?: string; page: number; limit: number }

let _cachedTxs: Tx[] = []
let _cachedTotal = 0
let _txsHasLoaded = false

export default function AdminTransactionsPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 })
  const [search, setSearch] = useState('')
  const [downloading, setDownloading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'transactions', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/transactions', { params: filters }).then(r => r.data),
    staleTime: 60 * 1000,
  })

  if (data?.data !== undefined) {
    _cachedTxs = data.data
    _cachedTotal = data.meta?.total ?? 0
    _txsHasLoaded = true
  }

  // Auto-search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: search || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getEmptyMessage = () => {
    if (!filters.search && !filters.status && !filters.productType) {
      return "Sistem belum mendeteksi adanya data Transaksi."
    }
    const parts = []
    if (filters.search) parts.push(`kata kunci "${filters.search}"`)
    
    const statusLabels: Record<string, string> = {
      SUCCESS: 'Berhasil',
      PENDING: 'Menunggu',
      FAILED: 'Gagal',
      CANCELLED: 'Dibatalkan',
      REFUNDED: 'Refund'
    }
    if (filters.status) parts.push(`status "${statusLabels[filters.status] ?? filters.status}"`)
    
    const productLabels: Record<string, string> = {
      BOOTCAMP: 'Bootcamp',
      MINI_COURSE: 'Mini Course'
    }
    if (filters.productType) parts.push(`produk "${productLabels[filters.productType] ?? filters.productType}"`)
    
    return `Sistem tidak menemukan data Transaksi dengan kriteria: ${parts.join(', ')}.`
  }

  const txs: Tx[] = _cachedTxs
  const total = _cachedTotal
  const totalPages = Math.ceil(total / filters.limit)

  const isFiltered = !!(filters.search || filters.status || filters.productType)

  const exportExcel = async () => {
    setDownloading(true)
    try {
      const res = await api.get('/admin/transactions', { 
        params: { ...filters, limit: 100000, page: 1 } 
      })
      const data: Tx[] = res.data.data
      
      const rows = data.map(t => ({
        'Order ID': t.orderId,
        'Mentee': t.user.name,
        'Email': t.user.email,
        'Produk': t.title,
        'Tipe': t.productType,
        'Harga Awal': t.amount,
        'Harga Akhir': t.finalAmount,
        'Status': t.status,
        'Tanggal Transaksi': formatDate(t.createdAt),
        'Tanggal Pembayaran': t.paidAt ? formatDate(t.paidAt) : '-'
      }))
      
      const ws = xlsx.utils.json_to_sheet(rows)
      const wb = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(wb, ws, "Transaksi")
      xlsx.writeFile(wb, `Transaksi_Metro_Institute_${new Date().toISOString().slice(0,10)}.xlsx`)
      toast.success('File Excel berhasil diunduh.')
    } catch {
      toast.error('Gagal mengunduh Excel.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Manajemen Transaksi"
        description={`${total.toLocaleString()} total transaksi`}
        action={
          <button 
            suppressHydrationWarning
            onClick={exportExcel} 
            disabled={downloading} 
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
          >
            <Download size={15} /> {downloading ? 'Memproses...' : 'Export Excel'}
          </button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari Order ID / Mentee..."
          suppressHydrationWarning
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300 }}
        />
        <CleanCombobox
          value={filters.status ?? ''}
          onChange={val => setFilters(f => ({ ...f, status: val || undefined, page: 1 }))}
          placeholder="Semua Status"
          options={[
            { value: 'SUCCESS', label: 'Berhasil' },
            { value: 'PENDING', label: 'Menunggu' },
            { value: 'FAILED', label: 'Gagal' },
            { value: 'CANCELLED', label: 'Dibatalkan' },
            { value: 'REFUNDED', label: 'Refund' }
          ]}
          width={180}
        />
        <CleanCombobox
          value={filters.productType ?? ''}
          onChange={val => setFilters(f => ({ ...f, productType: val || undefined, page: 1 }))}
          placeholder="Semua Produk"
          options={[
            { value: 'BOOTCAMP', label: 'Bootcamp' },
            { value: 'MINI_COURSE', label: 'Mini Course' }
          ]}
          width={180}
        />
      </div>

      {/* Table */}
      <AnimatePresence mode="wait">
        {!_txsHasLoaded && isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AdminTableSkeleton rows={8} cols={7} />
            </motion.div>
          ) : txs.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ background: 'transparent' }}>
              <AdminEmptyState 
                type={isFiltered ? 'no-results' : 'empty'} 
                message={getEmptyMessage()} 
              />
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                      {['Order ID', 'Mentee', 'Produk', 'Tipe', 'Jumlah (Final)', 'Status', 'Tanggal'].map(h => (
                        <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {txs.map(tx => (
                      <tr key={tx.id}
                        style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: '11px', maxWidth: 180, color: 'var(--color-text-secondary)' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.orderId}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ fontWeight: 600 }}>{tx.user.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{tx.user.email}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{tx.title}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <AdminStatusChip status={tx.productType} label={tx.productType === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'} />
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {formatRupiah(tx.finalAmount)}
                          {tx.finalAmount < tx.amount && (
                            <div style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>{formatRupiah(tx.amount)}</div>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <AdminStatusChip status={tx.status} />
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {formatDate(tx.createdAt)}
                          {tx.paidAt && <div style={{ color: 'var(--color-primary)', fontSize: '10px' }}>✓ {formatDate(tx.paidAt)}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                page={filters.page}
                totalPages={totalPages}
                limit={filters.limit}
                total={total}
                onPageChange={p => setFilters(f => ({ ...f, page: p }))}
                onLimitChange={l => setFilters(f => ({ ...f, limit: l, page: 1 }))}
              />
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}
