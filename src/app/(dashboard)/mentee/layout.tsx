'use client'

import { useState } from 'react'
import { Sidebar } from './_components/Sidebar'
import { Topbar } from './_components/Topbar'
import RoleGuard from '@/components/RoleGuard'
import PageTransition from '@/components/admin/PageTransition'

export default function MenteeLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <RoleGuard allowedRoles={['MENTEE']} fallbackRoute="/admin/dashboard">
      <div className="dashboard-layout" style={{ display: 'flex' }}>
        <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
          <Topbar />
          <main className="dashboard-content" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-8) var(--space-8)' }}>
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </RoleGuard>
  )
}
