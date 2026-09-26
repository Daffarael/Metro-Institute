'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react'
import api from '@/lib/axios'
import { formatRupiah, formatDate } from '@/lib/utils'

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

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', status, page],
    queryFn: () => api.get('/transactions', { params: { status: status || undefined, page, limit: 15 } }).then((r) => r.data),
  })

  const transactions: Transaction[] = data?.data || []
  const meta = data?.meta || { total: 0, page: 1, limit: 15 }
  const totalPages = Math.ceil(meta.total / meta.limit)

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Riwayat Transaksi</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Semua riwayat pembayaran kamu di Metro Institute.</p>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <StatusTabs status={status} setStatus={(s) => { setStatus(s); setPage(1) }} />
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <CreditCard className="empty-state-icon" />
          <p className="empty-state-title">Belum ada transaksi</p>
          <p className="empty-state-desc">Transaksi pembelian bootcamp dan mini course akan muncul di sini.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
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
                  <button
                    className="btn btn-primary btn-sm"
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
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">←</button>
          <span style={{ alignSelf: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">→</button>
        </div>
      )}
    </div>
  )
}
