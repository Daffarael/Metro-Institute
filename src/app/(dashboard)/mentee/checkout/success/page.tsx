'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronRight, BookOpen } from 'lucide-react'
import { ROUTES } from '@/lib/utils'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const type = searchParams.get('type') // 'course' | 'bootcamp'
  const id = searchParams.get('id')

  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (type === 'course' && id) {
            router.replace(ROUTES.LEARN_COURSE(id))
          } else if (type === 'bootcamp' && id) {
            router.replace(ROUTES.LEARN_BOOTCAMP(id))
          } else {
            router.replace(ROUTES.MY_COURSES)
          }
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [type, id, router])

  const handleManualRedirect = () => {
    if (type === 'course' && id) {
      router.replace(ROUTES.LEARN_COURSE(id))
    } else if (type === 'bootcamp' && id) {
      router.replace(ROUTES.LEARN_BOOTCAMP(id))
    } else {
      router.replace(ROUTES.MY_COURSES)
    }
  }

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 24,
          padding: '48px 40px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{
            width: 80, height: 80,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px'
          }}
        >
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </motion.div>

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 12 }}>
          Pembayaran Berhasil!
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          Selamat! Transaksi kamu telah berhasil diproses. Kamu sekarang memiliki akses penuh ke kelas yang kamu beli.
        </p>

        <div style={{
          background: 'var(--color-bg)',
          borderRadius: 12, padding: '16px',
          display: 'flex', alignItems: 'center', gap: 16,
          marginBottom: 32, border: '1px solid var(--color-border-subtle)'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8, background: 'var(--color-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
            border: '1px solid var(--color-border-subtle)'
          }}>
            <BookOpen size={24} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Akses Kelas Dibuka
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
              Mengarahkan otomatis dalam {countdown} detik...
            </div>
          </div>
        </div>

        <button
          onClick={handleManualRedirect}
          style={{
            width: '100%', padding: '14px 0',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 12,
            fontSize: '15px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
        >
          Mulai Belajar Sekarang <ChevronRight size={18} />
        </button>
      </motion.div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
