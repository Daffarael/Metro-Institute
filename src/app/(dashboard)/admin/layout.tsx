'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'
import PageTransition from '@/components/admin/PageTransition'
import RoleGuard from '@/components/RoleGuard'
import { Menu } from 'lucide-react'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/mentee/basecamp">
      <div className="admin-panel-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
        <AdminSidebar 
          isCollapsed={isCollapsed} 
          toggleCollapse={() => setIsCollapsed(!isCollapsed)} 
          isMobile={isMobile}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
          
          {/* Mobile Header */}
          {isMobile && (
            <header style={{
              height: 'var(--topbar-height)',
              background: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 var(--space-4)',
              gap: 'var(--space-4)',
              position: 'sticky',
              top: 0,
              zIndex: 50,
            }}>
              <button 
                onClick={() => setIsMobileOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg)', color: 'var(--color-text-secondary)'
                }}
              >
                <Menu size={20} />
              </button>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>Metro Admin</div>
            </header>
          )}

          <main style={{ flex: 1, padding: isMobile ? 'var(--space-4)' : 'var(--space-8)', overflowY: 'auto' }}>
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>

      {isMobile && isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
        />
      )}
    </RoleGuard>
  )
}
