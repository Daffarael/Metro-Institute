'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import {
  Video, Calendar, Clock, Users, Search, CheckCircle2,
  ExternalLink, Sparkles, AlertCircle, PlayCircle, X, Share2,
  BookOpen, ChevronRight
} from 'lucide-react'
import api from '@/lib/axios'
import { formatDate, formatRupiah, FIELD_LABELS } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { SlidingTabs } from '@/components/ui/SlidingTabs'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'

interface WebinarItem {
  id: string
  title: string
  shortDescription?: string
  description: string
  speakerName: string
  speakerRole?: string
  speakerAvatarUrl?: string
  field: string
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
  _count?: { registrations: number }
}

const FIELD_OPTIONS = [
  { value: '', label: 'Semua Bidang' },
  { value: 'UI_UX', label: FIELD_LABELS['UI_UX'] },
  { value: 'FRONTEND', label: FIELD_LABELS['FRONTEND'] },
  { value: 'BACKEND', label: FIELD_LABELS['BACKEND'] },
  { value: 'MOBILE', label: FIELD_LABELS['MOBILE'] },
]

const SCHEDULE_OPTIONS = [
  { value: 'ALL', label: 'Semua Jadwal' },
  { value: 'UPCOMING', label: 'Akan Datang' },
  { value: 'PAST', label: 'Selesai' },
]

