'use client'
// src/components/admin/AdminConfirmModal.tsx
// Modal konfirmasi untuk aksi destruktif (DELETE, SUSPEND, REMOVE)
// Sesuai design_superadmin.md section 10

import React, { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import TearButton from '@/components/ui/TearButton'

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

function renderFormattedDescription(text: string) {
  // Bold words inside quotes like "tesssssssssssssss"
  const parts = text.split(/(".*?")/)
  return parts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <strong key={index} style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
          {part}
        </strong>
      )
    }
    return part
  })
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          position: 'relative',
          background: 'var(--color-surface)',
          borderRadius: 24,
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: 440,
          padding: isDangerous ? '32px 28px 24px' : 'var(--space-6)',
          animation: 'modal-in 150ms ease',
        }}
      >
        {/* Top-Right Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup modal"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            transition: 'background var(--transition-fast), color var(--transition-fast)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-bg)'
            e.currentTarget.style.color = 'var(--color-text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-tertiary)'
          }}
        >
          <X size={18} />
        </button>

        {/* Standard Header (only for non-destructive / standard confirmations) */}
        {!isDangerous && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-warning-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} color="var(--color-warning)" />
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {title}
            </h3>
          </div>
        )}

        {/* Description Text */}
        <div
          style={{
            textAlign: isDangerous ? 'center' : 'left',
            margin: isDangerous ? '6px auto 24px' : (confirmText ? '0 0 var(--space-4)' : '0 0 var(--space-6)'),
            maxWidth: isDangerous ? 360 : undefined,
          }}
        >
          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              margin: 0,
              textWrap: 'balance' as any,
            }}
          >
            {renderFormattedDescription(description)}
          </p>
        </div>

        {/* Confirm text input if requested */}
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
        {isDangerous ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <TearButton
              tone="danger"
              label={confirmLabel}
              description="Sobek untuk menghapus"
              stubLabel="Tear"
              confirmedLabel="Dihapus"
              confirmedDescription="Sedang menghapus..."
              onConfirm={onConfirm}
              disabled={!canConfirm || isLoading}
            />

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                marginTop: 18,
                padding: '6px 18px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
            >
              Batal
            </button>
          </div>
        ) : (
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
                background: !canConfirm ? 'var(--color-border)' : 'var(--color-primary)',
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
        )}
      </div>
    </div>
  )
}
