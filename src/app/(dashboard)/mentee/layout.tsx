'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './_components/Sidebar'
import { Topbar } from './_components/Topbar'
import RoleGuard from '@/components/RoleGuard'
import PageTransition from '@/components/admin/PageTransition'

export default function MenteeLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <RoleGuard allowedRoles={['MENTEE']} fallbackRoute="/admin/dashboard">
      <div className="dashboard-layout" style={{ display: 'flex' }}>
        <Sidebar 
          isCollapsed={isCollapsed} 
          toggleCollapse={() => setIsCollapsed(!isCollapsed)} 
          isMobile={isMobile}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', width: '100%' }}>
          <Topbar onMenuClick={() => setIsMobileOpen(true)} isMobile={isMobile} />
          <main className="dashboard-content" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 'var(--space-4)' : 'var(--space-8)' }}>
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90
          }}
        />
      )}
    </RoleGuard>
  )
}
