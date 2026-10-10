'use client'
// src/components/admin/AdminSidebar.tsx

import { useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Tent, BookOpen, Zap, ClipboardCheck,
  FlaskConical, Users, CreditCard, Ticket, Megaphone,
  Mail, MessageSquare, Star, ScrollText, Home, Settings,
  LogOut, Flame
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import BranchedMenu from '@/components/ui/BranchedMenu'
import { MenuToggle } from '@/components/ui/MenuToggle'
import { useConfigStore } from '@/stores/config.store'

// Grouping navigation exactly as the old admin nav groups
const branchItems = [
  { value: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Konten',
    children: [
      { value: '/admin/bootcamp', label: 'Bootcamp', icon: Tent },
      { value: '/admin/mini-course', label: 'Mini Course', icon: BookOpen },
      { value: '/admin/challenges', label: 'Challenge Bank', icon: Zap },
      { value: '/admin/assignments', label: 'Penilaian Tugas', icon: ClipboardCheck },
      { value: '/admin/skill-test', label: 'Soal Skill Test', icon: FlaskConical },
    ]
  },
  {
    label: 'Pengguna',
    children: [
      { value: '/admin/mentees', label: 'Mentee', icon: Users },
    ]
  },
  {
    label: 'Operasional',
    children: [
      { value: '/admin/transactions', label: 'Transaksi', icon: CreditCard },
      { value: '/admin/vouchers', label: 'Voucher', icon: Ticket },
      { value: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
      { value: '/admin/leads', label: 'Leads Ebook', icon: Mail },
      { value: '/admin/reviews', label: 'Ulasan Mentee', icon: MessageSquare },
    ]
  },
  {
    label: 'Pengaturan',
    children: [
      { value: '/admin/xp-settings', label: 'XP & Badge', icon: Star },
      { value: '/admin/certificates', label: 'Sertifikat', icon: ScrollText },
      { value: '/admin/homepage-manager', label: 'Homepage', icon: Home },
    ]
  }
]

export default function AdminSidebar({ 
  isCollapsed, 
  toggleCollapse,
  isMobile,
  isMobileOpen,
  setIsMobileOpen
}: { 
  isCollapsed?: boolean, 
  toggleCollapse?: () => void,
  isMobile?: boolean,
  isMobileOpen?: boolean,
  setIsMobileOpen?: (val: boolean) => void
}) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  // Sidebar terbuka jika tidak dalam mode collapsed ATAU sedang di-hover
  // Pada mobile, sidebar terbuka HANYA jika isMobileOpen bernilai true
  const open = isMobile ? isMobileOpen : (!isCollapsed || isHovered)

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {}
    logout()
    router.push(ROUTES.LOGIN)
    toast.success('Berhasil keluar.')
  }

  return (
    <motion.aside
      className="dashboard-sidebar"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      animate={{ 
        width: isMobile ? 240 : (open ? 240 : 80),
        x: isMobile ? (isMobileOpen ? 0 : -240) : 0
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        background: 'var(--color-surface)',
        borderRight: '1px solid rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-6) 0 var(--space-4)',
        overflow: 'hidden',
        flexShrink: 0,
        ...(isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
        } : { height: '100vh' })
      }}
    >
      {/* Header / Logo */}
      <div style={{ 
        padding: '0 var(--space-4)', 
        marginBottom: 'var(--space-8)', 
        display: 'flex', 
        alignItems: 'center',
        width: 240,
        boxSizing: 'border-box'
      }}>
        <Link onClick={() => isMobile && setIsMobileOpen?.(false)} href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textDecoration: 'none', flex: 1, minWidth: 0 }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            background: 'var(--color-primary-light)',
            border: '1px solid var(--border-color)'
          }}>
            <img src="/images/logo.jpg" alt="Metro Institute" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <motion.div
            className="sidebar-logo"
            initial={false}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              fontWeight: 800,
              fontSize: '1.125rem',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              lineHeight: 1.1
            }}
          >
            <span>Metro</span>
            <span>Institute</span>
          </motion.div>
        </Link>
        
        <motion.div
          initial={false}
          animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
          style={{ 
            height: 32, 
            width: 32, 
            flexShrink: 0, 
            color: 'var(--color-text-tertiary)', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: open ? 'auto' : 'none'
          }}
        >
          <MenuToggle 
            open={!!isCollapsed} 
            onOpenChange={() => toggleCollapse && toggleCollapse()} 
          />
        </motion.div>
      </div>

      {/* Main Nav */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, display: 'grid' }}>
        {/* Expanded State */}
        <motion.div
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ 
            gridArea: '1 / 1', 
            width: 240, 
            pointerEvents: open ? 'auto' : 'none', 
            padding: '0 var(--space-2)',
            zIndex: open ? 2 : 1
          }}
        >
          <BranchedMenu
            items={branchItems as any}
            defaultOpen={[1, 2, 3, 4] as any} // Buka semua folder secara default
            defaultActive={pathname === '/admin' ? '' : pathname}
            onToggle={() => {}}
            onSelect={(value: any) => {
              router.push(value)
              if (isMobile && setIsMobileOpen) setIsMobileOpen(false)
            }}
            color="var(--color-text-primary)"
            accentColor="var(--color-primary)"
            lineColor="var(--color-border)"
            width={220}
            rowHeight={36}
            indent={32}
            trunk={12}
            radius={8}
            lineWidth={1.5}
            fontSize={14}
            drawDuration={400}
            foldDuration={300}
          />
        </motion.div>

        {/* Collapsed State Icons */}
        <motion.div
          initial={false}
          animate={{ opacity: !open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ 
            gridArea: '1 / 1', 
            width: 80, 
            pointerEvents: !open ? 'auto' : 'none', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 'var(--space-2)',
            paddingTop: 'var(--space-2)',
            zIndex: !open ? 2 : 1
          }}
        >
          {branchItems.map((group, idx) => {
            if (!group.children) {
              return (
                <Link key={idx} href={group.value as string} className="btn btn-ghost btn-sm" style={{ padding: 8, height: 40, width: 40 }}>
                  <group.icon size={20} color={pathname === group.value ? 'var(--color-primary)' : 'var(--color-text-primary)'} />
                </Link>
              )
            }
            return group.children.map((child, cIdx) => (
              <Link key={`${idx}-${cIdx}`} href={child.value} className="btn btn-ghost btn-sm" style={{ padding: 8, height: 40, width: 40 }}>
                <child.icon size={20} color={pathname.startsWith(child.value) ? 'var(--color-primary)' : 'var(--color-text-primary)'} />
              </Link>
            ))
          })}
        </motion.div>
      </div>

      {/* Bottom Area: User & Settings */}
      <div style={{ padding: 'var(--space-4)', marginTop: 'auto', borderTop: '1px solid var(--color-border)' }}>
        {user && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            width: 208, // Paksa lebar tetap (240 - 32px padding) agar tidak snap
            boxSizing: 'border-box'
          }}>
            <div className="avatar avatar-sm" style={{ flexShrink: 0, width: 36, height: 36, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} />
              ) : (
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              )}
            </div>
            
            <motion.div 
              initial={false}
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: open ? 'auto' : 'none' }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {user.name ? user.name.split(' ')[0] : 'Admin'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Admin Panel</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <Link href="/admin/settings" title="Pengaturan" style={{ color: 'var(--color-text-tertiary)', padding: '6px', borderRadius: 'var(--radius-md)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'var(--color-bg)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
                  <Settings size={16} />
                </Link>
                <button onClick={handleLogout} title="Keluar" style={{ color: 'var(--color-text-tertiary)', padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.background = 'var(--color-error-light)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
                  <LogOut size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}

