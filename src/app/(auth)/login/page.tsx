'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await authService.login(data)
      setToken(res.data.accessToken)
      setUser(res.data.user)

      if (res.data.user.role === 'SUPER_ADMIN' || res.data.user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        if (!res.data.user.skillTestDone) {
          router.push(ROUTES.SKILL_TEST)
        } else {
          router.push(ROUTES.BASECAMP)
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Email atau password salah.'
      toast.error(msg)
    }
  }

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true)
    authService.loginGoogle()
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
          <span style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)' }}>
            Metro Institute
          </span>
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
          Selamat Datang Kembali
        </h1>
        <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
          Masuk untuk melanjutkan perjalanan belajarmu
        </p>
      </div>

      {/* Google Login */}
      <button
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isSubmitting}
        className="btn btn-secondary btn-full"
        style={{ marginBottom: 'var(--space-4)', gap: 'var(--space-3)' }}
      >
        {isGoogleLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
        )}
        Lanjutkan dengan Google
      </button>

      {/* Divider */}
      <div className="divider-text" style={{ marginBottom: 'var(--space-4)' }}>
        atau masuk dengan email
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email</label>
          <div className="input-wrapper">
            <Mail size={16} className="input-icon-left" />
            <input
              id="login-email"
              type="email"
              placeholder="nama@email.com"
              autoComplete="email"
              className={`form-input has-icon-left ${errors.email ? 'error' : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <div className="flex justify-between items-center">
            <label className="form-label" htmlFor="login-password">Password</label>
            <Link href={ROUTES.FORGOT_PASSWORD} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)' }}>
              Lupa password?
            </Link>
          </div>
          <div className="input-wrapper">
            <Lock size={16} className="input-icon-left" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`form-input has-icon-left has-icon-right ${errors.password ? 'error' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              className="input-icon-right"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--color-text-tertiary)' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className="form-error">{errors.password.message}</span>}
        </div>

        <button
          type="submit"
          className={`btn btn-primary btn-full ${isSubmitting ? 'btn-loading' : ''}`}
          disabled={isSubmitting}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {!isSubmitting && 'Masuk'}
        </button>
      </form>

      <p className="text-center" style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        Belum punya akun?{' '}
        <Link href={ROUTES.REGISTER} style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-semibold)' }}>
          Daftar sekarang
        </Link>
      </p>
    </div>
  )
}
