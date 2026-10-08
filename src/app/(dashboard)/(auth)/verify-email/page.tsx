'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/axios'
import { ROUTES } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { AnimatedOTPInput } from '@/components/ui/animated-otp-input'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email')
  
  const [code, setCode] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const submitCode = async (otpString: string) => {
    if (!email) {
      toast.error('Email tidak ditemukan. Silakan daftar ulang.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/auth/verify-email', { email, code: otpString })
      toast.success('Email berhasil diverifikasi! Silakan login.')
      router.replace(ROUTES.LOGIN)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Kode OTP salah atau sudah kedaluwarsa')
      setCode('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      toast.error('Silakan lengkapi 6 digit kode OTP')
      return
    }
    submitCode(code)
  }

  const handleResend = async () => {
    if (!email) return
    setIsResending(true)
    try {
      await api.post('/auth/resend-verify', { email })
      toast.success('Kode OTP baru telah dikirim ke email Anda.')
      setCode('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim ulang OTP')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 font-sans selection:bg-zinc-900 selection:text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-zinc-200/50"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-2">Verifikasi Email</h1>
          <p className="text-sm text-zinc-500 text-center leading-relaxed">
            Masukkan 6 digit kode OTP yang telah kami kirimkan ke <br/>
            <span className="font-medium text-zinc-900">{email || 'email Anda'}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-8">
          <div className="flex justify-center w-full">
            <AnimatedOTPInput
              value={code}
              onChange={(val) => setCode(val)}
              onComplete={(val) => {
                setTimeout(() => submitCode(val), 100)
              }}
              maxLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting || code.length !== 6}
            className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verifikasi Sekarang'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={handleResend} 
            disabled={isResending} 
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
          >
            {isResending ? 'Mengirim ulang...' : 'Belum menerima kode? Kirim Ulang'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-center">
          <Link href={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
