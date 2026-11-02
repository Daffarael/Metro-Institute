'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Video, Calendar, Clock, Search, ChevronRight, ArrowRight, Users
} from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, formatDate, formatRupiah, FIELD_LABELS } from '@/lib/utils'
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
  status?: 'OPEN' | 'CLOSED' | 'COMPLETED' | string
  isEnded?: boolean
  endedAt?: string | null
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
    { value: 'ALL', label: 'Jelajahi Inspire Talk' },
    { value: 'MY', label: 'Inspire Talk Saya', count: myWebinars.length },
  ]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: 4 }}>
          Inspire Talk
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
              placeholder="Cari Inspire Talk atau pembicara..."
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
              ? 'Kamu belum mendaftar ke sesi Inspire Talk manapun. Jelajahi sesi Inspire Talk mendatang dan daftar sekarang!'
              : 'Tidak ada Inspire Talk yang sesuai dengan pencarian atau filter yang dipilih.'
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
                Cari Inspire Talk
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

// Hanging Signboard Component - Identik dengan Bootcamp
function HangingSignboard({ status }: { status: string }) {
  const isOpen = status === 'OPEN'

  const config = isOpen
    ? {
        bg: '#063D2A',
        stroke: '#018556',
        subText: 'PENDAFTARAN',
        mainText: 'DIBUKA',
        subColor: '#D1FAE5',
      }
    : {
        bg: '#450A0A',
        stroke: '#DC2626',
        subText: 'PENDAFTARAN',
        mainText: 'DITUTUP',
        subColor: '#FECACA',
      }

  return (
    <motion.div
      animate={{ rotate: [-3.5, 3.5, -3.5] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      style={{ transformOrigin: '50% 6px' }}
      whileHover={{ scale: 1.05, rotate: 6, transition: { duration: 0.3 } }}
      className="origin-top select-none cursor-pointer drop-shadow-sm flex-shrink-0"
    >
      <svg
        width="92"
        height="46"
        viewBox="0 0 140 70"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Top Peg */}
        <circle cx="70" cy="6" r="4.5" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.2" />
        <circle cx="70" cy="6" r="1.8" fill="#9CA3AF" />

        {/* Strings */}
        <line x1="70" y1="6" x2="24" y2="22" stroke="#9CA3AF" strokeWidth="1.8" />
        <line x1="70" y1="6" x2="116" y2="22" stroke="#9CA3AF" strokeWidth="1.8" />

        {/* Board Outer */}
        <rect x="6" y="16" width="128" height="50" rx="6" fill={config.bg} stroke={config.stroke} strokeWidth="1.2" />

        {/* Board Inner Details (Silver border) */}
        <rect x="10" y="20" width="120" height="42" rx="4" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />

        {/* Corner Accents */}
        <path d="M 13 25 A 2.5 2.5 0 0 1 15.5 22.5" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />
        <path d="M 127 25 A 2.5 2.5 0 0 0 124.5 22.5" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />
        <path d="M 13 57 A 2.5 2.5 0 0 0 15.5 59.5" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />
        <path d="M 127 57 A 2.5 2.5 0 0 1 124.5 59.5" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />

        {/* Screws/Pegs */}
        <circle cx="24" cy="23" r="2.5" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="0.8" />
        <circle cx="24" cy="23" r="1" fill="#9CA3AF" />
        <circle cx="116" cy="23" r="2.5" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="0.8" />
        <circle cx="116" cy="23" r="1" fill="#9CA3AF" />

        {/* Subtitle */}
        <text
          x="70"
          y="34"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="7.5"
          fill={config.subColor}
          textAnchor="middle"
          fontWeight="bold"
          letterSpacing="1.2"
        >
          {config.subText}
        </text>

        {/* Main Text */}
        <text
          x="70"
          y="51"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="14"
          fill="#FFFFFF"
          textAnchor="middle"
          fontWeight="bold"
          letterSpacing="1.5"
        >
          {config.mainText}
        </text>
      </svg>
    </motion.div>
  )
}

function WebinarCard({
  webinar,
}: {
  webinar: WebinarItem
}) {
  const scheduledTime = new Date(webinar.scheduledAt).getTime()
  const isEnded = Boolean(webinar.isEnded) || (scheduledTime + 24 * 60 * 60 * 1000 < Date.now())
  const isFull = Boolean(webinar.quota && (webinar._count?.registrations || 0) >= webinar.quota)
  const isRegistrationClosed = webinar.status === 'CLOSED' || webinar.status === 'COMPLETED' || isEnded || isFull || Date.now() >= scheduledTime

  return (
    <Link
      href={ROUTES.WEBINAR_DETAIL(webinar.id)}
      style={{ textDecoration: 'none', display: 'block', height: '100%', color: 'inherit' }}
    >
      <div
        style={{
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--color-surface)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Thumbnail Area - 16:9 ratio */}
        <div style={{
          aspectRatio: '16/9',
          background: 'var(--color-bg)',
          borderRadius: '12px 12px 0 0',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
        }}>
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
              <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.9 }}>Inspire Talk</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Header Row: Field & Type (Left) · Hanging Signboard (Right) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 10,
            minHeight: 46,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}>
                {webinar.field ? (FIELD_LABELS[webinar.field] || webinar.field) : 'Inspire Talk'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--color-text-tertiary)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}>
                Live Session
              </span>
            </div>

            {/* Hanging Signboard - Right-aligned */}
            <HangingSignboard status={isRegistrationClosed ? 'CLOSED' : 'OPEN'} />
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: '15px',
            fontWeight: 700,
            lineHeight: 1.4,
            color: 'var(--color-text-primary)',
            margin: '0 0 6px 0',
            letterSpacing: '-0.01em',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {webinar.title}
          </h3>

          {/* Subtitle / Description */}
          {(webinar.shortDescription || webinar.description) && (
            <p style={{
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
              lineHeight: 1.5,
              margin: '0 0 12px 0',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {webinar.shortDescription || webinar.description}
            </p>
          )}

          {/* Speaker Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
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
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
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

          {/* Stats: Peserta, Tanggal, & Durasi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, marginTop: 'auto', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={13} color="var(--color-text-tertiary)" />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {webinar._count?.registrations || 0} Peserta
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} color="var(--color-text-tertiary)" />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {formatDate(webinar.scheduledAt)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color="var(--color-text-tertiary)" />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {webinar.duration}m
              </span>
            </div>
          </div>

          {/* Footer (Price & Action) — Identik dengan Bootcamp */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid var(--color-border-subtle)',
          }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {webinar.price === 0 ? 'Gratis' : formatRupiah(webinar.price)}
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '12px', fontWeight: 600,
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              padding: '6px 12px',
              borderRadius: 20,
            }}>
              Lihat Detail <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>

        </div>
      </div>
    </Link>
  )
}
