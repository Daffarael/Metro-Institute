'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatRupiah } from '@/lib/utils'
import { ROUTES } from '@/lib/utils'

interface TxData {
  id: string; orderId: string; productType: string; title: string
  amount: number; status: string; paidAt?: string
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const orderId      = searchParams.get('order_id')

  const { data: tx, isLoading } = useQuery<TxData>({
    queryKey: ['transaction', orderId],
    queryFn: () => api.get(`/transactions/${orderId}`).then((r) => r.data.data),
    enabled:  !!orderId,
    refetchInterval: (d) => {
      // Keep polling until SUCCESS
      if (d?.status === 'SUCCESS') return false
      return 2000
    },
  })

  useEffect(() => {
    if (!orderId) router.replace(ROUTES.MY_COURSES)
  }, [orderId])

  const renderDestination = () => {
    if (!tx) return null
    if (tx.productType === 'BOOTCAMP') {
      return (
        <Link href={ROUTES.MY_COURSES} className="btn btn-primary" style={{ width: '100%' }}>
          Lihat Bootcamp Saya
        </Link>
      )
    }
    return (
      <Link href={ROUTES.MY_COURSES} className="btn btn-primary" style={{ width: '100%' }}>
        Mulai Belajar
      </Link>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: 440 }}>
        {isLoading || tx?.status === 'PENDING' ? (
          <>
            <Loader2 size={48} color="var(--color-primary)" style={{ margin: '0 auto var(--space-5)', animation: 'spin 1s linear infinite' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
              Memproses Pembayaran...
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Mohon tunggu, kami sedang memverifikasi pembayaranmu.
            </p>
          </>
        ) : (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-5)' }}>
              <CheckCircle2 size={36} color="var(--color-primary)" />
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
              Pembayaran Berhasil! 🎉
            </h1>
            {tx && (
              <>
                <div className="card card-body-sm" style={{ marginBottom: 'var(--space-5)', textAlign: 'left', background: 'var(--color-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Produk</span>
                    <span style={{ fontWeight: 600 }}>{tx.title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Total Dibayar</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatRupiah(tx.amount)}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
                  Akses ke konten pembelajaran kamu sudah aktif. Selamat belajar dan raih impianmu! 🚀
                </p>
              </>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {renderDestination()}
              <Link href={ROUTES.TRANSACTIONS} className="btn btn-secondary">
                Riwayat Transaksi
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
