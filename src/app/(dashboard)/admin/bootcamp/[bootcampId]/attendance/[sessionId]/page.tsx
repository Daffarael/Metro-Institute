'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Users, CheckCircle2, XCircle, Clock, ShieldCheck, Search,
  Filter, ArrowLeft, RefreshCw, Edit3, X, Video, AlertCircle,
  ExternalLink, Check, Upload, FileText, Loader2, FileSpreadsheet
} from 'lucide-react'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { toast } from 'sonner'

interface Attendee {
  userId: string
  recordId: string | null
  name: string
  email: string
  photoUrl: string | null
  phone: string | null
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'MANUAL' | 'UNRECORDED'
  durationMinutes: number
  minRequiredMinutes: number
  joinTime: string | null
  leaveTime: string | null
  source: string
  markedByAdmin: boolean
  adminNotes: string | null
  attendedAt: string | null
}

interface AttendanceResponse {
  session: {
    id: string
    title: string
    type: string
    liveUrl: string | null
    liveScheduledAt: string | null
    durationMinutes: number
    minRequiredMinutes: number
    thresholdPct: number
    bootcampId: string
    bootcampTitle: string
    chapterTitle: string
  }
  summary: {
    totalEnrolled: number
    countPresent: number
    countExcused: number
    countAbsent: number
    attendanceRate: number
  }
  attendees: Attendee[]
}

