'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { ensureAbsoluteUrl } from '@/lib/utils'
import api from '@/lib/axios'

export interface LiveJoinConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  meetingUrl?: string | null
  sessionTitle?: string
}

export default function LiveJoinConfirmModal({
  isOpen,
  onClose,
  meetingUrl,
}: LiveJoinConfirmModalProps) {
  const { user, updateUser } = useAuthStore()
  const [countdown, setCountdown] = useState(3)
  const [fallbackEmail, setFallbackEmail] = useState<string>('')
  const [fallbackName, setFallbackName] = useState<string>('')

  useEffect(() => {
    if (!isOpen) return

    setCountdown(3)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && (!user?.email || !user?.name)) {
      api
        .get('/auth/me')
        .then((res) => {
          const u = res.data?.data || res.data?.user
          if (u) {
            if (u.email) setFallbackEmail(u.email)
            if (u.name) setFallbackName(u.name)
            updateUser({ email: u.email, name: u.name })
          }
        })
        .catch(() => {})
    }
  }, [isOpen, user?.email, user?.name, updateUser])

  const displayEmail = user?.email || fallbackEmail || '-'
  const displayName = user?.name || fallbackName || ''

  const handleProceed = () => {
    if (countdown > 0 || !meetingUrl) return

    let finalUrl = ensureAbsoluteUrl(meetingUrl)
    if (
      displayEmail &&
      displayEmail !== '-' &&
      finalUrl.includes('meet.google.com') &&
      !finalUrl.includes('authuser=')
    ) {
      const separator = finalUrl.includes('?') ? '&' : '?'
      finalUrl = `${finalUrl}${separator}authuser=${encodeURIComponent(displayEmail)}`
    }

    window.open(finalUrl, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
            backdropFilter: 'blur(3px)',
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--color-text-primary)',
                }}
              >
                Konfirmasi Akun Presensi
              </h3>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 16px 0',
              }}
            >
              Pastikan Anda login dan bergabung ke Google Meet menggunakan akun Gmail yang terdaftar berikut agar kehadiran Anda tercatat otomatis:
            </p>

            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '12.5px',
                color: 'var(--color-text-secondary)',
                marginBottom: 20,
              }}
            >
              <div>
                <strong>Gmail Terdaftar:</strong>{' '}
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {displayEmail}
                </span>
              </div>
              {displayName && (
                <div style={{ marginTop: 4 }}>
                  <strong>Nama Akun:</strong>{' '}
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {displayName}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={countdown > 0}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--color-primary)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  opacity: countdown > 0 ? 0.55 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {countdown > 0 ? `Lanjutkan (${countdown}s)` : 'Lanjutkan ke Meet'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
