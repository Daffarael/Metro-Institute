'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Users, Calendar, Search, CheckCircle2, XCircle,
  Trash2, Mail, Phone, ExternalLink, Award, Sparkles, Video,
  Clock, ShieldCheck, RefreshCw, Edit3, X, Check, AlertCircle
} from 'lucide-react'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import { toast } from 'sonner'

interface CertificateInfo {
  id: string
  credentialId: string
  issuedAt: string
}

interface ParticipantItem {
  registrationId: string
  userId: string
  name: string
  email: string
  phone?: string
  photoUrl?: string
  registeredAt: string
  attended: boolean
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'MANUAL'
  durationMinutes: number
  minRequiredMinutes: number
  joinTime?: string | null
  leaveTime?: string | null
  markedByAdmin?: boolean
  adminNotes?: string | null
  xpAwarded: number
  certificate?: CertificateInfo | null
}

interface WebinarDetails {
  id: string
  title: string
  scheduledAt: string
  duration?: number
  quota?: number
  meetingUrl?: string
  minRequiredMinutes: number
  thresholdPct: number
  xpReward: number
}

interface SummaryData {
  totalRegistered: number
  countPresent: number
  countExcused: number
  countAbsent: number
  attendanceRate: number
}

export default function AdminWebinarParticipantsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const webinarId = params.id
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'CERTIFIED'>('ALL')
  const [deleteTarget, setDeleteTarget] = useState<ParticipantItem | null>(null)

  // Override Modal state
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantItem | null>(null)
  const [overrideStatus, setOverrideStatus] = useState<'PRESENT' | 'EXCUSED' | 'ABSENT'>('EXCUSED')
  const [overrideNotes, setOverrideNotes] = useState('')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'webinars', webinarId, 'participants'],
    queryFn: () => api.get(`/admin/webinars/${webinarId}/participants`).then(r => r.data.data),
    enabled: Boolean(webinarId),
  })

  const webinar: WebinarDetails | undefined = data?.webinar
  const summary: SummaryData = data?.summary ?? {
    totalRegistered: 0,
    countPresent: 0,
    countExcused: 0,
    countAbsent: 0,
    attendanceRate: 0,
  }
  const participants: ParticipantItem[] = data?.participants ?? []

  // Override mutation
  const overrideMutation = useMutation({
    mutationFn: (variables: { userId: string; status: string; adminNotes: string }) =>
      api.patch(`/admin/webinars/${webinarId}/attendance/${variables.userId}`, {
        status: variables.status,
        adminNotes: variables.adminNotes,
      }),
    onSuccess: () => {
      toast.success('Status presensi dan syarat sertifikat berhasil diperbarui')
      qc.invalidateQueries({ queryKey: ['admin', 'webinars', webinarId, 'participants'] })
      setSelectedParticipant(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status presensi')
    },
  })

  // Delete participant mutation
  const deleteMutation = useMutation({
    mutationFn: (regId: string) =>
      api.delete(`/admin/webinars/${webinarId}/participants/${regId}`),
    onSuccess: () => {
      toast.success('Peserta berhasil dihapus dari webinar')
      qc.invalidateQueries({ queryKey: ['admin', 'webinars', webinarId, 'participants'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus peserta'),
  })

  const openOverrideModal = (p: ParticipantItem) => {
    setSelectedParticipant(p)
    setOverrideStatus(p.status === 'EXCUSED' ? 'EXCUSED' : (p.status === 'PRESENT' || p.status === 'MANUAL') ? 'PRESENT' : 'EXCUSED')
    setOverrideNotes(p.adminNotes || '')
  }

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParticipant) return
    overrideMutation.mutate({
      userId: selectedParticipant.userId,
      status: overrideStatus,
      adminNotes: overrideNotes,
    })
  }

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d) + ' WIB'
  }

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        const matchesQuery = (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q))
        )
        if (!matchesQuery) return false
      }

      if (statusFilter === 'ALL') return true
      if (statusFilter === 'PRESENT') return p.status === 'PRESENT' || p.status === 'MANUAL'
      if (statusFilter === 'EXCUSED') return p.status === 'EXCUSED'
      if (statusFilter === 'ABSENT') return p.status === 'ABSENT'
      if (statusFilter === 'CERTIFIED') return Boolean(p.certificate)

      return true
    })
  }, [participants, search, statusFilter])

  const totalCertified = participants.filter(p => Boolean(p.certificate)).length
  const sessionDuration = webinar?.duration || 90

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 64 }}>
      {/* Header Back & Info */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => router.push('/admin/webinars')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'var(--color-text-secondary)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 12,
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Webinar
        </button>

        <AdminPageHeader
          title={webinar ? `Presensi Peserta: ${webinar.title}` : 'Presensi Peserta Webinar'}
          description={
            webinar
              ? `Jadwal: ${formatDate(webinar.scheduledAt)} • Durasi Sesi: ${sessionDuration} Menit • Syarat Hadir: ${webinar.thresholdPct || 80}% (${webinar.minRequiredMinutes} Menit) • Hadiah: +${webinar.xpReward || 25} XP`
              : 'Daftar peserta terdaftar dan rekap durasi Google Meet webinar'
          }
          action={
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
              </button>
              {webinar?.meetingUrl && (
                <a
                  href={webinar.meetingUrl.startsWith('http') ? webinar.meetingUrl : `https://${webinar.meetingUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary)', color: '#fff', fontSize: '13px',
                    fontWeight: 600, textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <Video size={14} /> Room Google Meet <ExternalLink size={12} />
                </a>
              )}
            </div>
          }
        />
      </div>

      {/* Google Workspace Integration Strip */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, padding: '14px 20px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #bbf7d0', borderRadius: 'var(--radius-xl)', marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: '50%', background: '#22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
            }}
          >
            <Check size={18} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>
              Presensi & Sertifikat Otomatis via Google Meet Aktif
            </div>
            <div style={{ fontSize: '12.5px', color: '#15803d' }}>
              Peserta yang hadir minimal {webinar?.thresholdPct || 80}% ({webinar?.minRequiredMinutes || 72} menit) otomatis terverifikasi Hadir, menerima +{webinar?.xpReward || 25} XP, dan diterbitkan E-Sertifikat resmi.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              borderRadius: 20, background: '#dcfce7', border: '1px solid #86efac',
              fontSize: '12px', fontWeight: 700, color: '#166534',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            REAL-TIME SYNC
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14, marginBottom: 20,
        }}
      >
        {/* Total Registered */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Terdaftar
            </span>
            <Users size={16} color="var(--color-text-tertiary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {summary.totalRegistered}
            {webinar?.quota && (
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginLeft: 6 }}>
                / {webinar.quota} Kuota
              </span>
            )}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
            Pendaftar resmi webinar
          </div>
        </div>

        {/* Present */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid #bbf7d0',
          borderRadius: 14, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hadir (≥ {webinar?.minRequiredMinutes || 72} mnt)
            </span>
            <CheckCircle2 size={16} color="#22c55e" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
            {summary.countPresent}
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', marginLeft: 6 }}>
              ({summary.totalRegistered > 0 ? Math.round((summary.countPresent / summary.totalRegistered) * 100) : 0}%)
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#16a34a', marginTop: 2 }}>
            Lolos presensi otomatis
          </div>
        </div>

        {/* Absent */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid #fecdd3',
          borderRadius: 14, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Durasi Kurang / Alfa
            </span>
            <XCircle size={16} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#e11d48' }}>
            {summary.countAbsent}
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#be123c', marginLeft: 6 }}>
              ({summary.totalRegistered > 0 ? Math.round((summary.countAbsent / summary.totalRegistered) * 100) : 0}%)
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#e11d48', marginTop: 2 }}>
            Kurang dari ambang durasi
          </div>
        </div>

        {/* Excused */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid #bfdbfe',
          borderRadius: 14, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Izin Disetujui
            </span>
            <ShieldCheck size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>
            {summary.countExcused}
          </div>
          <div style={{ fontSize: '11.5px', color: '#3b82f6', marginTop: 2 }}>
            Override izin oleh admin
          </div>
        </div>

        {/* Certificates Issued */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid #fed7aa',
          borderRadius: 14, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              E-Sertifikat Terbit
            </span>
            <Award size={16} color="#ea580c" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c' }}>
            {totalCertified}
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#c2410c', marginLeft: 6 }}>
              ({summary.totalRegistered > 0 ? Math.round((totalCertified / summary.totalRegistered) * 100) : 0}%)
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#c2410c', marginTop: 2 }}>
            Tersedia untuk diunduh
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 16, flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari nama, email, no HP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10,
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              fontSize: '13px', color: 'var(--color-text-primary)', outline: 'none',
            }}
          />
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `Semua (${participants.length})` },
            { id: 'PRESENT', label: `Hadir (${summary.countPresent})` },
            { id: 'ABSENT', label: `Tidak Hadir (${summary.countAbsent})` },
            { id: 'EXCUSED', label: `Izin (${summary.countExcused})` },
            { id: 'CERTIFIED', label: `Bersertifikat (${totalCertified})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                fontSize: '12.5px', fontWeight: 600,
                border: statusFilter === tab.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: statusFilter === tab.id ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === tab.id ? '#fff' : 'var(--color-text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <AdminTableSkeleton rows={6} cols={6} />
      ) : filteredParticipants.length === 0 ? (
        <AdminEmptyState
          type={search ? 'no-results' : 'empty'}
          message={search ? 'Tidak ada peserta yang cocok dengan pencarian.' : 'Belum ada mentee yang mendaftar pada webinar ini.'}
        />
      ) : (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  {['#', 'Peserta', 'Durasi di Meet', 'Waktu Masuk / Keluar', 'Status Presensi', 'Sertifikat & XP', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((p, idx) => {
                  const durationPct = Math.min(100, Math.round((p.durationMinutes / sessionDuration) * 100))
                  const isPresent = p.status === 'PRESENT' || p.status === 'MANUAL'
                  const isExcused = p.status === 'EXCUSED'

                  return (
                    <tr
                      key={p.registrationId}
                      style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', color: 'var(--color-text-tertiary)', width: 44 }}>
                        {idx + 1}
                      </td>

                      {/* Name & Avatar */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '13px', overflow: 'hidden', flexShrink: 0,
                          }}>
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              p.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {p.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: '11.5px', marginTop: 2 }}>
                              <Mail size={11} color="#94a3b8" /> {p.email}
                            </div>
                            {p.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-tertiary)', fontSize: '11px', marginTop: 2 }}>
                                <Phone size={10} color="#94a3b8" /> {p.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Duration Progress */}
                      <td style={{ padding: '14px 18px', minWidth: 160 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: '12.5px', color: isPresent ? '#15803d' : isExcused ? '#2563eb' : '#be123c' }}>
                              {p.durationMinutes} <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>/ {sessionDuration} mnt</span>
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                              {durationPct}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%', height: 6, background: '#e2e8f0',
                              borderRadius: 4, overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${durationPct}%`, height: '100%',
                                background: isPresent ? '#22c55e' : isExcused ? '#3b82f6' : '#f43f5e',
                                borderRadius: 4, transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Log Masuk / Keluar */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {p.joinTime ? (
                          <div>
                            <div>{formatDateTime(p.joinTime)}</div>
                            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                              Keluar: {formatDateTime(p.leaveTime)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>Belum ada log</span>
                        )}
                      </td>

                      {/* Status Presensi */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {isPresent ? (
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 'var(--radius-full)',
                              background: '#f0fdf4', border: '1px solid #bbf7d0',
                              color: '#166534', fontSize: '12px', fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={13} color="#22c55e" /> Hadir Terverifikasi
                          </span>
                        ) : isExcused ? (
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 'var(--radius-full)',
                              background: '#eff6ff', border: '1px solid #bfdbfe',
                              color: '#1e40af', fontSize: '12px', fontWeight: 700,
                            }}
                          >
                            <ShieldCheck size={13} color="#3b82f6" /> Izin Disetujui
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 'var(--radius-full)',
                              background: '#fff1f2', border: '1px solid #fecdd3',
                              color: '#9f1239', fontSize: '12px', fontWeight: 700,
                            }}
                          >
                            <XCircle size={13} color="#f43f5e" /> Durasi Kurang
                          </span>
                        )}

                        {p.markedByAdmin && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                            Override Admin {p.adminNotes ? `(${p.adminNotes})` : ''}
                          </div>
                        )}
                      </td>

                      {/* Certificate & XP */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {p.certificate ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <a
                              href={`/verify/${p.certificate.credentialId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '3px 9px', borderRadius: 6,
                                background: 'rgba(234, 88, 12, 0.1)', color: '#c2410c',
                                border: '1px solid rgba(234, 88, 12, 0.25)',
                                fontSize: '11.5px', fontWeight: 700, textDecoration: 'none',
                              }}
                            >
                              <Award size={12} color="#ea580c" /> E-Sertifikat <ExternalLink size={10} />
                            </a>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                              <Sparkles size={11} color="#16a34a" /> +{p.xpAwarded || webinar?.xpReward || 25} XP
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                            {isPresent || isExcused ? 'Proses terbit...' : 'Belum memenuhi'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => openOverrideModal(p)}
                            title="Override status presensi"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '6px 10px', borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                              color: 'var(--color-text-primary)', fontSize: '12px', fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.15s ease',
                            }}
                          >
                            <Edit3 size={12} /> Ubah
                          </button>

                          <button
                            onClick={() => setDeleteTarget(p)}
                            title="Keluarkan dari webinar"
                            style={{
                              width: 30, height: 30, borderRadius: 'var(--radius-md)',
                              border: '1px solid #fee2e2', background: '#fff', color: '#ef4444',
                              cursor: 'pointer', transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#fef2f2'
                              e.currentTarget.style.borderColor = '#fca5a5'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#fff'
                              e.currentTarget.style.borderColor = '#fee2e2'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Override Attendance Modal */}
      {selectedParticipant && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedParticipant(null)
          }}
        >
          <div
            style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 480,
              padding: '24px 28px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Override Presensi Webinar
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: '3px 0 0' }}>
                  {selectedParticipant.name} ({selectedParticipant.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status Selector */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Pilih Status Presensi
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'PRESENT', label: 'Hadir', desc: 'Klaim Sertifikat & XP', border: '#bbf7d0', activeBg: '#f0fdf4', color: '#166534' },
                    { id: 'EXCUSED', label: 'Izin', desc: 'Disetujui Admin', border: '#bfdbfe', activeBg: '#eff6ff', color: '#1e40af' },
                    { id: 'ABSENT', label: 'Tidak Hadir', desc: 'Durasi Kurang', border: '#fecdd3', activeBg: '#fff1f2', color: '#9f1239' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setOverrideStatus(s.id as any)}
                      style={{
                        padding: '10px 8px', borderRadius: 'var(--radius-lg)',
                        border: overrideStatus === s.id ? `2px solid ${s.color}` : '1px solid var(--color-border)',
                        background: overrideStatus === s.id ? s.activeBg : 'var(--color-bg)',
                        color: overrideStatus === s.id ? s.color : 'var(--color-text-secondary)',
                        textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>{s.label}</div>
                      <div style={{ fontSize: '11px', opacity: 0.8 }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes input */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Catatan Admin / Keterangan <span style={{ color: 'var(--color-text-tertiary)' }}>(opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Contoh: Izin konfirmasi kendala teknis Google Meet, diverifikasi manual."
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    color: 'var(--color-text-primary)', fontSize: '13px', resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Notice */}
              <div style={{
                padding: '10px 14px', borderRadius: 8, background: '#eff6ff',
                border: '1px solid #bfdbfe', fontSize: '12px', color: '#1e40af',
              }}>
                ℹ️ Memilih status <strong>Hadir</strong> atau <strong>Izin</strong> akan otomatis menerbitkan E-Sertifikat dan memberikan reward <strong>+{webinar?.xpReward || 25} XP</strong> untuk peserta ini.
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setSelectedParticipant(null)}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', background: 'transparent',
                    color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={overrideMutation.isPending}
                  style={{
                    padding: '8px 20px', borderRadius: 'var(--radius-md)',
                    border: 'none', background: 'var(--color-primary)',
                    color: '#fff', fontSize: '13px', fontWeight: 700,
                    cursor: 'pointer', opacity: overrideMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {overrideMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminConfirmModal
          isOpen={true}
          title="Hapus Peserta Webinar"
          description={`Apakah Anda yakin ingin menghapus "${deleteTarget.name}" (${deleteTarget.email}) dari webinar ini?`}
          confirmLabel="Hapus Peserta"
          isDangerous={true}
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.registrationId)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
