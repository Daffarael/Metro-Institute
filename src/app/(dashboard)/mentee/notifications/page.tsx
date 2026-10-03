'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Trash2, BookOpen, Award, Zap, CreditCard, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useNotifStore } from '@/stores/auth.store'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data?: Record<string, string>
  isRead: boolean
  createdAt: string
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  TRANSACTION_SUCCESS: <CreditCard size={18} color="var(--color-primary)" />,
  CERTIFICATE_ISSUED: <Award size={18} color="#8B5CF6" />,
  BADGE_UPGRADE: <Zap size={18} color="var(--color-xp)" />,
  SESSION_COMPLETE: <BookOpen size={18} color="var(--color-primary)" />,
  INFO: <Info size={18} color="var(--color-text-secondary)" />,
}

const NOTIF_BG: Record<string, string> = {
  TRANSACTION_SUCCESS: 'var(--color-primary-light)',
  CERTIFICATE_ISSUED: '#EDE9FE',
  BADGE_UPGRADE: 'var(--color-xp-bg)',
  SESSION_COMPLETE: 'var(--color-primary-light)',
  INFO: 'var(--color-border-subtle)',
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { resetUnread } = useNotifStore()

  const { data, isLoading } = useQuery<{ data: Notification[]; meta: { unreadCount: number } }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    onSuccess: () => resetUnread(),
  })

  const readAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      resetUnread()
    },
  })

  const readOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notifikasi dihapus')
    },
  })

  const notifications = data?.data || []
  const unreadCount = data?.meta?.unreadCount || 0

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Notifikasi</h1>
          {unreadCount > 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {unreadCount} notifikasi belum dibaca
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            className="btn btn-secondary btn-sm"
            style={{ gap: 'var(--space-2)' }}
          >
            <CheckCheck size={15} /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell className="empty-state-icon" />
          <p className="empty-state-title">Belum ada notifikasi</p>
          <p className="empty-state-desc">Notifikasi aktivitas belajarmu akan muncul di sini.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {notifications.map((notif, idx) => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && readOneMutation.mutate(notif.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)',
                padding: 'var(--space-4) var(--space-5)',
                background: notif.isRead ? 'var(--color-surface)' : 'var(--color-primary-xlight)',
                borderBottom: idx < notifications.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                cursor: notif.isRead ? 'default' : 'pointer',
                transition: 'background var(--transition-fast)',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-full)',
                background: NOTIF_BG[notif.type] || 'var(--color-border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {NOTIF_ICONS[notif.type] || <Info size={18} />}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{ fontWeight: notif.isRead ? 500 : 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    {notif.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: idLocale })}
                    </span>
                    {!notif.isRead && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 2, lineHeight: 'var(--leading-relaxed)' }}>
                  {notif.body}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id) }}
                style={{
                  flexShrink: 0, padding: 'var(--space-1)', color: 'var(--color-text-tertiary)',
                  transition: 'color var(--transition-fast)', cursor: 'pointer',
                  background: 'none', border: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
