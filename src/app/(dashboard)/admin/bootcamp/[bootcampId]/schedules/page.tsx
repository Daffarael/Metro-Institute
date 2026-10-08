'use client'
// src/app/admin/bootcamp/[bootcampId]/schedules/page.tsx
// Jadwal live class + upload rekaman
// Sesuai concept doc Section 4D + design doc LiveSchedule schema

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, Video, X, Calendar, Clock } from 'lucide-react'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────
interface LiveSchedule {
  id: string; title: string; scheduledAt: string
  durationMin: number; meetingUrl: string
  recordingUrl?: string; attendanceWindowMin: number
  _count?: { attendances: number }
}
interface Bootcamp { id: string; name: string }

// ─── Zod schema (sesuai design_superadmin.md) ─────────────
const scheduleSchema = z.object({
  title:               z.string().min(3, 'Minimal 3 karakter'),
  scheduledAt:         z.string().min(1, 'Wajib diisi'),
  durationMin:         z.number().min(5).max(480),
  attendanceWindowMin: z.number().min(5).max(120),
  meetingUrl:          z.string().url('Format URL tidak valid').min(1, 'Wajib diisi'),
})
type ScheduleForm = z.infer<typeof scheduleSchema>

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)', background: 'var(--color-surface)',
  color: 'var(--color-text-primary)', outline: 'none',
}

