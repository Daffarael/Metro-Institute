'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/lib/utils'
import api from '@/lib/axios'
import { DiamondPattern } from '@/components/ui/diamond-pattern'
import { PopButton } from '@/components/ui/PopButton'
import '../login/Login10.css'

const DEFAULT_LOGIN_IMAGE = ''

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})
type LoginForm = z.infer<typeof loginSchema>

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string()
    .min(9, 'Nomor WhatsApp minimal 9 digit')
    .max(15, 'Nomor WhatsApp terlalu panjang')
    .regex(/^[0-9+]+$/, 'Hanya boleh angka dan tanda +'),
  password: z.string()
    .min(8, 'Password minimal 8 karakter, mengandung huruf kapital, huruf kecil, dan angka')
    .regex(/[A-Z]/, 'Password minimal 8 karakter, mengandung huruf kapital, huruf kecil, dan angka')
    .regex(/[a-z]/, 'Password minimal 8 karakter, mengandung huruf kapital, huruf kecil, dan angka')
    .regex(/[0-9]/, 'Password minimal 8 karakter, mengandung huruf kapital, huruf kecil, dan angka'),
})
type RegisterForm = z.infer<typeof registerSchema>

interface AuthCardProps {
  initialMode?: 'login' | 'register'
}

export default function AuthCard({ initialMode = 'login' }: AuthCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setToken } = useAuthStore()

  const modeParam = searchParams.get('mode') || searchParams.get('tab')
  const isRegisterParam = searchParams.get('register') === 'true'

  const [isRegister, setIsRegister] = useState<boolean>(() => {
    if (modeParam === 'register' || isRegisterParam) return true
    if (modeParam === 'login') return false
    return initialMode === 'register'
  })

  const [showPass, setShowPass] = useState(false)
  const [showRegPass, setShowRegPass] = useState(false)
  const [loginImageUrl, setLoginImageUrl] = useState(DEFAULT_LOGIN_IMAGE)

  // Sync mode if query params change
  useEffect(() => {
    if (modeParam === 'register' || isRegisterParam) {
      setIsRegister(true)
    } else if (modeParam === 'login') {
      setIsRegister(false)
    }
  }, [modeParam, isRegisterParam])

  // Sync with browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/register') {
          setIsRegister(true)
        } else if (window.location.pathname === '/login') {
          setIsRegister(false)
        }
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Sync document title
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = isRegister ? 'Daftar | Metro Institute' : 'Masuk | Metro Institute'
    }
  }, [isRegister])

  useEffect(() => {
    api.get('/homepage-config')
      .then(r => {
        const configs: { key: string; value: string }[] = r.data.data ?? []
        const found = configs.find(c => c.key === 'login_image_url')
        if (found?.value) setLoginImageUrl(found.value)
      })
      .catch(() => {/* pakai default image */})
  }, [])

  const {
    register: regLogin,
    handleSubmit: handleLoginSubmit,
    setError: setLoginError,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const {
    register: regSignup,
    handleSubmit: handleSignupSubmit,
    setError: setSignupError,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const redirectUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null

  const handleSwitchToRegister = () => {
    setIsRegister(true)
    if (typeof window !== 'undefined' && window.location.pathname !== '/register') {
      window.history.pushState(null, '', '/register' + (window.location.search || ''))
    }
  }

  const handleSwitchToLogin = () => {
    setIsRegister(false)
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.pushState(null, '', '/login' + (window.location.search || ''))
    }
  }

  const onLogin = async (data: LoginForm) => {
    try {
      const res = await authService.login(data)
      setToken(res.data.accessToken)
      setUser(res.data.user)
      if (res.data.user.role === 'SUPER_ADMIN' || res.data.user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        if (redirectUrl) {
          router.push(redirectUrl)
        } else {
          router.push(res.data.user.skillTestDone ? ROUTES.BASECAMP : ROUTES.SKILL_TEST)
        }
      }
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.errors && data.errors.length > 0) {
        data.errors.forEach((e: any) => {
          if (['email', 'password'].includes(e.field)) {
            setLoginError(e.field as any, { type: 'server', message: e.message })
          } else {
            toast.error(e.message)
          }
        })
      } else if (data?.message?.toLowerCase().includes('email')) {
        setLoginError('email', { type: 'server', message: data.message })
        toast.error(data.message)
      } else if (data?.message?.toLowerCase().includes('password') || data?.message?.toLowerCase().includes('sandi') || data?.message?.toLowerCase().includes('username')) {
        setLoginError('password', { type: 'server', message: data.message })
        toast.error(data.message)
      } else {
        toast.error(data?.message || 'Gagal login.')
      }
    }
  }

  const onSignup = async (data: RegisterForm) => {
    try {
      await authService.register({ ...data })
      toast.success('Pendaftaran berhasil! Silakan periksa email Anda untuk kode OTP.')
      
      const nextUrl = new URLSearchParams()
      nextUrl.set('email', data.email)
      if (redirectUrl) nextUrl.set('redirect', redirectUrl)
        
      router.push(`/verify-email?${nextUrl.toString()}`)
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.errors && data.errors.length > 0) {
        data.errors.forEach((e: any) => {
          if (['name', 'email', 'phone', 'password'].includes(e.field)) {
            setSignupError(e.field as any, { type: 'server', message: e.message })
          } else {
            toast.error(e.message)
          }
        })
      } else if (data?.message?.includes('sudah terdaftar')) {
        setSignupError('email', { type: 'server', message: data.message })
        setSignupError('phone', { type: 'server', message: data.message })
      } else {
        toast.error(data?.message || 'Gagal mendaftar.')
      }
    }
  }

  return (
    <section className="page login-10">
      <div className={`card ${isRegister ? "register" : ""}`}>
        <div
          className="card-bg"
          style={loginImageUrl ? { backgroundImage: `url(${loginImageUrl})` } : {}}
        >
          {!loginImageUrl && <DiamondPattern size={64} diamondColor="#0F4432" />}
        </div>

        <div className="hero register">
          <img src="/metro-logo.png" alt="Metro Institute" className="hero-logo" />
          <h2>Mulai Karir</h2>
          <p>Bergabung dengan Metro Institute hari ini dan bangun karir impianmu.</p>
          <PopButton 
            type="button" 
            color="yellow" 
            size="default" 
            onClick={handleSwitchToLogin}
            className="px-10 h-12 font-extrabold text-sm min-w-[160px] shadow-md"
          >
            Login
          </PopButton>
        </div>

        <div className="form register">
          <div className="mobile-logo">
            <img src="/logo-metro-clean.png" alt="Metro Institute" className="h-8 w-auto mx-auto object-contain" />
          </div>
          <h2>Sign Up</h2>
          <form onSubmit={handleSignupSubmit(onSignup)}>
            
            <div className="input-group">
              <label>Name</label>
              <input type="text" placeholder="Joe Bloggs" {...regSignup('name')} />
              <div className="error-text">{signupErrors.name?.message || ' '}</div>
            </div>

            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="hello@example.com" {...regSignup('email')} />
              <div className="error-text">{signupErrors.email?.message || ' '}</div>
            </div>

            <div className="input-group">
              <label>Nomor WhatsApp</label>
              <input type="tel" placeholder="08123456789" {...regSignup('phone')} />
              <div className="error-text">{signupErrors.phone?.message || ' '}</div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-field">
                <input type={showRegPass ? "text" : "password"} placeholder="••••••••" {...regSignup('password')} />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowRegPass((prev) => !prev)}
                >
                  {showRegPass ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              <div className="error-text">{signupErrors.password?.message || ' '}</div>
            </div>

            <PopButton 
              type="submit" 
              color="green" 
              size="default" 
              disabled={isSignupSubmitting}
              className="w-full mt-2 font-extrabold text-base shadow-sm"
            >
              {isSignupSubmitting ? 'Loading...' : 'Sign Up'}
            </PopButton>
            
            <span className="or">Or Sign in with</span>
            <div className="socials">
              <PopButton 
                type="button" 
                color="white" 
                size="default" 
                onClick={() => authService.loginGoogle()}
                className="w-14 h-11 p-0 flex items-center justify-center shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              </PopButton>
            </div>
          </form>
          {/* Mobile only: link to switch to login */}
          <div className="mobile-switch">
            Sudah punya akun?
            <span onClick={handleSwitchToLogin}>Login</span>
          </div>
        </div>

        <div className="hero login">
          <img src="/metro-logo.png" alt="Metro Institute" className="hero-logo" />
          <h2>Selamat Datang</h2>
          <p>Masuk untuk melanjutkan pembelajaran Anda hari ini.</p>
          <PopButton 
            type="button" 
            color="yellow" 
            size="default" 
            onClick={handleSwitchToRegister}
            className="px-10 h-12 font-extrabold text-sm min-w-[160px] shadow-md"
          >
            Sign Up
          </PopButton>
        </div>

        <div className="form login">
          <div className="mobile-logo">
            <img src="/logo-metro-clean.png" alt="Metro Institute" className="h-8 w-auto mx-auto object-contain" />
          </div>
          <h2>Login</h2>
          <form onSubmit={handleLoginSubmit(onLogin)}>
            
            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="hello@example.com" {...regLogin('email')} />
              <div className="error-text">{loginErrors.email?.message || ' '}</div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-field">
                <input type={showPass ? "text" : "password"} placeholder="••••••••" {...regLogin('password')} />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowPass((prev) => !prev)}
                >
                  {showPass ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              <div className="error-text">{loginErrors.password?.message || ' '}</div>
            </div>

            <div className="remember-forgot">
              <label className="remember">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="forgot">Forget password?</Link>
            </div>

            <PopButton 
              type="submit" 
              color="green" 
              size="default" 
              disabled={isLoginSubmitting}
              className="w-full mt-2 font-extrabold text-base shadow-sm"
            >
              {isLoginSubmitting ? 'Loading...' : 'Login'}
            </PopButton>
            
            <span className="or">Or Sign in with</span>
            <div className="socials">
              <PopButton 
                type="button" 
                color="white" 
                size="default" 
                onClick={() => authService.loginGoogle()}
                className="w-14 h-11 p-0 flex items-center justify-center shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              </PopButton>
            </div>
          </form>
          {/* Mobile only: link to switch to register */}
          <div className="mobile-switch">
            Belum punya akun?
            <span onClick={handleSwitchToRegister}>Sign Up</span>
          </div>
        </div>

      </div>
    </section>
  )
}
