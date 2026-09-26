'use client'

import { useState } from 'react'
import { Sidebar } from './_components/Sidebar'
import { Topbar } from './_components/Topbar'

export default function MenteeLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="dashboard-layout" style={{ display: 'flex' }}>
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        <Topbar />
        <main className="dashboard-content" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-8) var(--space-8)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
