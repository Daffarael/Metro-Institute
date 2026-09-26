'use client'
// src/components/admin/AdminConfirmModal.tsx
// Modal konfirmasi untuk aksi destruktif (DELETE, SUSPEND, REMOVE)
// Sesuai design_superadmin.md section 10

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface AdminConfirmModalProps {
  isOpen: boolean
  title: string
  description: string
  /** Jika diisi, user harus mengetik teks ini persis untuk mengaktifkan tombol konfirmasi */
  confirmText?: string
  /** Label tombol konfirmasi (default: "Ya, Lanjutkan") */
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
  isDangerous?: boolean
  isLoading?: boolean
}

export default function AdminConfirmModal({
  isOpen,
  title,
  description,
  confirmText,
  confirmLabel = 'Ya, Lanjutkan',
  onConfirm,
  onClose,
  isDangerous = false,
  isLoading = false,
}: AdminConfirmModalProps) {
  const [typed, setTyped] = useState('')

  // Reset typed on open
  useEffect(() => {
    if (!isOpen) setTyped('')
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const canConfirm = !confirmText || typed === confirmText

  const btnColor = isDangerous ? 'var(--color-error)' : 'var(--color-primary)'
  const btnBg    = isDangerous ? '#DC2626' : 'var(--color-primary)'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 'var(--z-modal)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-4)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        width: '100%',
        maxWidth: 440,
        padding: 'var(--space-6)',
        animation: 'modal-in 150ms ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-lg)',
              background: isDangerous ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertTriangle size={20} color={isDangerous ? 'var(--color-error)' : 'var(--color-warning)'} />
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28,
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-tertiary)',
              cursor: 'pointer',
              border: 'none', background: 'transparent',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--leading-relaxed)',
          marginBottom: confirmText ? 'var(--space-4)' : 'var(--space-6)',
        }}>
          {description}
        </p>

        {/* Confirm text input */}
        {confirmText && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              Ketik <strong style={{ color: 'var(--color-text-primary)' }}>{confirmText}</strong> untuk konfirmasi:
            </p>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={confirmText}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${typed && typed !== confirmText ? 'var(--color-error)' : 'var(--color-border)'}`,
                fontSize: 'var(--text-sm)',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                transition: 'border-color var(--transition-fast)',
              }}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: !canConfirm ? 'var(--color-border)' : btnBg,
              color: !canConfirm ? 'var(--color-text-disabled)' : '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: !canConfirm || isLoading ? 'not-allowed' : 'pointer',
              transition: 'opacity var(--transition-fast)',
              opacity: isLoading ? 0.7 : 1,
              minWidth: 90,
            }}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
