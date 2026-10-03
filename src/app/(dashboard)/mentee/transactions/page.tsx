'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react'
import api from '@/lib/axios'
import { formatRupiah, formatDate } from '@/lib/utils'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

interface Transaction {
  id: string; orderId: string; productType: string; title: string
  amount: number; status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  createdAt: string; paidAt?: string
}

const STATUS_CONFIG = {
  SUCCESS:   { label: 'Berhasil', icon: <CheckCircle2 size={14} />, color: 'var(--color-primary)', bg: '#D1FAE5' },
  PENDING:   { label: 'Menunggu', icon: <Clock size={14} />, color: '#D97706', bg: '#FEF3C7' },
  FAILED:    { label: 'Gagal', icon: <XCircle size={14} />, color: '#EF4444', bg: '#FEE2E2' },
  CANCELLED: { label: 'Dibatalkan', icon: <XCircle size={14} />, color: '#EF4444', bg: '#FEE2E2' },
  REFUNDED:  { label: 'Refund', icon: <CreditCard size={14} />, color: '#6B7280', bg: '#F3F4F6' },
}

const STATUS_FILTERS = [
  { label: 'Semua',    value: '' },
  { label: 'Berhasil', value: 'PAID' },
  { label: 'Menunggu', value: 'PENDING' },
  { label: 'Gagal',    value: 'FAILED' },
] as const

function StatusTabs({
  status,
  setStatus,
}: {
  status: string
  setStatus: (s: string) => void
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pill, setPill] = useState({ left: 0, width: 0 })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const idx = STATUS_FILTERS.findIndex((f) => f.value === status)
    const el = btnRefs.current[idx === -1 ? 0 : idx]
    if (el) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth })
      setReady(true)
    }
  }, [status])

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
      {/* Sliding pill */}
      {ready && (
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
      )}

      {STATUS_FILTERS.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => { btnRefs.current[i] = el }}
          type="button"
          onClick={() => setStatus(opt.value)}
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '8px 18px',
            border: 'none',
            background: 'transparent',
            borderRadius: 9999,
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontWeight: status === opt.value ? 600 : 500,
            color: status === opt.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            transition: 'color 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function TransactionsPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['transactions', status, page],
    queryFn: () => api.get('/transactions', { params: { status: status || undefined, page, limit: 15 } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  const transactions: Transaction[] = data?.data || []
  const meta = data?.meta || { total: 0, page: 1, limit: 15 }
  const totalPages = Math.ceil(meta.total / meta.limit)

  const showSkeleton = isLoading && transactions.length === 0
  const showEmpty = !showSkeleton && transactions.length === 0
  const showList = !showSkeleton && transactions.length > 0
  const isTransitioning = isFetching

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Riwayat Transaksi</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Semua riwayat pembayaran kamu di Metro Institute.</p>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <StatusTabs status={status} setStatus={(s) => { setStatus(s); setPage(1) }} />
      </div>

      {/* List */}
      <div style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait">
          {showSkeleton ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
              </div>
            </motion.div>
          ) : showEmpty ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AdminEmptyState
                type={status ? 'no-results' : 'empty'}
                message={status ? `Tidak ada transaksi dengan status "${STATUS_FILTERS.find(f => f.value === status)?.label}".` : "Belum ada transaksi. Transaksi pembelian bootcamp dan mini course akan muncul di sini."}
                action={
                  status ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                      onClick={() => { setStatus(''); setPage(1) }}
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
                {transactions.map((tx, idx) => {
                  const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.PENDING
            return (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: idx < transactions.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
              }}>
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cfg.color }}>
                  {cfg.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }} className="line-clamp-1">{tx.title}</div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 2, fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    <span>{tx.orderId}</span>
                    <span>·</span>
                    <span>{formatDate(tx.createdAt)}</span>
                  </div>
                </div>

                {/* Amount + status */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{formatRupiah(tx.amount)}</div>
                  <div style={{ marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: cfg.bg, color: cfg.color, fontSize: '10px', fontWeight: 700 }}>
                    {cfg.label}
                  </div>
                </div>

                {/* Pay now button for pending */}
                {tx.status === 'PENDING' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '8px 16px', borderRadius: 'var(--radius-md)',
                      background: 'var(--color-primary)', color: '#fff',
                      border: 'none', fontWeight: 600, fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      api.get(`/transactions/${tx.orderId}`).then((r) => {
                        const w = window as unknown as { snap?: { pay: (token: string, opts: object) => void } }
                        if (r.data.data.snapToken && w.snap) {
                          w.snap.pay(r.data.data.snapToken, { onSuccess: () => window.location.reload() })
                        }
                      })
                    }}
                  >
                    Bayar
                  </motion.button>
                )}
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
          <motion.button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)} 
            whileHover={page === 1 ? {} : { scale: 1.05 }}
            whileTap={page === 1 ? {} : { scale: 0.95 }}
            style={{ 
              padding: '8px 16px', borderRadius: 'var(--radius-md)', 
              background: '#fff', color: 'var(--color-text-primary)', 
              border: '1px solid var(--color-border)', fontWeight: 600, 
              cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1
            }}
          >
            ←
          </motion.button>
          <span style={{ alignSelf: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{page} / {totalPages}</span>
          <motion.button 
            disabled={page >= totalPages} 
            onClick={() => setPage(page + 1)} 
            whileHover={page >= totalPages ? {} : { scale: 1.05 }}
            whileTap={page >= totalPages ? {} : { scale: 0.95 }}
            style={{ 
              padding: '8px 16px', borderRadius: 'var(--radius-md)', 
              background: '#fff', color: 'var(--color-text-primary)', 
              border: '1px solid var(--color-border)', fontWeight: 600, 
              cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1
            }}
          >
            →
          </motion.button>
        </div>
      )}
    </div>
  )
}
