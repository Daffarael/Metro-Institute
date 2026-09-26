'use client'
// src/components/admin/AdminTopbar.tsx

import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'

interface AdminUser {
  name: string
  email: string
  profilePhoto?: string
}

export default function AdminTopbar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch admin user info
  useEffect(() => {
    api.get('/users/me').then(r => setUser(r.data.data)).catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    router.push('/login')
  }

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 var(--space-6)',
      gap: 'var(--space-4)',
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-sticky)',
    }}>


      {/* User dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          suppressHydrationWarning
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: open ? 'var(--color-bg)' : 'transparent',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 30, height: 30,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={14} color="var(--color-primary)" />
            )}
          </div>
          <span style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {user?.name ?? 'Admin'}
          </span>
          <ChevronDown
            size={14}
            color="var(--color-text-tertiary)"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 180,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            zIndex: 'var(--z-dropdown)',
          }}>
            {user && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  {user.email}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-error)',
                fontWeight: 500,
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-error-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
