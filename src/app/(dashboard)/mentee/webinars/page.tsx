'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Video, Calendar, Clock, Search, ChevronRight
} from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, formatDate, formatRupiah } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { SlidingTabs } from '@/components/ui/SlidingTabs'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface WebinarItem {
  id: string
  title: string
  shortDescription?: string
  description: string
  speakerName: string
  speakerRole?: string
  speakerAvatarUrl?: string
  field?: string
  price: number
  bannerUrl?: string
  scheduledAt: string
  duration: number
  meetingUrl?: string
  recordingUrl?: string
  quota?: number
  isPublished: boolean
  isFeatured: boolean
  isRegistered?: boolean
  attended?: boolean
  isEnded?: boolean
  _count?: { registrations: number }
}

const SCHEDULE_OPTIONS = [
  { value: 'UPCOMING', label: 'Akan Datang' },
  { value: 'PAST', label: 'Selesai' },
]

export default function MenteeWebinarsPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'ALL' | 'MY'>('ALL')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [scheduleStatus, setScheduleStatus] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Query: All published webinars
  const { data: allWebinars = [], isLoading: loadingAll } = useQuery<WebinarItem[]>({
    queryKey: ['webinars', { search: debouncedSearch, status: scheduleStatus }],
    queryFn: () =>
      api.get('/webinars', {
        params: {
          search: debouncedSearch || undefined,
          status: scheduleStatus,
        },
      }).then(r => r.data.data),
    staleTime: 30_000,
  })

  // Query: Registered webinars by mentee
  const { data: myWebinars = [], isLoading: loadingMy } = useQuery<WebinarItem[]>({
    queryKey: ['webinars', 'my', 'registered'],
    queryFn: () => api.get('/webinars/my/registered').then(r => r.data.data),
    staleTime: 30_000,
    enabled: Boolean(user),
  })

  const displayedWebinars = activeTab === 'ALL' ? allWebinars : myWebinars

  const tabItems = [
    { value: 'ALL', label: 'Jelajahi Webinar' },
    { value: 'MY', label: 'Webinar Saya', count: myWebinars.length },
  ]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: 4 }}>
          Webinar & Workshop
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', margin: 0 }}>
          Ikuti sesi interaktif live streaming bersama mentor dan pakar industri teknologi. Diskusikan studi kasus nyata, tren terkini, dan tanyakan langsung kendalamu.
        </p>
      </div>

      {/* ── Sliding Tabs ──────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <SlidingTabs
          items={tabItems}
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'ALL' | 'MY')}
        />
      </div>

      {/* ── Search & Filter Controls ──────────────────────── */}
      {activeTab === 'ALL' && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 360 }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari webinar atau pembicara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 34px', borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                fontSize: '13px', color: 'var(--color-text-primary)', outline: 'none',
              }}
            />
          </div>

          <CleanCombobox
            options={SCHEDULE_OPTIONS}
            value={scheduleStatus}
            onChange={setScheduleStatus}
            placeholder="Semua Jadwal"
            width={170}
          />
        </div>
      )}

      {/* ── Webinar Cards Grid ────────────────────────────── */}
      {loadingAll && activeTab === 'ALL' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 'var(--space-5)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 160, borderRadius: 0 }} />
              <div style={{ padding: 18 }}>
                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 18, width: '85%', marginBottom: 8, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 34, width: '100%', borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : displayedWebinars.length === 0 ? (
        <AdminEmptyState
          type="empty"
          message={
            activeTab === 'MY'
              ? 'Kamu belum mendaftar ke webinar manapun. Jelajahi sesi webinar mendatang dan daftar sekarang!'
              : 'Tidak ada webinar yang sesuai dengan pencarian atau filter yang dipilih.'
          }
          action={
            activeTab === 'MY' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('ALL')}
                style={{
                  padding: '9px 18px', borderRadius: 8, background: 'var(--color-primary)',
                  color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                }}
              >
                Cari Webinar
              </motion.button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
          {displayedWebinars.map((webinar) => (
            <WebinarCard
              key={webinar.id}
              webinar={webinar}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WebinarCard({
  webinar,
}: {
  webinar: WebinarItem
}) {
  const isEnded = Boolean(webinar.isEnded) || (new Date(webinar.scheduledAt).getTime() + 24 * 60 * 60 * 1000 < Date.now())

  return (
    <Link
      href={ROUTES.WEBINAR_DETAIL(webinar.id)}
      style={{ textDecoration: 'none', display: 'block', height: '100%', color: 'inherit' }}
    >
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          background: 'var(--color-surface)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          cursor: 'pointer',
          height: '100%',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'
          e.currentTarget.style.borderColor = 'var(--color-primary)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }}
      >
      {/* Banner / Poster Thumbnail */}
      <div style={{ position: 'relative', height: 150, background: 'linear-gradient(135deg, #064e3b 0%, #1e293b 100%)', overflow: 'hidden' }}>
        {webinar.bannerUrl ? (
          <img
            src={webinar.bannerUrl}
            alt={webinar.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
            color: '#fff', flexDirection: 'column', gap: 6,
          }}>
            <Video size={36} opacity={0.8} />
            <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.9 }}>Live Workshop</span>
          </div>
        )}

        {/* Price / Gratis Badge — top-left corner styled like Bootcamp */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          padding: '4px 10px',
          background: webinar.price === 0 ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)',
          borderRadius: '15px 0 8px 0',
          fontSize: '11px',
          fontFamily: 'var(--font-reggae-one)',
          color: '#fff',
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
          zIndex: 2,
          lineHeight: 1.4,
        }}>
          {webinar.price === 0 ? 'Gratis' : formatRupiah(webinar.price)}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
        {/* Title */}
        <div>
          <h3 style={{
            fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)',
            lineHeight: 1.35, marginBottom: 4, display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 38,
          }}>
            {webinar.title}
          </h3>
          <p style={{
            fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {webinar.shortDescription || webinar.description}
          </p>
        </div>

        {/* Speaker Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '11px', overflow: 'hidden', flexShrink: 0,
          }}>
            {webinar.speakerAvatarUrl ? (
              <img src={webinar.speakerAvatarUrl} alt={webinar.speakerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              webinar.speakerName.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {webinar.speakerName}
            </div>
            {webinar.speakerRole && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {webinar.speakerRole}
              </div>
            )}
          </div>
        </div>

        {/* Schedule & Duration */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 10, borderTop: '1px solid var(--color-border-subtle)',
          fontSize: '11px', color: 'var(--color-text-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} color="#64748b" /> {formatDate(webinar.scheduledAt)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} color="#64748b" /> {webinar.duration}m
          </div>
        </div>

        {/* Action Button: Visual CTA (Navigasi ditangani oleh Link pembungkus card) */}
        <div style={{ paddingTop: 4 }}>
          <div
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              background: isEnded ? 'var(--color-bg)' : 'var(--color-primary)',
              color: isEnded ? 'var(--color-text-tertiary)' : '#fff',
              border: isEnded ? '1px solid var(--color-border-subtle)' : 'none',
              fontWeight: 600, fontSize: '12px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            {isEnded
              ? 'Lihat Detail Sesi'
              : webinar.isRegistered
                ? 'Akses Sesi ›'
                : webinar.price === 0
                  ? 'Daftar Gratis ›'
                  : `Beli Tiket (${formatRupiah(webinar.price)})`}
          </div>
        </div>
      </div>
    </div>
  </Link>
)
}
