'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await api.post('/auth/forgot-password', data)
    setEmail(data.email)
    setSent(true)
  }

  if (sent) return (
    <div className="auth-layout">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-5)' }}>
          <CheckCircle2 size={32} color="var(--color-primary)" />
        </div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>Cek Email Kamu</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
          Jika email <strong>{email}</strong> terdaftar, kami telah mengirimkan instruksi untuk mereset password. Link berlaku 1 jam.
        </p>
        <Link href={ROUTES.LOGIN} className="btn btn-primary" style={{ width: '100%' }}>
          Kembali ke Login
        </Link>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-4)' }}>
          Tidak menerima email? Periksa folder spam atau{' '}
          <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 'inherit', fontWeight: 600 }}>
            coba kirim ulang
          </button>
        </p>
      </div>
    </div>
  )

  return (
    <div className="auth-layout">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
          <div style={{ fontSize: 32, marginBottom: 'var(--space-2)' }}>🔐</div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Lupa Password?</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
            Masukkan email akun kamu dan kami akan mengirim link reset password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="fp-email">Email</label>
            <div className="input-wrapper">
              <Mail size={15} className="input-icon-left" />
              <input
                id="fp-email"
                type="email"
                placeholder="email@kamu.com"
                className={`form-input has-icon-left ${errors.email ? 'error' : ''}`}
                {...register('email')}
              />
            </div>
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <button type="submit" disabled={isSubmitting} className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`}>
            {!isSubmitting && 'Kirim Link Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          <Link href={ROUTES.LOGIN} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  )
}
