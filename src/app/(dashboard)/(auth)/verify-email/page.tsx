'use client'

import * as React from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, RefreshCw, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import api from '@/lib/axios'
import { ROUTES } from '@/lib/utils'
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AnimatedOTPInput } from "@/components/ui/otp-input"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email')
  const redirectUrl = searchParams.get('redirect')

  const [value, setValue] = React.useState("")
  const [isComplete, setIsComplete] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleComplete = async (otp: string) => {
    setValue(otp)
    setIsComplete(true)
    setIsLoading(true)

    if (!email) {
      toast.error('Email tidak ditemukan. Silakan daftar ulang.')
      setIsLoading(false)
      setIsComplete(false)
      return
    }

    try {
      await api.post('/auth/verify-email', { email, code: otp })
      toast.success('Email berhasil diverifikasi! Silakan login.')
      
      // Give a tiny moment for the success animation to be seen
      setTimeout(() => {
        if (redirectUrl) {
          router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectUrl)}`)
        } else {
          router.replace(ROUTES.LOGIN)
        }
      }, 1000)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Kode OTP salah atau sudah kedaluwarsa')
      handleReset()
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    // Treat Reset as resend in our context, or just reset the UI state
    // Let's reset UI state, but if they click button "Reset Code", we can also resend
    setValue("")
    setIsComplete(false)
    setIsLoading(false)
  }

  const handleResend = async () => {
    if (!email) return
    setIsLoading(true)
    try {
      await api.post('/auth/resend-verify', { email })
      toast.success('Kode OTP baru telah dikirim ke email Anda.')
      handleReset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim ulang OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <Card className="w-full max-w-md bg-white border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="text-center pb-8 pt-10">
          <CardTitle className="text-3xl font-bold text-slate-900 mb-2">Verifikasi Email</CardTitle>
          <CardDescription className="text-slate-500 text-base">
            Masukkan 6 digit kode yang dikirim ke email Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pb-10">
          <div className="flex justify-center">
            <AnimatedOTPInput
              value={value}
              onChange={setValue}
              onComplete={handleComplete}
              maxLength={6}
            />
          </div>

          <AnimatePresence mode="wait">
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-center mt-6"
              >
                {isLoading ? (
                  <div className="text-slate-500 flex items-center justify-center space-x-2 font-medium">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Memverifikasi kode...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-green-600 font-medium">
                    <CheckCircle className="h-5 w-5" />
                    <span>Verifikasi Berhasil!</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center mt-10">
            <Button 
              variant="outline" 
              onClick={handleResend} 
              disabled={isLoading}
              className="w-full h-12 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-semibold transition-all shadow-sm mt-4"
            >
              Kirim Ulang Kode
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
      <VerifyEmailContent />
    </React.Suspense>
  )
}
