'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MailCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/axios'
import { ROUTES } from '@/lib/utils'
import { toast } from 'sonner'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email')
  
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Email tidak ditemukan. Silakan daftar ulang.')
      return
    }
    if (code.length !== 6) {
      toast.error('Kode OTP harus 6 digit')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/auth/verify-email', { email, code })
      toast.success('Email berhasil diverifikasi! Silakan login.')
      router.replace(ROUTES.LOGIN)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Kode OTP salah atau sudah kedaluwarsa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    setIsResending(true)
    try {
      await api.post('/auth/resend-verify', { email })
      toast.success('Kode OTP baru telah dikirim ke email Anda.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim ulang OTP')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-5)' }}>
          <MailCheck size={32} color="var(--color-primary)" />
        </div>
        
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Verifikasi Email</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
          Kami telah mengirimkan 6-digit kode OTP ke <strong>{email || 'email Anda'}</strong>. Masukkan kode tersebut di bawah ini.
        </p>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Kode OTP (6 Digit)"
            style={{ 
              width: '100%', padding: '16px', fontSize: '24px', letterSpacing: '8px', 
              textAlign: 'center', borderRadius: '12px', border: '2px solid var(--color-border)',
              outline: 'none', background: '#FAFAFA', fontWeight: 'bold'
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting || code.length !== 6}>
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Verifikasi Sekarang'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button onClick={handleResend} disabled={isResending} className="btn btn-secondary" style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-border)' }}>
            {isResending ? 'Mengirim ulang...' : 'Kirim Ulang Kode OTP'}
          </button>
          <Link href={ROUTES.LOGIN} className="btn btn-secondary" style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)' }}>
            Kembali ke Login
          </Link>
        </div>
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
