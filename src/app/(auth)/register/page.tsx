'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(80, 'Nama terlalu panjang'),
  email: z.string().email('Format email tidak valid'),
  phone: z
    .string()
    .min(10, 'Nomor WhatsApp tidak valid')
    .regex(/^(08|62|\+62)/, 'Nomor harus diawali 08 atau +62'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus ada huruf besar')
    .regex(/[a-z]/, 'Harus ada huruf kecil')
    .regex(/[0-9]/, 'Harus ada angka'),
})
type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterForm) => {
    try {
      await authService.register(data)
      router.push(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.email)}`)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal mendaftar. Silakan coba lagi.'
      toast.error(msg)
    }
  }

  const passwordStrength = (pw: string) => {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[a-z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  return (
    <div className="auth-card animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-4">
          <div style={{
            width: 36, height: 36, background: 'var(--color-primary)',
            borderRadius: 'var(--radius-md)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 18,
          }}>M</div>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-xl)' }}>Metro Institute</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
          Buat Akun Baru
        </h1>
        <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
          Gratis. Mulai belajar hari ini.
        </p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={() => authService.loginGoogle()}
        className="btn btn-secondary btn-full"
        style={{ marginBottom: 'var(--space-4)', gap: 'var(--space-3)' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Daftar dengan Google
      </button>

      <div className="divider-text" style={{ marginBottom: 'var(--space-4)' }}>atau daftar dengan email</div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-name">Nama Lengkap</label>
          <div className="input-wrapper">
            <User size={16} className="input-icon-left" />
            <input id="reg-name" type="text" placeholder="Nama lengkapmu" autoComplete="name"
              className={`form-input has-icon-left ${errors.name ? 'error' : ''}`}
              {...register('name')} />
          </div>
          {errors.name && <span className="form-error">{errors.name.message}</span>}
          <span className="form-hint">⚠️ Nama ini akan tercetak di sertifikatmu</span>
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">Email</label>
          <div className="input-wrapper">
            <Mail size={16} className="input-icon-left" />
            <input id="reg-email" type="email" placeholder="nama@email.com" autoComplete="email"
              className={`form-input has-icon-left ${errors.email ? 'error' : ''}`}
              {...register('email')} />
          </div>
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-phone">Nomor WhatsApp</label>
          <div className="input-wrapper">
            <Phone size={16} className="input-icon-left" />
            <input id="reg-phone" type="tel" placeholder="08xxxxxxxxxx" autoComplete="tel"
              className={`form-input has-icon-left ${errors.phone ? 'error' : ''}`}
              {...register('phone')} />
          </div>
          {errors.phone && <span className="form-error">{errors.phone.message}</span>}
          <span className="form-hint">Ebook & info penting akan dikirim ke nomor ini</span>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-password">Password</label>
          <div className="input-wrapper">
            <Lock size={16} className="input-icon-left" />
            <input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 karakter"
              autoComplete="new-password"
              className={`form-input has-icon-left has-icon-right ${errors.password ? 'error' : ''}`}
              {...register('password')} />
            <button type="button" className="input-icon-right"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--color-text-tertiary)' }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className="form-error">{errors.password.message}</span>}
        </div>

        <button
          type="submit"
          className={`btn btn-primary btn-full ${isSubmitting ? 'btn-loading' : ''}`}
          disabled={isSubmitting}
        >
          {!isSubmitting && 'Buat Akun'}
        </button>
      </form>

      <p className="text-center" style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        Sudah punya akun?{' '}
        <Link href={ROUTES.LOGIN} style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-semibold)' }}>
          Masuk di sini
        </Link>
      </p>

      <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center', lineHeight: 'var(--leading-relaxed)' }}>
        Dengan mendaftar, kamu menyetujui{' '}
        <a href="#" style={{ color: 'var(--color-primary)' }}>Syarat & Ketentuan</a>{' '}
        dan{' '}
        <a href="#" style={{ color: 'var(--color-primary)' }}>Kebijakan Privasi</a> kami.
      </p>
    </div>
  )
}
