'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell, Search } from 'lucide-react'
import { AppleSpotlight } from '@/components/ui/AppleSpotlight'
import { useAuthStore } from '@/stores/auth.store'
import { useNotifStore } from '@/stores/auth.store'
import { ROUTES, getInitials } from '@/lib/utils'

interface TopbarProps {
  title?: string
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuthStore()
  const { unreadCount } = useNotifStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header
      className="dashboard-topbar"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-6)',
        gap: 'var(--space-4)',
      }}
    >
      {title && (
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {title}
        </h2>
      )}

      {/* Search */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 400, height: 40, display: 'flex', alignItems: 'center', zIndex: 50 }}>
          <AppleSpotlight />
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* Notifications */}
        <Link
          href={ROUTES.NOTIFICATIONS}
          style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            justifyContent: 'center', width: 36, height: 36,
            borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)',
            textDecoration: 'none', transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-error)',
              border: '1.5px solid var(--color-surface)',
            }} />
          )}
        </Link>

        {/* Avatar */}
        <Link href={user ? ROUTES.PROFILE(user.id) : ROUTES.LOGIN}>
          <div className="avatar avatar-sm" style={{ cursor: 'pointer', transition: 'box-shadow var(--transition-fast)' }}>
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} />
            ) : (
              <span style={{ fontSize: '11px' }}>{user ? getInitials(user.name) : '?'}</span>
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}
