'use client'

import { useSearchParams } from 'next/navigation'
import { XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import { ROUTES } from '@/lib/utils'

interface TxData {
  id: string; orderId: string; title: string; amount: number; status: string
}

import { Suspense } from 'react'

function CheckoutFailedContent() {
  const searchParams = useSearchParams()
  const orderId      = searchParams.get('order_id')

  const { data: tx } = useQuery<TxData>({
    queryKey: ['transaction-failed', orderId],
    queryFn: () => api.get(`/transactions/${orderId}`).then((r) => r.data.data),
    enabled: !!orderId,
  })

  return (
    <div className="auth-card" style={{ textAlign: 'center', maxWidth: 440 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-5)' }}>
        <XCircle size={36} color="#EF4444" />
      </div>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
        Pembayaran Gagal
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)', lineHeight: 'var(--leading-relaxed)' }}>
        {tx
          ? `Pembayaran untuk "${tx.title}" tidak berhasil diproses. Kamu bisa mencoba lagi dari halaman transaksi.`
          : 'Pembayaran tidak berhasil diproses. Silakan coba lagi atau hubungi support jika masalah berlanjut.'}
      </p>

      {/* Retry button for pending transactions */}
      {tx && tx.status === 'PENDING' && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => {
            api.get(`/transactions/${orderId}`).then((r) => {
              const w = window as unknown as { snap?: { pay: (token: string, opts: object) => void } }
              if (r.data.data.snapToken && w.snap) {
                w.snap.pay(r.data.data.snapToken, {
                  onSuccess: () => window.location.href = `/checkout/success?order_id=${orderId}`,
                })
              }
            })
          }}
        >
          <RefreshCw size={16} /> Coba Bayar Lagi
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Link href={ROUTES.TRANSACTIONS} className="btn btn-secondary" style={{ width: '100%' }}>
          Lihat Riwayat Transaksi
        </Link>
        <Link href={ROUTES.CATALOG} className="btn btn-ghost" style={{ width: '100%' }}>
          Kembali ke Katalog
        </Link>
      </div>

      <p style={{ marginTop: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
        Butuh bantuan? Hubungi{' '}
        <a href="mailto:support@metroinstitute.id" style={{ color: 'var(--color-primary)' }}>
          support@metroinstitute.id
        </a>
      </p>
    </div>
  )
}

export default function CheckoutFailedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <Suspense fallback={<div className="auth-card" style={{ textAlign: 'center', maxWidth: 440 }}>Memuat...</div>}>
        <CheckoutFailedContent />
      </Suspense>
    </div>
  )
}
