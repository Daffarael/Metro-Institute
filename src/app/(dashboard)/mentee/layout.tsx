'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './_components/Sidebar'
import { Topbar } from './_components/Topbar'
import RoleGuard from '@/components/RoleGuard'
import PageTransition from '@/components/admin/PageTransition'

export default function MenteeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLearningPage = pathname.includes('/session/') || pathname.includes('/learn/')
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
          <main className="dashboard-content" style={{
            flex: 1,
            overflowY: isLearningPage ? 'hidden' : 'auto',
            padding: isLearningPage ? 0 : (isMobile ? 'var(--space-4)' : 'var(--space-8)'),
            display: isLearningPage ? 'flex' : 'block',
            flexDirection: isLearningPage ? 'column' : undefined
          }}>
            <PageTransition style={isLearningPage ? { height: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : undefined}>
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
