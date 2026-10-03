'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES } from '@/lib/utils'
import { toast } from 'sonner'

const schema = z.object({
  password: z.string()
    .min(8, 'Minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus ada huruf besar')
    .regex(/[a-z]/, 'Harus ada huruf kecil')
    .regex(/[0-9]/, 'Harus ada angka'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) router.replace(ROUTES.LOGIN)
  }, [token])

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')
  const checks = [
    { label: 'Minimal 8 karakter', ok: password.length >= 8 },
    { label: 'Huruf besar', ok: /[A-Z]/.test(password) },
    { label: 'Huruf kecil', ok: /[a-z]/.test(password) },
    { label: 'Angka', ok: /[0-9]/.test(password) },
  ]

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/reset-password', { token, password: data.password })
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Link tidak valid atau sudah kedaluwarsa'
      toast.error(msg)
    }
  }

  if (done) return (
    <div className="auth-card" style={{ textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-5)' }}>
        <CheckCircle2 size={32} color="var(--color-primary)" />
      </div>
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>Password Berhasil Diubah!</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
        Password akun Metro Institute kamu telah berhasil diperbarui. Silakan login dengan password baru.
      </p>
      <Link href={ROUTES.LOGIN} className="btn btn-primary" style={{ width: '100%' }}>Login Sekarang</Link>
    </div>
  )

  return (
    <div className="auth-card">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 32, marginBottom: 'var(--space-2)' }}>🔑</div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Buat Password Baru</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          Password baru harus berbeda dengan password sebelumnya.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="rp-password">Password Baru</label>
          <div className="input-wrapper">
            <Lock size={15} className="input-icon-left" />
            <input
              id="rp-password"
              type={showPw ? 'text' : 'password'}
              placeholder="Buat password kuat"
              className={`form-input has-icon-left has-icon-right ${errors.password ? 'error' : ''}`}
              {...register('password')}
            />
            <button type="button" className="input-icon-right" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }} onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {/* Strength indicators */}
          {password.length > 0 && (
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {checks.map((c) => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', color: c.ok ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}>
                  {c.ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />} {c.label}
                </div>
              ))}
            </div>
          )}
          {errors.password && <span className="form-error">{errors.password.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="rp-confirm">Konfirmasi Password</label>
          <div className="input-wrapper">
            <Lock size={15} className="input-icon-left" />
            <input
              id="rp-confirm"
              type="password"
              placeholder="Ulangi password baru"
              className={`form-input has-icon-left ${errors.confirmPassword ? 'error' : ''}`}
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
        </div>

        <button type="submit" disabled={isSubmitting} className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`}>
          {!isSubmitting && 'Reset Password'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-layout">
      <Suspense fallback={<div className="auth-card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Memuat...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
