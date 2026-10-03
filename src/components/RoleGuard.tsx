'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, Role } from '@/stores/auth.store'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: Role[]
  fallbackRoute: string
}

export default function RoleGuard({ children, allowedRoles, fallbackRoute }: RoleGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (user && !allowedRoles.includes(user.role)) {
      router.replace(fallbackRoute)
    }
  }, [isMounted, isAuthenticated, user, allowedRoles, fallbackRoute, router])

  if (!isMounted) return null // Prevent hydration mismatch

  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Memverifikasi akses...
        </p>
      </div>
    )
  }

  return <>{children}</>
}