// ─── Schedule Modal ────────────────────────────────────────
function ScheduleModal({ bootcampId, schedule, onClose }: {
  bootcampId: string; schedule?: LiveSchedule; onClose: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!schedule

  const { register, handleSubmit, formState: { errors } } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title:               schedule?.title ?? '',
      scheduledAt:         schedule?.scheduledAt?.slice(0, 16) ?? '',
      durationMin:         schedule?.durationMin ?? 120,
      meetingUrl:          schedule?.meetingUrl ?? '',
      attendanceWindowMin: schedule?.attendanceWindowMin ?? 30,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ScheduleForm) =>
      isEdit
        ? api.put(`/admin/bootcamps/${bootcampId}/sessions/${schedule!.id}`, data).then(r => r.data)
        : api.post(`/admin/bootcamps/${bootcampId}/schedules`, data).then(r => r.data),
    onSuccess: () => {
      toast.success(isEdit ? 'Jadwal diperbarui.' : 'Jadwal ditambahkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'schedules'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan.'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 520, padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{isEdit ? 'Edit Jadwal' : 'Tambah Jadwal Live'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => {
          mutation.mutate(d as any)
        })} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Judul Sesi *</label>
            <input {...register('title')} style={inputStyle} placeholder="Sesi 1 — Pengenalan Design Thinking" />
            {errors.title && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 3 }}>{errors.title.message}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Jadwal (Tanggal & Jam) *</label>
              <input type="datetime-local" {...register('scheduledAt')} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Durasi (menit) *</label>
              <input type="number" {...register('durationMin', { valueAsNumber: true })} style={inputStyle} min={5} max={480} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Link Meeting (Google Meet / Zoom) *</label>
            <input {...register('meetingUrl')} style={inputStyle} placeholder="https://meet.google.com/xxx-xxxx-xxx" />
            {errors.meetingUrl && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 3 }}>{errors.meetingUrl.message}</p>}
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Window Absensi (menit) — Default 30</label>
            <input type="number" {...register('attendanceWindowMin', { valueAsNumber: true })} style={inputStyle} min={5} max={120} />
            <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 3 }}>Mentee bisa absen dalam X menit pertama sesi.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer' }}>Batal</button>
            <button type="submit" disabled={mutation.isPending} style={{ padding: '9px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer', opacity: mutation.isPending ? 0.7 : 1 }}>
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────
export default function BootcampSchedulesPage() {
  const params = useParams<{ bootcampId: string }>()
  const { bootcampId } = params
  const qc = useQueryClient()
  const [modal, setModal] = useState<null | 'new' | LiveSchedule>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: bootcamp } = useQuery<Bootcamp>({
    queryKey: ['admin', 'bootcamp', bootcampId],
    queryFn: () => api.get(`/admin/bootcamps/${bootcampId}`).then(r => r.data.data),
  })

  const { data: schedules, isLoading } = useQuery<LiveSchedule[]>({
    queryKey: ['admin', 'bootcamp', bootcampId, 'schedules'],
    queryFn: () => api.get(`/admin/bootcamps/${bootcampId}/schedules`).then(r => r.data.data ?? []),
    staleTime: 2 * 60 * 1000,
  })

  const deleteSchedule = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/bootcamps/${bootcampId}/sessions/${id}`),
    onSuccess: () => {
      toast.success('Jadwal dihapus.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'schedules'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Gagal menghapus.'),
  })

  // Upload rekaman
  const uploadRecording = async (scheduleId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const toastId = toast.loading('Mengupload rekaman...')
    try {
      const { data: uploadData } = await api.post('/upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      await api.put(`/admin/bootcamps/${bootcampId}/sessions/${scheduleId}`, { recordingUrl: uploadData.url })
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'schedules'] })
      toast.success('Rekaman berhasil diupload.', { id: toastId })
    } catch {
      toast.error('Gagal upload rekaman.', { id: toastId })
    }
  }

  const sorted = [...(schedules ?? [])].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  return (
    <div>
      <AdminPageHeader
        title="Jadwal Live Class"
        description={bootcamp?.title}
        breadcrumbs={[
          { label: 'Bootcamp', href: '/admin/bootcamp' },
          { label: bootcamp?.title ?? '...', href: '/admin/bootcamp' },
          { label: 'Jadwal Live' },
        ]}
        action={null}
      />

      {isLoading ? <AdminTableSkeleton rows={5} cols={6} /> : sorted.length === 0 ? (
        <div className="card">
          <AdminEmptyState type="empty" message="Belum ada jadwal live class. Tambahkan materi bertipe 'LIVE' melalui menu Silabus." action={null} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {sorted.map(s => {
            const hasSchedule = !!s.scheduledAt
            const scheduledDate = hasSchedule ? new Date(s.scheduledAt) : null
            const isPast = hasSchedule && scheduledDate ? scheduledDate < new Date() : false
            
            return (
              <div key={s.id} className="card" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
                {/* Date badge */}
                <div style={{ flexShrink: 0, textAlign: 'center', background: isPast ? 'var(--color-bg)' : (hasSchedule ? 'var(--color-primary-light)' : '#fef3c7'), borderRadius: 'var(--radius-lg)', padding: '10px 14px', minWidth: 64, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: hasSchedule ? '20px' : '14px', fontWeight: 900, color: isPast ? 'var(--color-text-tertiary)' : (hasSchedule ? 'var(--color-primary)' : '#d97706'), lineHeight: 1 }}>
                    {hasSchedule && scheduledDate ? scheduledDate.getDate() : 'TBA'}
                  </div>
                  <div style={{ fontSize: '11px', color: isPast ? 'var(--color-text-tertiary)' : (hasSchedule ? 'var(--color-primary)' : '#d97706'), fontWeight: 600 }}>
                    {hasSchedule && scheduledDate ? scheduledDate.toLocaleString('id-ID', { month: 'short' }) : 'Belum Atur'}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '15px', color: 'var(--color-text-primary)' }}>{s.title}</div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} style={{ color: 'var(--color-primary)' }}/> {hasSchedule && scheduledDate ? `${scheduledDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : 'Belum Dijadwalkan'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} style={{ color: 'var(--color-primary)' }}/> {s.durationMin || 0} menit
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'var(--color-primary)', fontSize: '14px', lineHeight: 1 }}>👥</span> {s._count?.attendances ?? 0} hadir
                    </span>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    {s.meetingUrl ? (
                      <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', background: 'var(--color-primary-light)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                        🔗 Buka Link Meeting
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>Belum ada link meeting</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  <button onClick={() => setModal(s)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => setDeleteId(s.id)} style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <ScheduleModal
          bootcampId={bootcampId}
          schedule={modal === 'new' ? undefined : modal as LiveSchedule}
          onClose={() => setModal(null)}
        />
      )}

      <AdminConfirmModal
        isOpen={deleteId !== null}
        title="Hapus Jadwal?"
        description="Jadwal live class ini akan dihapus permanen beserta data absensi terkait."
        confirmLabel="Ya, Hapus"
        isDangerous
        isLoading={deleteSchedule.isPending}
        onConfirm={() => deleteId && deleteSchedule.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}
