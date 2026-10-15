'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar, Clock, Users, Video, ChevronRight, CheckCircle2,
  ExternalLink, PlayCircle, Lock, Zap, Share2, X
} from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, formatDate, formatRupiah, FIELD_LABELS, ensureAbsoluteUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { CardTabs } from '@/components/ui/AnimatedTabs'

interface WebinarDetail {
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
  meetingUrl?: string | null
  recordingUrl?: string | null
  quota?: number
  isPublished: boolean
  isFeatured: boolean
  isRegistered?: boolean
  attended?: boolean
  isEnded?: boolean
  endedAt?: string | null
  benefits?: string[]
  _count?: { registrations: number }
  liveStatus?: 'UPCOMING' | 'LIVE' | 'ENDED'
  openTime?: string
  closeTime?: string
}

export default function MenteeWebinarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const { setSearchPlaceholder } = useUIStore()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'speaker'>('overview')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update clock every 15s to keep time-gate live and reactive
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  const { data: webinar, isLoading, error } = useQuery<WebinarDetail>({
    queryKey: ['webinar', id, user?.id],
    queryFn: () => api.get(`/webinars/${id}`).then((r) => r.data.data),
    retry: false,
    enabled: !!id,
  })

  // Sync Search Placeholder with Bootcamp style
  useEffect(() => {
    if (webinar) {
      setSearchPlaceholder(`Webinar / ${webinar.title}`)
    }
    return () => setSearchPlaceholder(null)
  }, [webinar, setSearchPlaceholder])

  // Mutasi Pendaftaran Gratis
  const registerMutation = useMutation({
    mutationFn: () => api.post(`/webinars/${id}/register`),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Pendaftaran webinar berhasil!')
      setShowConfirmModal(false)
      queryClient.invalidateQueries({ queryKey: ['webinar', id] })
      queryClient.invalidateQueries({ queryKey: ['webinars'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mendaftar ke webinar')
    },
  })

  // Alur Berbayar (Checkout / Midtrans Snap)
  const handlePaidCheckout = () => {
    if (!user) {
      toast.info('Silakan login terlebih dahulu untuk membeli tiket.')
      router.push('/login')
      return
    }

    api.post('/transactions/initiate', {
      productType: 'WEBINAR',
      webinarId: id,
    })
      .then((res) => {
        const snapToken = res.data.data?.snapToken
        if (snapToken && (window as any).snap) {
          (window as any).snap.pay(snapToken, {
            onSuccess: () => {
              toast.success('Pembayaran tiket webinar berhasil!')
              queryClient.invalidateQueries({ queryKey: ['webinar', id] })
              queryClient.invalidateQueries({ queryKey: ['webinars'] })
            },
            onPending: () => {
              toast.info('Menunggu pembayaran...')
              router.push('/mentee/transactions')
            },
            onError: () => toast.error('Pembayaran gagal atau dibatalkan'),
          })
        } else {
          router.push(`/mentee/checkout?type=webinar&id=${id}`)
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Gagal memulai transaksi tiket')
      })
  }

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!webinar?.scheduledAt) return '#'
    const start = new Date(webinar.scheduledAt)
    const end = new Date(start.getTime() + (webinar.duration || 90) * 60 * 1000)
    const pad = (n: number) => (n < 10 ? '0' + n : n)
    const formatIso = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
    const dates = `${formatIso(start)}/${formatIso(end)}`
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(webinar.title)}&details=${encodeURIComponent(webinar.description || '')}&dates=${dates}`
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 300, borderRadius: 16, marginBottom: 'var(--space-6)' }} />
        <div className="detail-layout-grid" style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
          </div>
          <div className="skeleton" style={{ height: 380, borderRadius: 16 }} />
        </div>
      </div>
    )
  }

  if (error || !webinar) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }} className="animate-fade-in">
        <div style={{ padding: '40px 24px', background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 16 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Webinar Tidak Ditemukan
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            Sesi webinar mungkin telah dihapus atau tautan tidak valid.
          </p>
          <Link href={ROUTES.WEBINAR_LIST}>
            <button style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              Kembali ke Daftar Webinar
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Perhitungan Time-Gate Fleksibel & Cerdas ─────────────────────────────
  const scheduledStart = new Date(webinar.scheduledAt)
  const durationMin = webinar.duration || 90
  const scheduledEnd = new Date(scheduledStart.getTime() + durationMin * 60 * 1000)
  const openTime = new Date(scheduledStart.getTime() - 30 * 60 * 1000) // Ruang tunggu dibuka 30 menit sebelum sesi

  // Sesi dinyatakan Selesai JIKA diakhiri manual oleh admin (isEnded = true / liveStatus = 'ENDED')
  // ATAU fallback pengaman 24 jam setelah waktu jadwal
  const isEnded = Boolean(webinar.isEnded) || webinar.liveStatus === 'ENDED' || currentTime > (scheduledStart.getTime() + 24 * 60 * 60 * 1000)
  const isUpcoming = !isEnded && currentTime < openTime.getTime()
  const isLiveWindow = !isEnded && currentTime >= openTime.getTime()
  // Overtime: Sesi melewati jadwal durasi awal, namun admin belum mengakhiri sesi (masih diskusi/Q&A)
  const isOvertime = isLiveWindow && currentTime > scheduledEnd.getTime()
  const isFree = webinar.price === 0
  const isFull = !!webinar.quota && (webinar._count?.registrations || 0) >= webinar.quota

  // Waktu berakhir aktual sesuai saat admin klik selesaikan (atau fallback durasi jadwal)
  const actualEndTime = webinar.endedAt
    ? new Date(webinar.endedAt)
    : scheduledEnd

  const formatTimeOnly = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }

  const getTimeUntilOpen = () => {
    const diffMs = openTime.getTime() - currentTime
    if (diffMs <= 0) return null
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} hari lagi`
    }
    if (diffHours > 0) {
      return `${diffHours} jam ${diffMinutes} menit lagi`
    }
    return `${diffMinutes} menit lagi`
  }

  const timeUntilOpen = getTimeUntilOpen()

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }} className="animate-fade-in">
      {/* Main layout (Mirip Bootcamp) */}
      <div className="detail-layout-grid" style={{ display: 'grid', gap: 48 }}>
        
        {/* ── LEFT COLUMN ───────────────────────────────────── */}
        <div>
          {/* Hero */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            {/* Breadcrumb */}
            <nav style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 28, fontSize: '13px',
              color: 'var(--color-text-tertiary)',
            }}>
              <Link href={ROUTES.WEBINAR_LIST} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                Webinar
              </Link>
              <ChevronRight size={13} strokeWidth={1.5} />
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {webinar.title}
              </span>
            </nav>

            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {webinar.field ? (FIELD_LABELS[webinar.field] || webinar.field) : 'Live Learning'}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--color-border)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                Live Workshop
              </span>
              <span style={{ fontSize: '14px', color: 'var(--color-border)' }}>•</span>
              <span style={{
                fontSize: '12px', fontWeight: 600,
                color: isEnded
                  ? 'var(--color-text-secondary)'
                  : isOvertime
                    ? '#D97706'
                    : isLiveWindow
                      ? 'var(--color-primary)'
                      : isFull
                        ? '#DC2626'
                        : 'var(--color-primary)',
              }}>
                {isEnded
                  ? 'Sesi Selesai'
                  : isOvertime
                    ? 'Live Berlangsung (Waktu Tambahan)'
                    : isLiveWindow
                      ? 'Live Berlangsung'
                      : isFull
                        ? 'Kuota Penuh'
                        : 'Pendaftaran Dibuka'}
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '28px', fontWeight: 800, lineHeight: 1.25,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em', marginBottom: 14,
            }}>
              {webinar.title}
            </h1>

            {webinar.shortDescription && (
              <p style={{
                fontSize: '15px', color: 'var(--color-text-secondary)',
                lineHeight: 1.6, marginBottom: 24,
              }}>
                {webinar.shortDescription}
              </p>
            )}

            {/* Meta strip */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              gap: 20, marginBottom: 32,
              paddingBottom: 24,
              borderBottom: '1px solid var(--color-border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                <Users size={13} strokeWidth={1.5} />
                <span>{webinar._count?.registrations || 0} peserta</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                <Clock size={13} strokeWidth={1.5} />
                <span>{webinar.duration}m ({formatTimeOnly(scheduledStart)} – {formatTimeOnly(scheduledEnd)} WIB)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                <Calendar size={13} strokeWidth={1.5} />
                <span>{formatDate(webinar.scheduledAt)}</span>
              </div>
            </div>
          </div>

          {/* CardTabs — browser-tab style persis Bootcamp */}
          <CardTabs
            items={[
              { id: 'overview', label: 'Overview' },
              { id: 'schedule', label: 'Jadwal & Akses' },
              { id: 'speaker', label: 'Narasumber' },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as 'overview' | 'schedule' | 'speaker')}
          >
            {activeTab === 'overview' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {webinar.speakerName && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border-subtle)',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '16px', overflow: 'hidden', flexShrink: 0
                    }}>
                      {webinar.speakerAvatarUrl ? (
                        <img src={webinar.speakerAvatarUrl} alt={webinar.speakerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        webinar.speakerName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 3 }}>Narasumber</div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>{webinar.speakerName}</div>
                      {webinar.speakerRole && <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{webinar.speakerRole}</div>}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {webinar.speakerName && webinar.description && <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />}

                {webinar.description && (
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>Tentang Webinar</h2>
                    <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>
                      {webinar.description}
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Yang akan kamu dapatkan</h2>
                  <div className="grid-cols-2" style={{ display: 'grid', gap: '8px 16px' }}>
                    {(webinar.benefits && webinar.benefits.length > 0 ? webinar.benefits : [
                      'Sertifikat Digital Resmi Metro Institute',
                      'Sesi Tanya Jawab Langsung Bersama Narasumber',
                      'Wawasan & Studi Kasus Praktik Nyata Industri',
                      'Akses Jejaring & Diskusi Bersama Komunitas',
                    ]).map((outcome, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        <CheckCircle2 size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Waktu & Tempat */}
                <div style={{
                  padding: '18px 20px', borderRadius: 12,
                  background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)',
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                    Informasi Waktu & Tempat
                  </h3>
                  <div style={{ display: 'grid', gap: 10, fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Calendar size={15} color="var(--color-primary)" />
                      <span><strong>Hari, Tanggal:</strong> {formatDate(webinar.scheduledAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Clock size={15} color="var(--color-primary)" />
                      <span><strong>Waktu:</strong> {formatTimeOnly(scheduledStart)} – {formatTimeOnly(isEnded ? actualEndTime : scheduledEnd)} WIB ({webinar.duration} Menit)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Video size={15} color="var(--color-primary)" />
                      <span><strong>Platform:</strong> Online Live Stream (Zoom / Google Meet)</span>
                    </div>
                  </div>
                </div>

                {/* Section Akses Meeting Ketat */}
                {webinar.isRegistered ? (
                  isUpcoming ? (
                    /* KONDISI 1: BELUM WAKTUNYA (UPCOMING) */
                    <div style={{
                      padding: '20px', borderRadius: 12,
                      background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)',
                      display: 'flex', flexDirection: 'column', gap: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-tertiary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Clock size={16} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                            Ruang Sesi Belum Dibuka
                          </h3>
                          <p style={{ fontSize: '12.5px', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
                            Dibuka otomatis 30 menit sebelum acara ({formatTimeOnly(openTime)} WIB)
                          </p>
                        </div>
                      </div>

                      <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                        Tautan Google Meet / Zoom akan otomatis aktif di halaman ini mulai pukul <strong>{formatTimeOnly(openTime)} WIB</strong> {timeUntilOpen ? `(${timeUntilOpen})` : ''}. Silakan simpan jadwal ke kalender agar Anda mendapatkan pengingat saat sesi dimulai.
                      </p>

                      <div>
                        <a
                          href={getGoogleCalendarUrl()}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: 'none', display: 'inline-block' }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              padding: '10px 18px', borderRadius: 8,
                              background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border-subtle)',
                              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                            }}
                          >
                            <Calendar size={15} /> Simpan ke Google Calendar
                          </motion.div>
                        </a>
                      </div>
                    </div>
                  ) : isLiveWindow ? (
                    /* KONDISI 2: SEDANG BERLANGSUNG / SIAP MASUK (LIVE / OVERTIME) */
                    <div style={{
                      padding: '20px', borderRadius: 12,
                      background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)',
                      display: 'flex', flexDirection: 'column', gap: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: isOvertime ? 'rgba(217, 119, 6, 0.1)' : 'rgba(1, 133, 86, 0.08)',
                          color: isOvertime ? '#D97706' : 'var(--color-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <CheckCircle2 size={18} strokeWidth={2} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                              {isOvertime ? 'Ruang Sesi Masih Aktif' : 'Ruang Sesi Telah Dibuka'}
                            </h3>
                            <span style={{
                              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                              background: isOvertime ? '#D97706' : 'var(--color-primary)', color: '#fff',
                            }}>
                              {isOvertime ? 'WAKTU TAMBAHAN' : 'LIVE'}
                            </span>
                          </div>
                          <p style={{ fontSize: '12.5px', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
                            {isOvertime
                              ? 'Sesi melewati estimasi durasi awal, namun diskusi & Q&A masih berlangsung aktif.'
                              : 'Sesi sedang berlangsung via Google Meet / Zoom'}
                          </p>
                        </div>
                      </div>

                      <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                        {isOvertime
                          ? 'Acara masih berlangsung. Anda tetap dapat masuk atau bergabung kembali ke ruang sesi kapan saja melalui tombol di bawah.'
                          : 'Ruang sesi webinar telah siap. Silakan klik tombol di bawah untuk langsung bergabung ke ruang sesi bersama narasumber.'}
                      </p>

                      {webinar.meetingUrl && (
                        <div>
                          <a
                            href={ensureAbsoluteUrl(webinar.meetingUrl)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ textDecoration: 'none', display: 'inline-block' }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '12px 24px', borderRadius: 8,
                                background: isOvertime ? '#D97706' : 'var(--color-primary)', color: '#fff',
                                fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                              }}
                            >
                              <PlayCircle size={16} strokeWidth={2} /> Masuk Ruang Sesi Sekarang
                            </motion.div>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* KONDISI 3: SESI TELAH SELESAI (ENDED) */
                    <div style={{
                      padding: '20px', borderRadius: 12,
                      background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)',
                      display: 'flex', flexDirection: 'column', gap: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-tertiary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <CheckCircle2 size={18} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                            Sesi Webinar Telah Selesai
                          </h3>
                          <p style={{ fontSize: '12.5px', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
                            Berakhir pada {formatDate(actualEndTime.toISOString())} pukul {formatTimeOnly(actualEndTime)} WIB
                          </p>
                        </div>
                      </div>

                      <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                        {webinar.recordingUrl
                          ? 'Sesi live streaming untuk webinar ini telah berakhir. Anda dapat menyaksikan kembali video rekaman pembahasannya di bawah ini.'
                          : 'Sesi live streaming untuk webinar ini telah berakhir. Terima kasih telah berpartisipasi! Rekaman materi dan sertifikat akan segera diperbarui jika telah siap.'}
                      </p>

                      {webinar.recordingUrl && (
                        <div>
                          <a
                            href={ensureAbsoluteUrl(webinar.recordingUrl)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ textDecoration: 'none', display: 'inline-block' }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '12px 24px', borderRadius: 8,
                                background: 'var(--color-primary)', color: '#fff',
                                fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                              }}
                            >
                              <PlayCircle size={16} strokeWidth={2} /> Tonton Rekaman Webinar
                            </motion.div>
                          </a>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  /* Belum Terdaftar */
                  <div style={{
                    padding: '20px', borderRadius: 12,
                    background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Lock size={16} color="var(--color-text-tertiary)" strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Tautan Live Room Terkunci
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
                        Daftarkan diri kamu pada webinar ini untuk mendapatkan akses tautan live room dan sertifikat.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'speaker' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{
                  padding: '20px', borderRadius: 12,
                  background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)',
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '20px', overflow: 'hidden', flexShrink: 0
                  }}>
                    {webinar.speakerAvatarUrl ? (
                      <img src={webinar.speakerAvatarUrl} alt={webinar.speakerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      webinar.speakerName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                      {webinar.speakerName}
                    </h3>
                    {webinar.speakerRole && (
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 500 }}>
                        {webinar.speakerRole}
                      </div>
                    )}
                    <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '12px 0 0' }}>
                      Praktisi industri yang berdedikasi untuk membagikan pengalaman, strategi kerja nyata, dan bimbingan interaktif kepada para pembelajar di Metro Institute.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardTabs>
        </div>

        {/* ── RIGHT (Purchase Card 1:1 Mirip Bootcamp) ───── */}
        <div style={{ position: 'sticky', top: 32, alignSelf: 'start' }}>
          <div style={{
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 12, overflow: 'hidden',
            background: 'var(--color-surface)',
          }}>
            {/* Thumbnail */}
            <div style={{
              height: 160, background: 'var(--color-bg)',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {webinar.bannerUrl ? (
                <img src={webinar.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Video size={40} color="var(--color-border)" strokeWidth={1} />
              )}
            </div>

            <div style={{ padding: '20px' }}>
              {/* Price */}
              <div style={{
                fontSize: '26px', fontWeight: 800,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: 16,
              }}>
                {isFree ? 'Gratis' : formatRupiah(webinar.price)}
              </div>

              {/* CTA dengan Logika Waktu Ketat */}
              {webinar.isRegistered ? (
                isUpcoming ? (
                  /* Terdaftar tapi BELUM WAKTUNYA */
                  <div>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setActiveTab('schedule')
                        toast.info(`Ruang sesi akan dibuka otomatis 30 menit sebelum jadwal (pukul ${formatTimeOnly(openTime)} WIB). Sesi mulai pukul ${formatTimeOnly(scheduledStart)} WIB.`)
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', padding: '12px 0',
                        background: 'var(--color-bg)', color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 8, fontWeight: 700, fontSize: '13.5px',
                        cursor: 'pointer',
                      }}
                    >
                      <Lock size={15} strokeWidth={2} /> Dibuka {formatTimeOnly(openTime)} WIB
                    </motion.div>
                    <div style={{ textAlign: 'center', marginTop: 6, fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      Ruang buka 30 menit sebelum mulai ({formatTimeOnly(scheduledStart)} WIB)
                    </div>
                  </div>
                ) : isLiveWindow ? (
                  /* Terdaftar dan SEDANG BERLANGSUNG */
                  webinar.meetingUrl ? (
                    <div>
                      <a href={ensureAbsoluteUrl(webinar.meetingUrl)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '12px 0',
                            background: isOvertime ? '#D97706' : 'var(--color-primary)', color: '#fff',
                            borderRadius: 8, fontWeight: 700, fontSize: '14px',
                          }}
                        >
                          <PlayCircle size={16} strokeWidth={2} /> Masuk Live Room Sekarang
                        </motion.div>
                      </a>
                      {isOvertime && (
                        <div style={{ textAlign: 'center', marginTop: 8, fontSize: '11.5px', color: '#D97706', fontWeight: 500 }}>
                          Sesi sedang berlangsung (waktu tambahan / Q&A)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('schedule')}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          width: '100%', padding: '12px 0',
                          background: isOvertime ? '#D97706' : 'var(--color-primary)', color: '#fff',
                          borderRadius: 8, fontWeight: 700, fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        <PlayCircle size={16} strokeWidth={2} /> Masuk Live Room
                      </motion.div>
                      {isOvertime && (
                        <div style={{ textAlign: 'center', marginTop: 8, fontSize: '11.5px', color: '#D97706', fontWeight: 500 }}>
                          Sesi sedang berlangsung (waktu tambahan / Q&A)
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  /* Terdaftar dan SESI TELAH SELESAI */
                  webinar.recordingUrl ? (
                    <a href={ensureAbsoluteUrl(webinar.recordingUrl)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          width: '100%', padding: '12px 0',
                          background: 'var(--color-primary)', color: '#fff',
                          borderRadius: 8, fontWeight: 700, fontSize: '14px',
                        }}
                      >
                        <PlayCircle size={16} strokeWidth={2} /> Tonton Rekaman Sesi
                      </motion.div>
                    </a>
                  ) : (
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', padding: '12px 0',
                        background: 'var(--color-bg)', color: 'var(--color-text-tertiary)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 8, fontWeight: 700, fontSize: '14px',
                        cursor: 'default',
                      }}
                    >
                      <CheckCircle2 size={16} strokeWidth={2} /> Sesi Telah Selesai
                    </div>
                  )
                )
              ) : isEnded ? (
                /* Belum Terdaftar tapi Sesi sudah selesai */
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '12px 0',
                    background: 'var(--color-bg)', color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 8, fontWeight: 700, fontSize: '14px',
                    cursor: 'not-allowed',
                  }}
                >
                  <Lock size={16} strokeWidth={2} /> Sesi Selesai
                </div>
              ) : isFull ? (
                /* Kuota Penuh */
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '12px 0',
                    background: 'var(--color-bg)', color: '#dc2626',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 8, fontWeight: 700, fontSize: '14px',
                    cursor: 'not-allowed',
                  }}
                >
                  <Lock size={16} strokeWidth={2} /> Kuota Penuh
                </div>
              ) : isFree ? (
                /* Belum Terdaftar: Gratis */
                <motion.button
                  whileHover={!registerMutation.isPending ? { scale: 1.02 } : {}}
                  whileTap={!registerMutation.isPending ? { scale: 0.98 } : {}}
                  onClick={() => {
                    if (!user) {
                      toast.info('Silakan login terlebih dahulu untuk mendaftar.')
                      router.push('/login')
                      return
                    }
                    setShowConfirmModal(true)
                  }}
                  disabled={registerMutation.isPending}
                  style={{
                    width: '100%', padding: '12px 0',
                    background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: '14px',
                    cursor: registerMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: registerMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {registerMutation.isPending ? 'Memproses...' : 'Daftar Sekarang'}
                </motion.button>
              ) : (
                /* Belum Terdaftar: Berbayar */
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePaidCheckout}
                  style={{
                    width: '100%', padding: '12px 0',
                    background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Daftar Sekarang
                </motion.button>
              )}

              {/* Secondary CTAs (Share button) */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'var(--color-surface)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0', fontSize: '13px', fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 8, cursor: 'pointer',
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    toast.success('Link webinar disalin!')
                  }}
                >
                  <Share2 size={14} strokeWidth={1.5} />
                  Bagikan
                </motion.button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '18px 0' }} />

              {/* FASILITAS WEBINAR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{
                  fontSize: '12px', fontWeight: 700, color: 'var(--color-text-tertiary)',
                  letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 4px',
                }}>
                  Fasilitas Webinar
                </p>
                {[
                  { icon: Zap,      text: 'XP dari setiap sesi', color: 'var(--color-xp)' },
                  { icon: Users,    text: `${webinar._count?.registrations || 0} peserta terdaftar`, color: 'var(--color-text-tertiary)' },
                  { icon: Clock,    text: `${webinar.duration}m durasi sesi`, color: 'var(--color-text-tertiary)' },
                  isEnded ? {
                    icon: Calendar,
                    text: `Berakhir: ${formatDate(actualEndTime.toISOString())}, ${formatTimeOnly(actualEndTime)} WIB`,
                    color: 'var(--color-text-tertiary)',
                  } : {
                    icon: Calendar,
                    text: `Mulai: ${formatDate(webinar.scheduledAt)}, ${formatTimeOnly(scheduledStart)} WIB`,
                    color: 'var(--color-text-tertiary)',
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <item.icon size={14} strokeWidth={1.5} color={item.color} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL KONFIRMASI PENDAFTARAN GRATIS ──────────────── */}
      <AnimatePresence>
        {showConfirmModal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
            backdropFilter: 'blur(3px)',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 16,
                maxWidth: 440, width: '100%',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Konfirmasi Pendaftaran
                </h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                Kamu akan mendaftar ke webinar <strong>"{webinar.title}"</strong> tanpa dipungut biaya. Akses ruang sesi akan langsung tercatat di akunmu.
              </p>

              <div style={{
                padding: 12, borderRadius: 10,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '12px', color: 'var(--color-text-secondary)',
                marginBottom: 20,
              }}>
                <div><strong>Jadwal:</strong> {formatDate(webinar.scheduledAt)} ({formatTimeOnly(scheduledStart)} WIB)</div>
                <div style={{ marginTop: 4 }}><strong>Narasumber:</strong> {webinar.speakerName}</div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  style={{
                    flex: 1, padding: '10px 14px',
                    borderRadius: 8, background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending}
                  style={{
                    flex: 1, padding: '10px 14px',
                    borderRadius: 8, background: 'var(--color-primary)',
                    border: 'none', color: '#fff',
                    fontSize: '13px', fontWeight: 600,
                    cursor: registerMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: registerMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {registerMutation.isPending ? 'Mendaftarkan...' : 'Konfirmasi & Daftar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
