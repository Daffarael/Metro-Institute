'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import {
  Calendar, Clock, Users, Video, ChevronRight, CheckCircle2,
  ExternalLink, PlayCircle, ShieldCheck, Award, MessageCircle, X
} from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, formatDate, formatRupiah, FIELD_LABELS } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'

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
  meetingUrl?: string
  recordingUrl?: string
  quota?: number
  isPublished: boolean
  isFeatured: boolean
  isRegistered?: boolean
  attended?: boolean
  _count?: { registrations: number }
}

export default function MenteeWebinarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'speaker'>('overview')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const { data: webinar, isLoading, error } = useQuery<WebinarDetail>({
    queryKey: ['webinar', id],
    queryFn: () => api.get(`/webinars/${id}`).then((r) => r.data.data),
    retry: false,
    enabled: !!id,
  })

  // Mutasi Pendaftaran Gratis
  const registerMutation = useMutation({
    mutationFn: () => api.post(`/webinars/${id}/register`),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Pendaftaran webinar berhasil!')
      setShowConfirmModal(false)
      qc.invalidateQueries({ queryKey: ['webinar', id] })
      qc.invalidateQueries({ queryKey: ['webinars'] })
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
              qc.invalidateQueries({ queryKey: ['webinar', id] })
              qc.invalidateQueries({ queryKey: ['webinars'] })
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
      <div className="detail-layout-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 48 }}>
        <div>
          <div className="skeleton" style={{ height: 14, width: 200, marginBottom: 24, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 32, width: '80%', marginBottom: 12, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 28, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 260, borderRadius: 12, marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 10 }} />
        </div>
        <div>
          <div className="skeleton" style={{ height: 380, borderRadius: 12 }} />
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

  const isPast = new Date(webinar.scheduledAt).getTime() < Date.now()
  const isFree = webinar.price === 0
  const isFull = !!webinar.quota && (webinar._count?.registrations || 0) >= webinar.quota

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 48 }} className="animate-fade-in">
      {/* 2-Column Grid (Mirip Bootcamp & Mini Course) */}
      <div className="detail-layout-grid" style={{ display: 'grid', gap: 48 }}>
        
        {/* ── LEFT COLUMN ───────────────────────────────────── */}
        <div>
          {/* Breadcrumb */}
          <nav style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 24, fontSize: '13px',
            color: 'var(--color-text-tertiary)',
          }}>
            <Link href={ROUTES.WEBINAR_LIST} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
              Webinar & Workshop
            </Link>
            <ChevronRight size={13} strokeWidth={1.5} />
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {webinar.title}
            </span>
          </nav>

          {/* Eyebrow & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {webinar.field && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {FIELD_LABELS[webinar.field] || webinar.field}
              </span>
            )}
            <span style={{ fontSize: '14px', color: 'var(--color-border)' }}>•</span>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-reggae-one)',
              padding: '2px 8px',
              borderRadius: '6px',
              background: isFree ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)',
              color: '#fff',
            }}>
              {isFree ? 'Gratis' : formatRupiah(webinar.price)}
            </span>
            {isPast ? (
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>• Sesi Selesai</span>
            ) : webinar.isRegistered ? (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>• Kamu Terdaftar</span>
            ) : isFull ? (
              <span style={{ fontSize: '12px', color: '#DC2626' }}>• Kuota Penuh</span>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--color-primary)' }}>• Pendaftaran Dibuka</span>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '26px', fontWeight: 800, lineHeight: 1.3,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em', marginBottom: 12,
          }}>
            {webinar.title}
          </h1>

          {webinar.shortDescription && (
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              {webinar.shortDescription}
            </p>
          )}

          {/* Meta Horizontal Strip */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            gap: 18, marginBottom: 24, paddingBottom: 18,
            borderBottom: '1px solid var(--color-border-subtle)',
            fontSize: '13px', color: 'var(--color-text-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} color="var(--color-primary)" />
              <span>{formatDate(webinar.scheduledAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="var(--color-primary)" />
              <span>{webinar.duration} Menit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} color="var(--color-primary)" />
              <span>{webinar._count?.registrations || 0} Pendaftar {webinar.quota ? `(Maks. ${webinar.quota})` : ''}</span>
            </div>
          </div>

          {/* Banner Poster */}
          {webinar.bannerUrl && (
            <div style={{
              width: '100%', borderRadius: 14, overflow: 'hidden',
              marginBottom: 24, border: '1px solid var(--color-border-subtle)',
              aspectRatio: '16/9', background: 'var(--color-bg)',
            }}>
              <img src={webinar.bannerUrl} alt={webinar.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* Speaker Card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
            borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)',
            marginBottom: 28,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(1, 133, 86, 0.08)', color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '18px', overflow: 'hidden', flexShrink: 0,
            }}>
              {webinar.speakerAvatarUrl ? (
                <img src={webinar.speakerAvatarUrl} alt={webinar.speakerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                webinar.speakerName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Narasumber Webinar
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2 }}>
                {webinar.speakerName}
              </div>
              {webinar.speakerRole && (
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {webinar.speakerRole}
                </div>
              )}
            </div>
          </div>

          {/* Tabs Navigation */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border-subtle)', marginBottom: 20 }}>
            {[
              { id: 'overview', label: 'Deskripsi & Pembahasan' },
              { id: 'schedule', label: 'Jadwal & Akses' },
              { id: 'speaker', label: 'Tentang Narasumber' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
              {webinar.description}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 18, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border-subtle)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 10px 0' }}>
                  Waktu Pelaksanaan
                </h4>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  <div><strong>Hari, Tanggal:</strong> {formatDate(webinar.scheduledAt)}</div>
                  <div><strong>Durasi:</strong> {webinar.duration} Menit</div>
                  <div><strong>Platform:</strong> Online Live Stream (Zoom / Google Meet)</div>
                </div>
              </div>

              {webinar.isRegistered && (
                <div style={{ padding: 18, background: 'rgba(1, 133, 86, 0.05)', borderRadius: 12, border: '1px solid rgba(1, 133, 86, 0.18)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 8px 0' }}>
                    Tautan Sesi Kamu
                  </h4>
                  {webinar.meetingUrl ? (
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <a
                        href={webinar.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '9px 16px', borderRadius: 8,
                          background: 'var(--color-primary)', color: '#fff',
                          textDecoration: 'none', fontWeight: 600, fontSize: '13px',
                        }}
                      >
                        Buka Ruang Zoom / GMeet <ExternalLink size={14} />
                      </a>
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Link pertemuan akan diaktifkan di halaman ini 30 menit sebelum sesi dimulai.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'speaker' && (
            <div style={{ padding: 18, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border-subtle)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px 0' }}>
                {webinar.speakerName}
              </h4>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                {webinar.speakerRole || 'Narasumber Metro Institute'}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Praktisi berpengalaman yang siap berbagi wawasan langsung dari dunia industri, strategi kerja nyata, dan menjawab kendalamu secara interaktif.
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (Sticky Sidebar Mirip Bootcamp) ───── */}
        <div style={{ position: 'sticky', top: 32, alignSelf: 'start' }}>
          <div style={{
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 14, overflow: 'hidden',
            background: 'var(--color-surface)',
          }}>
            {/* Thumbnail Poster */}
            {webinar.bannerUrl && (
              <div style={{
                height: 150, background: 'var(--color-bg)',
                borderBottom: '1px solid var(--color-border-subtle)',
                overflow: 'hidden',
              }}>
                <img src={webinar.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ padding: '20px' }}>
              {/* Price Display */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Biaya Pendaftaran
                </div>
                <div style={{
                  fontSize: '24px', fontWeight: 800,
                  color: isFree ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  letterSpacing: '-0.02em', marginTop: 4,
                }}>
                  {isFree ? 'Gratis' : formatRupiah(webinar.price)}
                </div>
              </div>

              {/* Action Button: Berdasarkan Status Pendaftaran & Harga */}
              {webinar.isRegistered ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(1, 133, 86, 0.08)',
                    color: 'var(--color-primary)', fontWeight: 600,
                    fontSize: '13px', textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <CheckCircle2 size={16} /> Kamu Sudah Terdaftar
                  </div>

                  {webinar.meetingUrl ? (
                    <a
                      href={webinar.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', padding: '11px 0',
                        background: 'var(--color-primary)', color: '#fff',
                        borderRadius: 8, fontWeight: 700, fontSize: '13px',
                        textDecoration: 'none',
                      }}
                    >
                      <Video size={15} /> Masuk Live Room
                    </a>
                  ) : (
                    <a
                      href={getGoogleCalendarUrl()}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', padding: '10px 0',
                        background: 'var(--color-bg)', color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8, fontWeight: 600, fontSize: '12px',
                        textDecoration: 'none',
                      }}
                    >
                      <Calendar size={14} /> Simpan ke Google Calendar
                    </a>
                  )}

                  {webinar.recordingUrl && (
                    <a
                      href={webinar.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', padding: '9px 0',
                        background: 'var(--color-surface)', color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 8, fontWeight: 600, fontSize: '12px',
                        textDecoration: 'none',
                      }}
                    >
                      <PlayCircle size={14} /> Tonton Rekaman
                    </a>
                  )}
                </div>
              ) : isPast ? (
                <button
                  disabled
                  style={{
                    width: '100%', padding: '11px 0',
                    background: 'var(--color-bg)', color: 'var(--color-text-tertiary)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 8, fontWeight: 600, fontSize: '13px',
                    cursor: 'not-allowed',
                  }}
                >
                  Sesi Webinar Telah Selesai
                </button>
              ) : isFull ? (
                <button
                  disabled
                  style={{
                    width: '100%', padding: '11px 0',
                    background: 'var(--color-bg)', color: '#DC2626',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 8, fontWeight: 600, fontSize: '13px',
                    cursor: 'not-allowed',
                  }}
                >
                  Kuota Penuh
                </button>
              ) : isFree ? (
                /* Alur GRATIS: Buka Konfirmasi Dulu */
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!user) {
                      toast.info('Silakan login terlebih dahulu untuk mendaftar.')
                      router.push('/login')
                      return
                    }
                    setShowConfirmModal(true)
                  }}
                  style={{
                    width: '100%', padding: '12px 0',
                    background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Daftar Sekarang (Gratis)
                </motion.button>
              ) : (
                /* Alur BERBAYAR: Langsung ke Checkout Midtrans */
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
                  Beli Tiket Webinar
                </motion.button>
              )}

              {/* Fasilitas & Benefit List */}
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>
                  Fasilitas Peserta:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={15} color="var(--color-primary)" />
                    <span>E-Sertifikat Resmi</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageCircle size={15} color="var(--color-primary)" />
                    <span>Sesi Q&A Interaktif Langsung</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Video size={15} color="var(--color-primary)" />
                    <span>Akses Live Room Interaktif</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={15} color="var(--color-primary)" />
                    <span>Materi dari Narasumber Industri</span>
                  </div>
                </div>
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
                  Konfirmasi Pendaftaran Gratis
                </h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                Kamu akan mendaftar ke webinar <strong>"{webinar.title}"</strong> tanpa dipungut biaya. Tiket akses live room akan langsung ditambahkan ke akunmu.
              </p>

              <div style={{
                padding: 12, borderRadius: 10,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '12px', color: 'var(--color-text-secondary)',
                marginBottom: 20,
              }}>
                <div><strong>Jadwal:</strong> {formatDate(webinar.scheduledAt)}</div>
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
