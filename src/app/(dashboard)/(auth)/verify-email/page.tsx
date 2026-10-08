'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/axios'
import { ROUTES } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[420px] bg-white rounded-[32px] p-10 shadow-[0_24px_80px_-12px_rgba(34,34,46,0.08)] text-center relative overflow-hidden"
      >
        <div className="mx-auto w-16 h-16 bg-[#f3f4f6] rounded-2xl flex items-center justify-center mb-8 text-[#22222E]">
          <Mail size={28} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-2xl font-extrabold text-[#22222E] mb-3 tracking-tight">Verifikasi Email</h1>
        <p className="text-[#6B7280] text-[13px] leading-relaxed mb-8 px-2">
          Kami telah mengirimkan 6-digit kode keamanan ke <br/>
          <strong className="text-[#22222E] font-semibold">{email || 'email Anda'}</strong>.
        </p>

        <form onSubmit={handleVerify} className="flex flex-col">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="••••••"
            className="w-full text-center text-3xl tracking-[0.5em] font-extrabold text-[#22222E] bg-gray-50 border border-gray-200/80 rounded-2xl py-5 focus:bg-white focus:border-[#22222E] focus:ring-4 focus:ring-[#22222E]/10 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.2em]"
          />
          
          <button 
            type="submit" 
            disabled={isSubmitting || code.length !== 6}
            className="mt-6 w-full flex items-center justify-center py-4 bg-[#22222E] hover:bg-[#16161F] text-white rounded-full font-bold text-[14px] tracking-wide transition-all disabled:opacity-50 disabled:hover:bg-[#22222E] shadow-lg shadow-[#22222E]/20"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Verifikasi Sekarang'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-2">
          <button 
            onClick={handleResend} 
            disabled={isResending} 
            className="text-[13px] font-semibold text-[#6B7280] hover:text-[#22222E] transition-colors disabled:opacity-50"
          >
            {isResending ? 'Mengirim ulang...' : 'Kirim Ulang Kode OTP'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link href={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-[12px] font-semibold text-gray-400 hover:text-[#22222E] transition-colors">
            <ArrowLeft size={14} strokeWidth={2.5} />
            Kembali ke Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 size={40} className="animate-spin text-[#22222E]" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
