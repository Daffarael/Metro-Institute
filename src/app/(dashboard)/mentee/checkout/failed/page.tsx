'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { XCircle, ChevronLeft, RotateCcw } from 'lucide-react'
import { ROUTES } from '@/lib/utils'

function CheckoutFailedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  const handleRetry = () => {
    if (type === 'course' && id) {
      router.push(ROUTES.COURSE_DETAIL(id))
    } else if (type === 'bootcamp' && id) {
      router.push(ROUTES.BOOTCAMP_DETAIL(id))
    } else {
      router.push(ROUTES.MY_COURSES)
    }
  }

  const handleBack = () => {
    router.push(ROUTES.MY_COURSES)
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
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px'
          }}
        >
          <XCircle size={48} strokeWidth={2.5} />
        </motion.div>

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 12 }}>
          Pembayaran Gagal
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          Maaf, terjadi kesalahan saat memproses pembayaran kamu. Silakan coba lagi atau gunakan metode pembayaran yang berbeda.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleBack}
            style={{
              flex: 1, padding: '14px 0',
              background: 'var(--color-bg)', color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)', borderRadius: 12,
              fontSize: '15px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
          >
            <ChevronLeft size={18} /> Kembali
          </button>
          
          <button
            onClick={handleRetry}
            style={{
              flex: 1, padding: '14px 0',
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 12,
              fontSize: '15px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
          >
            <RotateCcw size={18} /> Coba Lagi
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat...</div>}>
      <CheckoutFailedContent />
    </Suspense>
  )
}
