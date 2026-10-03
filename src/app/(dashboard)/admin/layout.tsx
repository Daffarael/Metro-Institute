'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'
import PageTransition from '@/components/admin/PageTransition'
import RoleGuard from '@/components/RoleGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/mentee/basecamp">
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
        {/* Sidebar dinamis seperti mentee */}
        <AdminSidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />

        {/* Main area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
        }}>
          {/* Topbar removed as requested */}

          {/* Page content */}
          <main style={{
            flex: 1,
            padding: 'var(--space-8)',
            overflowY: 'auto',
          }}>
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </RoleGuard>
  )
}