export default function SessionAttendancePage() {
  const params = useParams<{ bootcampId: string; sessionId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'EXCUSED'>('ALL')
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
  const [overrideStatus, setOverrideStatus] = useState<'PRESENT' | 'EXCUSED' | 'ABSENT'>('EXCUSED')
  const [overrideNotes, setOverrideNotes] = useState('')
  const [overrideDuration, setOverrideDuration] = useState<number>(90)

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [parsedCsvParticipants, setParsedCsvParticipants] = useState<Array<{ email: string; displayName: string; durationMinutes: number }>>([])
  const [csvFileName, setCsvFileName] = useState('')

  const syncCsvMutation = useMutation({
    mutationFn: (participants: Array<{ email: string; displayName: string; durationMinutes: number }>) =>
      api.post(`/admin/bootcamps/${params.bootcampId}/sessions/${params.sessionId}/attendance/sync`, {
        participants,
        conferenceId: 'ADMIN_CSV_IMPORT',
      }).then(r => r.data),
    onSuccess: (res: any) => {
      toast.success(res.message || 'Presensi berhasil disinkronkan!')
      queryClient.invalidateQueries({
        queryKey: ['admin', 'bootcamp', params.bootcampId, 'session', params.sessionId, 'attendance'],
      })
      setIsUploadModalOpen(false)
      setParsedCsvParticipants([])
      setCsvFileName('')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memproses file CSV presensi')
    },
  })

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      try {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
        if (lines.length < 2) {
          toast.error('File CSV kosong atau tidak memiliki baris data')
          return
        }

        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
        const emailIdx = header.findIndex(h => h.includes('email') || h.includes('surel'))
        const nameIdx = header.findIndex(h => h.includes('name') || h.includes('nama'))
        const durationIdx = header.findIndex(h => h.includes('duration') || h.includes('durasi') || h.includes('min') || h.includes('menit') || h.includes('time in call'))

        if (emailIdx === -1) {
          toast.error('Kolom Email tidak ditemukan di file CSV. Pastikan ada kolom "Email"!')
          return
        }

        const participants: Array<{ email: string; displayName: string; durationMinutes: number }> = []

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''))
          const email = row[emailIdx]?.trim()
          if (!email || !email.includes('@')) continue

          const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : email.split('@')[0]
          
          let durationMinutes = data?.session.durationMinutes || 90
          if (durationIdx !== -1 && row[durationIdx]) {
            const rawDur = row[durationIdx].toLowerCase()
            if (rawDur.includes(':')) {
              const parts = rawDur.split(':').map(Number)
              if (parts.length === 3) durationMinutes = Math.round(parts[0] * 60 + parts[1] + parts[2] / 60)
              else if (parts.length === 2) durationMinutes = Math.round(parts[0] + parts[1] / 60)
            } else {
              const matched = rawDur.match(/\d+/)
              if (matched) durationMinutes = parseInt(matched[0], 10)
            }
          }

          participants.push({
            email,
            displayName: name,
            durationMinutes,
          })
        }

        if (participants.length === 0) {
          toast.error('Tidak ada data peserta valid yang ditemukan di file CSV')
          return
        }

        setParsedCsvParticipants(participants)
        toast.success(`Berhasil membaca ${participants.length} peserta dari file CSV`)
      } catch (err) {
        toast.error('Gagal membaca file CSV')
      }
    }
    reader.readAsText(file)
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery<AttendanceResponse>({
    queryKey: ['admin', 'bootcamp', params.bootcampId, 'session', params.sessionId, 'attendance'],
    queryFn: () =>
      api.get(`/admin/bootcamps/${params.bootcampId}/sessions/${params.sessionId}/attendance`).then(r => r.data.data),
  })

  const overrideMutation = useMutation({
    mutationFn: (variables: { userId: string; status: string; adminNotes: string; durationMinutes?: number }) =>
      api.patch(`/admin/bootcamps/${params.bootcampId}/sessions/${params.sessionId}/attendance/${variables.userId}`, {
        status: variables.status,
        adminNotes: variables.adminNotes,
        durationMinutes: variables.durationMinutes,
      }).then(r => r.data),
    onSuccess: () => {
      toast.success('Status presensi berhasil diperbarui')
      queryClient.invalidateQueries({
        queryKey: ['admin', 'bootcamp', params.bootcampId, 'session', params.sessionId, 'attendance'],
      })
      setSelectedAttendee(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status presensi')
    },
  })

  const openOverrideModal = (attendee: Attendee) => {
    setSelectedAttendee(attendee)
    setOverrideStatus(attendee.status === 'EXCUSED' ? 'EXCUSED' : attendee.status === 'PRESENT' ? 'PRESENT' : 'EXCUSED')
    setOverrideNotes(attendee.adminNotes || '')
    setOverrideDuration(attendee.durationMinutes > 0 ? attendee.durationMinutes : (data?.session.durationMinutes || 90))
  }

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAttendee) return
    overrideMutation.mutate({
      userId: selectedAttendee.userId,
      status: overrideStatus,
      adminNotes: overrideNotes,
      durationMinutes: overrideDuration,
    })
  }

  const filteredAttendees = useMemo(() => {
    if (!data?.attendees) return []
    return data.attendees.filter(a => {
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (statusFilter === 'ALL') return true
      if (statusFilter === 'PRESENT') return a.status === 'PRESENT' || a.status === 'MANUAL'
      if (statusFilter === 'EXCUSED') return a.status === 'EXCUSED'
      if (statusFilter === 'ABSENT') return a.status === 'ABSENT' || a.status === 'UNRECORDED'
      return true
    })
  }, [data?.attendees, search, statusFilter])

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d) + ' WIB'
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
        <AdminPageHeader
          title="Memuat Rekap Presensi..."
          breadcrumbs={[
            { label: 'Bootcamp', href: '/admin/bootcamp' },
            { label: 'Jadwal & Sesi', href: `/admin/bootcamp/${params.bootcampId}/schedules` },
            { label: 'Presensi' },
          ]}
        />
        <AdminTableSkeleton />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <AlertCircle size={44} color="var(--color-error)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 8 }}>Gagal Memuat Data Presensi</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
          Sesi tidak ditemukan atau terjadi kesalahan server.
        </p>
        <Link
          href={`/admin/bootcamp/${params.bootcampId}/schedules`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Jadwal
        </Link>
      </div>
    )
  }

  const { session, summary } = data

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }}>
      {/* ── Top Header ───────────────────────────────────────── */}
      <AdminPageHeader
        title={`Rekap Presensi: ${session.title}`}
        breadcrumbs={[
          { label: 'Bootcamp', href: '/admin/bootcamp' },
          { label: session.bootcampTitle || 'Detail Bootcamp', href: `/admin/bootcamp/${params.bootcampId}/schedules` },
          { label: 'Presensi Google Meet' },
        ]}
        description={`Sistem presensi 100% otomatis via Google Workspace Meet API. Minimal hadir ${session.thresholdPct}% (${session.minRequiredMinutes} dari ${session.durationMinutes} menit).`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid #018556',
                background: '#f0fdf4',
                color: '#018556',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Upload size={14} /> Upload CSV Presensi
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh Data
            </button>
            {session.liveUrl && (
              <a
                href={session.liveUrl.startsWith('http') ? session.liveUrl : `https://${session.liveUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <Video size={14} /> Link Google Meet <ExternalLink size={12} />
              </a>
            )}
          </div>
        }
      />

      {/* ── Google Workspace Integration Banner ────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 20px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-xl)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <Check size={18} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>
              Google Meet Attendance Tracking Aktif
            </div>
            <div style={{ fontSize: '12.5px', color: '#15803d' }}>
              Data kehadiran dikirim otomatis oleh server Google saat meeting selesai. Tanpa perlu rekap manual atau upload CSV.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              background: '#dcfce7',
              border: '1px solid #86efac',
              fontSize: '12px',
              fontWeight: 700,
              color: '#166534',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            REAL-TIME SYNC
          </span>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Card 1: Total Enrolled */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Total Terdaftar
            </span>
            <Users size={18} color="var(--color-text-tertiary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {summary.totalEnrolled} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Mentee</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            Terdaftar di batch ini
          </div>
        </div>

        {/* Card 2: Hadir (>= 80%) */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-xl)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
              Hadir (≥ {session.minRequiredMinutes} mnt)
            </span>
            <CheckCircle2 size={18} color="#22c55e" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#166534' }}>
            {summary.countPresent}{' '}
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#15803d' }}>
              ({summary.totalEnrolled > 0 ? Math.round((summary.countPresent / summary.totalEnrolled) * 100) : 0}%)
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: 4 }}>
            Memenuhi syarat kehadiran sesi
          </div>
        </div>

        {/* Card 3: Tidak Hadir (< 80%) */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid #fecdd3',
            borderRadius: 'var(--radius-xl)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#9f1239' }}>
              Tidak Hadir (&lt; {session.minRequiredMinutes} mnt)
            </span>
            <XCircle size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#9f1239' }}>
            {summary.countAbsent}{' '}
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#be123c' }}>
              ({summary.totalEnrolled > 0 ? Math.round((summary.countAbsent / summary.totalEnrolled) * 100) : 0}%)
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#e11d48', marginTop: 4 }}>
            Durasi kurang dari ambang batas
          </div>
        </div>

        {/* Card 4: Izin Disetujui */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-xl)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af' }}>
              Izin Disetujui
            </span>
            <ShieldCheck size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e40af' }}>
            {summary.countExcused}{' '}
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#2563eb' }}>
              ({summary.totalEnrolled > 0 ? Math.round((summary.countExcused / summary.totalEnrolled) * 100) : 0}%)
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: 4 }}>
            Override manual oleh admin
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ───────────────────────────── */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
            }}
          />
          <input
            type="text"
            placeholder="Cari nama atau email mentee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '13.5px',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
          />
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `Semua (${summary.totalEnrolled})` },
            { id: 'PRESENT', label: `Hadir (${summary.countPresent})` },
            { id: 'ABSENT', label: `Tidak Hadir (${summary.countAbsent})` },
            { id: 'EXCUSED', label: `Izin (${summary.countExcused})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12.5px',
                fontWeight: 600,
                border: statusFilter === tab.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: statusFilter === tab.id ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === tab.id ? '#fff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Attendance Table ──────────────────────────────── */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {filteredAttendees.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <AdminEmptyState
              type={search ? 'no-results' : 'empty'}
              message={search ? 'Tidak ada mentee yang cocok dengan kata kunci pencarian.' : 'Belum ada data mentee yang tercatat.'}
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--color-bg)',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    letterSpacing: '0.02em',
                  }}
                >
                  <th style={{ padding: '14px 20px', width: '30%' }}>MENTEE</th>
                  <th style={{ padding: '14px 16px', width: '22%' }}>DURASI DI MEET</th>
                  <th style={{ padding: '14px 16px', width: '18%' }}>WAKTU MASUK / KELUAR</th>
                  <th style={{ padding: '14px 16px', width: '16%' }}>STATUS</th>
                  <th style={{ padding: '14px 20px', width: '14%', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.map((attendee, index) => {
                  const durationPct = Math.min(100, Math.round((attendee.durationMinutes / session.durationMinutes) * 100))
                  const isPresent = attendee.status === 'PRESENT' || attendee.status === 'MANUAL'
                  const isExcused = attendee.status === 'EXCUSED'

                  return (
                    <tr
                      key={attendee.userId}
                      style={{
                        borderBottom: index === filteredAttendees.length - 1 ? 'none' : '1px solid var(--color-border)',
                        background: index % 2 === 1 ? 'var(--color-bg-subtle)' : '#ffffff',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = index % 2 === 1 ? 'var(--color-bg-subtle)' : '#ffffff')
                      }
                    >
                      {/* Mentee info */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {attendee.photoUrl ? (
                              <img
                                src={attendee.photoUrl}
                                alt={attendee.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              attendee.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                              {attendee.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              {attendee.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Duration Progress */}
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: isPresent ? '#15803d' : isExcused ? '#2563eb' : '#be123c' }}>
                              {attendee.durationMinutes} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>/ {session.durationMinutes} mnt</span>
                            </span>
                            <span style={{ fontSize: '11.5px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                              {durationPct}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: 6,
                              background: '#e2e8f0',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${durationPct}%`,
                                height: '100%',
                                background: isPresent ? '#22c55e' : isExcused ? '#3b82f6' : '#f43f5e',
                                borderRadius: 4,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Time */}
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: '12.5px' }}>
                        {attendee.joinTime ? (
                          <div>
                            <div>{formatDateTime(attendee.joinTime)}</div>
                            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11.5px' }}>
                              Keluar: {formatDateTime(attendee.leaveTime)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)' }}>Belum ada log</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        {isPresent ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#166534',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={13} color="#22c55e" /> Hadir
                          </span>
                        ) : isExcused ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1e40af',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <ShieldCheck size={13} color="#3b82f6" /> Izin Disetujui
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              color: '#9f1239',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <XCircle size={13} color="#f43f5e" /> Tidak Hadir
                          </span>
                        )}

                        {attendee.markedByAdmin && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                            Override Admin {attendee.adminNotes ? `(${attendee.adminNotes})` : ''}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => openOverrideModal(attendee)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-primary)',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                        >
                          <Edit3 size={12} /> Ubah
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Upload CSV Presensi ───────────────────────── */}
      {isUploadModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            width: '100%',
            maxWidth: 520,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={18} color="#16a34a" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Upload CSV Presensi Google Meet
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                    Ekspor dari Ekstensi Chrome atau Google Workspace
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setParsedCsvParticipants([])
                  setCsvFileName('')
                }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 12,
                padding: '24px 16px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
                position: 'relative',
              }}>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />
                <Upload size={32} color="#018556" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {csvFileName ? csvFileName : 'Pilih atau Tarik File CSV ke Sini'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: 4 }}>
                  Mendukung file CSV dari Google Meet Attendance Tracker / Google Sheets
                </div>
              </div>

              {parsedCsvParticipants.length > 0 && (
                <div style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span>Terdeteksi {parsedCsvParticipants.length} Data Peserta</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803d', marginTop: 4 }}>
                    Sistem akan memverifikasi email mentee dan otomatis menghitung syarat hadir {session.thresholdPct}% (min. {session.minRequiredMinutes} menit).
                  </div>
                  <div style={{ maxHeight: 110, overflowY: 'auto', marginTop: 10, fontSize: '11.5px', color: '#334155', background: '#fff', borderRadius: 6, padding: '6px 10px', border: '1px solid #e2e8f0' }}>
                    {parsedCsvParticipants.slice(0, 5).map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>{p.displayName} ({p.email})</span>
                        <span style={{ fontWeight: 600 }}>{p.durationMinutes} mnt</span>
                      </div>
                    ))}
                    {parsedCsvParticipants.length > 5 && (
                      <div style={{ color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                        + {parsedCsvParticipants.length - 5} peserta lainnya...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false)
                    setParsedCsvParticipants([])
                    setCsvFileName('')
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedCsvParticipants.length === 0 || syncCsvMutation.isPending}
                  onClick={() => syncCsvMutation.mutate(parsedCsvParticipants)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: '#018556',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: (parsedCsvParticipants.length === 0 || syncCsvMutation.isPending) ? 'not-allowed' : 'pointer',
                    opacity: (parsedCsvParticipants.length === 0 || syncCsvMutation.isPending) ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {syncCsvMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Memproses Presensi...
                    </>
                  ) : (
                    'Proses & Sinkronkan Presensi'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Override Modal ─────────────────────────────────────── */}
      {selectedAttendee && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 'var(--z-modal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAttendee(null)
          }}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              width: '100%',
              maxWidth: 480,
              padding: '24px 28px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Override Status Presensi
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: '3px 0 0' }}>
                  {selectedAttendee.name} ({selectedAttendee.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedAttendee(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status Selector */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Pilih Status Baru
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'PRESENT', label: 'Hadir', desc: 'Lulus sesi', border: '#bbf7d0', activeBg: '#f0fdf4', color: '#166534' },
                    { id: 'EXCUSED', label: 'Izin', desc: 'Disetujui', border: '#bfdbfe', activeBg: '#eff6ff', color: '#1e40af' },
                    { id: 'ABSENT', label: 'Tidak Hadir', desc: 'Gagal', border: '#fecdd3', activeBg: '#fff1f2', color: '#9f1239' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setOverrideStatus(s.id as any)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-lg)',
                        border: overrideStatus === s.id ? `2px solid ${s.color}` : '1px solid var(--color-border)',
                        background: overrideStatus === s.id ? s.activeBg : 'var(--color-bg)',
                        color: overrideStatus === s.id ? s.color : 'var(--color-text-secondary)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
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
                  Catatan Admin / Alasan Izin <span style={{ color: 'var(--color-text-tertiary)' }}>(opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Contoh: Izin sakit dengan surat dokter, atau izin kendala jaringan."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedAttendee(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={overrideMutation.isPending}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: overrideMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: overrideMutation.isPending ? 0.7 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {overrideMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
