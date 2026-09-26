'use client'
// src/components/admin/AdminEmptyState.tsx

import React from 'react'
import { Inbox, AlertCircle, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface AdminEmptyStateProps {
  type?: 'empty' | 'error' | 'no-results'
  message?: string
  action?: React.ReactNode
}

const CONFIG = {
  empty:        { title: 'Belum ada data', icon: Inbox },
  error:        { title: 'Gagal memuat data', icon: AlertCircle },
  'no-results': { title: 'Tidak ada hasil pencarian', icon: Search },
}

export default function AdminEmptyState({
  type = 'empty',
  message,
  action,
}: AdminEmptyStateProps) {
  const { title, icon: Icon } = CONFIG[type]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
      background: '#ffffff',
      borderRadius: '24px',
      border: '1px dashed rgba(0,0,0,0.1)',
      minHeight: 400,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}
      >
        <div style={{
          width: 56, height: 56,
          borderRadius: 16,
          background: '#f9fafb',
          border: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <Icon size={28} color="var(--color-text-tertiary)" strokeWidth={1.5} />
        </div>

        <h3 style={{ 
          fontWeight: 700, 
          fontSize: '20px', 
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
          margin: '0 0 12px 0'
        }}>
          {title}
        </h3>
        
        {message && (
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--color-text-secondary)', 
            maxWidth: 360, 
            lineHeight: 1.6,
            margin: 0
          }}>
            {message}
          </p>
        )}

        {action && (
          <div style={{ marginTop: 32, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
            {action}
          </div>
        )}
      </motion.div>
    </div>
  )
}