export default function MenteeWebinarsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<'ALL' | 'MY'>('ALL')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [field, setField] = useState('')
  const [scheduleStatus, setScheduleStatus] = useState('ALL')
  const [selectedWebinar, setSelectedWebinar] = useState<WebinarItem | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Query: All published webinars
  const { data: allWebinars = [], isLoading: loadingAll } = useQuery<WebinarItem[]>({
    queryKey: ['webinars', { search: debouncedSearch, field, status: scheduleStatus }],
    queryFn: () =>
      api.get('/webinars', {
        params: {
          search: debouncedSearch || undefined,
          field: field || undefined,
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

  // Register mutation (for free webinars or direct registration)
  const registerMutation = useMutation({
    mutationFn: (webinarId: string) => api.post(`/webinars/${webinarId}/register`),
    onSuccess: (res, webinarId) => {
      toast.success(res.data.message || 'Berhasil mendaftar ke webinar!')
      qc.invalidateQueries({ queryKey: ['webinars'] })
      qc.invalidateQueries({ queryKey: ['webinars', 'my', 'registered'] })
      if (selectedWebinar?.id === webinarId) {
        setSelectedWebinar(prev => prev ? { ...prev, isRegistered: true } : null)
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mendaftar webinar')
    },
  })

  const handleRegisterOrPay = (webinar: WebinarItem) => {
    if (!user) {
      toast.info('Silakan login terlebih dahulu')
      router.push('/login')
      return
    }

    if (webinar.price > 0) {
      // Initiate checkout
      api.post('/transactions/initiate', {
        productType: 'WEBINAR',
        webinarId: webinar.id,
      })
      .then(res => {
        const snapToken = res.data.data?.snapToken
        if (snapToken && (window as any).snap) {
          (window as any).snap.pay(snapToken, {
            onSuccess: () => {
              toast.success('Pembayaran berhasil!')
              qc.invalidateQueries({ queryKey: ['webinars'] })
              qc.invalidateQueries({ queryKey: ['webinars', 'my', 'registered'] })
            },
            onPending: () => {
              toast.info('Menunggu pembayaran...')
              router.push('/mentee/transactions')
            },
            onError: () => toast.error('Pembayaran gagal atau dibatalkan'),
          })
        } else {
          router.push(`/mentee/checkout?type=webinar&id=${webinar.id}`)
        }
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Gagal memulai transaksi')
      })
    } else {
      registerMutation.mutate(webinar.id)
    }
  }

  const displayedWebinars = activeTab === 'ALL' ? allWebinars : myWebinars

  const tabItems = [
    { value: 'ALL', label: 'Jelajahi Webinar' },
    { value: 'MY', label: 'Webinar Saya', count: myWebinars.length },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1240, margin: '0 auto' }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Live Learning
          </span>
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
          Webinar & Workshop
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: 680, lineHeight: 1.5 }}>
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
            options={FIELD_OPTIONS}
            value={field}
            onChange={setField}
            placeholder="Semua Bidang"
            width={180}
          />

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
              onSelect={() => setSelectedWebinar(webinar)}
              onRegister={() => handleRegisterOrPay(webinar)}
              isPending={registerMutation.isPending && registerMutation.variables === webinar.id}
            />
          ))}
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {selectedWebinar && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 20,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 20, maxWidth: 600, width: '100%', maxHeight: '90vh',
                overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }}
            >
              {/* Modal Banner */}
              <div style={{ position: 'relative', height: 200, background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)', overflow: 'hidden' }}>
                {selectedWebinar.bannerUrl ? (
                  <img
                    src={selectedWebinar.bannerUrl}
                    alt={selectedWebinar.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
                    color: '#fff', flexDirection: 'column', gap: 6,
                  }}>
                    <Video size={44} opacity={0.8} />
                    <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>Metro Institute Webinar</span>
                  </div>
                )}

                <button
                  onClick={() => setSelectedWebinar(null)}
                  style={{
                    position: 'absolute', top: 14, right: 14, width: 32, height: 32,
                    borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', backdropFilter: 'blur(4px)',
                  }}
                >
                  <X size={16} />
                </button>

                <div style={{
                  position: 'absolute', bottom: 12, left: 14,
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.9)', color: '#0f172a',
                  }}>
                    {FIELD_LABELS[selectedWebinar.field] ?? selectedWebinar.field}
                  </span>
                  {selectedWebinar.isRegistered && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: '#059669', color: '#fff',
                    }}>
                      Terdaftar ✅
                    </span>
                  )}
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6, lineHeight: 1.35 }}>
                    {selectedWebinar.title}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={14} color="#64748b" /> {formatDate(selectedWebinar.scheduledAt)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={14} color="#64748b" /> {selectedWebinar.duration} Menit
                    </div>
                    {selectedWebinar.quota && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={14} color="#64748b" /> Kuota: {selectedWebinar.quota} Peserta
                      </div>
                    )}
                  </div>
                </div>

                {/* Speaker Card */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                  borderRadius: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '16px', overflow: 'hidden', flexShrink: 0,
                  }}>
                    {selectedWebinar.speakerAvatarUrl ? (
                      <img src={selectedWebinar.speakerAvatarUrl} alt={selectedWebinar.speakerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      selectedWebinar.speakerName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Narasumber
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {selectedWebinar.speakerName}
                    </div>
                    {selectedWebinar.speakerRole && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {selectedWebinar.speakerRole}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                    Deskripsi & Pembahasan
                  </h3>
                  <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                    {selectedWebinar.description}
                  </div>
                </div>

                {/* Meeting Room Link if registered */}
                {selectedWebinar.isRegistered && (
                  <div style={{
                    padding: 16, borderRadius: 14, background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '13px', color: '#047857' }}>
                      <Video size={16} /> Akses Link Live Room
                    </div>
                    {selectedWebinar.meetingUrl ? (
                      <a
                        href={selectedWebinar.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '10px 18px', borderRadius: 8, background: '#059669', color: '#fff',
                          textDecoration: 'none', fontWeight: 600, fontSize: '13px',
                        }}
                      >
                        Buka Link Zoom / Google Meet <ExternalLink size={14} />
                      </a>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#065f46', margin: 0 }}>
                        Link meeting akan diaktifkan mendekati jadwal webinar dimulai. Pantau kembali halaman ini menjelang sesi!
                      </p>
                    )}

                    {selectedWebinar.recordingUrl && (
                      <a
                        href={selectedWebinar.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '8px 14px', borderRadius: 8, background: '#fff', color: '#334155',
                          border: '1px solid #cbd5e1', textDecoration: 'none', fontWeight: 600, fontSize: '12px',
                        }}
                      >
                        Tonton Rekaman Sesi <PlayCircle size={14} />
                      </a>
                    )}
                  </div>
                )}

                {/* Footer Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 14, borderTop: '1px solid var(--color-border)',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Biaya Registrasi</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: selectedWebinar.price === 0 ? '#059669' : 'var(--color-text-primary)' }}>
                      {selectedWebinar.price === 0 ? 'Gratis' : formatRupiah(selectedWebinar.price)}
                    </div>
                  </div>

                  {!selectedWebinar.isRegistered ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRegisterOrPay(selectedWebinar)}
                      disabled={registerMutation.isPending}
                      style={{
                        padding: '10px 24px', borderRadius: 10, background: 'var(--color-primary)',
                        color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px',
                        cursor: 'pointer', boxShadow: '0 2px 6px rgba(1, 133, 86, 0.25)',
                      }}
                    >
                      {registerMutation.isPending ? 'Memproses...' : selectedWebinar.price === 0 ? 'Daftar Sekarang (Gratis)' : 'Beli Tiket'}
                    </motion.button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 700, fontSize: '13px' }}>
                      <CheckCircle2 size={16} /> Sudah Terdaftar
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WebinarCard({
  webinar,
  onSelect,
  onRegister,
  isPending,
}: {
  webinar: WebinarItem
  onSelect: () => void
  onRegister: () => void
  isPending: boolean
}) {
  const isPast = new Date(webinar.scheduledAt).getTime() < Date.now()

  return (
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
      onClick={onSelect}
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

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            background: 'rgba(255,255,255,0.92)', color: '#0f172a', backdropFilter: 'blur(4px)',
          }}>
            {FIELD_LABELS[webinar.field] ?? webinar.field}
          </span>
          {webinar.isRegistered && (
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: '#059669', color: '#fff',
            }}>
              Terdaftar ✅
            </span>
          )}
        </div>

        {/* Price Tag top right */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: webinar.price === 0 ? 'rgba(5, 150, 105, 0.95)' : 'rgba(15, 23, 42, 0.85)',
          color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: 20,
          backdropFilter: 'blur(4px)',
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

        {/* Action Button */}
        <div style={{ paddingTop: 4 }} onClick={e => e.stopPropagation()}>
          {webinar.isRegistered ? (
            webinar.meetingUrl ? (
              <a
                href={webinar.meetingUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  width: '100%', padding: '8px 12px', borderRadius: 8, background: '#059669',
                  color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '12px',
                }}
              >
                <Video size={13} /> Masuk Live Room
              </a>
            ) : (
              <button
                onClick={onSelect}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)',
                  color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600,
                  fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <CheckCircle2 size={13} /> Lihat Detail Akses
              </button>
            )
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onRegister}
              disabled={isPending}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', fontWeight: 600, fontSize: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6,
              }}
            >
              {isPending ? 'Mendaftar...' : webinar.price === 0 ? 'Daftar Gratis' : 'Daftar Webinar'}
              <ChevronRight size={13} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
