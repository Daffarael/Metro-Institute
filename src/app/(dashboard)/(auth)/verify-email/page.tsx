'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, MailCheck } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/axios'
import { ROUTES } from '@/lib/utils'

type Status = 'verifying' | 'success' | 'error'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Token verifikasi tidak ditemukan.'); return }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setError(err?.response?.data?.message || 'Link verifikasi tidak valid atau sudah kedaluwarsa.')
      })
  }, [token])

  return (
    <div className="auth-layout">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <Loader2 size={48} color="var(--color-primary)" style={{ margin: '0 auto var(--space-5)', animation: 'spin 1s linear infinite' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Memverifikasi Email...</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>Mohon tunggu sebentar.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-5)' }}>
              <CheckCircle2 size={32} color="var(--color-primary)" />
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>Email Terverifikasi! 🎉</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
              Selamat! Email kamu sudah berhasil diverifikasi. Kamu sekarang bisa menggunakan semua fitur Metro Institute.
            </p>
            <Link href={ROUTES.LOGIN} className="btn btn-primary" style={{ width: '100%' }}>Login Sekarang</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-5)' }}>
              <XCircle size={32} color="#EF4444" />
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>Verifikasi Gagal</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>{error}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Link href="/resend-verify" className="btn btn-primary" style={{ width: '100%', gap: 'var(--space-2)' }}>
                <MailCheck size={16} /> Kirim Ulang Email Verifikasi
              </Link>
              <Link href={ROUTES.LOGIN} className="btn btn-secondary" style={{ width: '100%' }}>Kembali ke Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="auth-layout"><div className="auth-card" style={{ textAlign: 'center' }}><Loader2 size={48} color="var(--color-primary)" style={{ margin: '0 auto var(--space-5)', animation: 'spin 1s linear infinite' }} /></div></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
