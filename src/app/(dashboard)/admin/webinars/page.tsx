'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Users, Trash2, X, Calendar, Clock, Video, Link2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import Link from 'next/link'
import { formatRupiah, formatDate, ensureAbsoluteUrl } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import CleanCombobox from '@/components/admin/CleanCombobox'
import ImageUpload from '@/components/admin/ImageUpload'
import { toast } from 'sonner'

// ─── Schema ────────────────────────────────────────────────
const webinarSchema = z.object({
  title:            z.string().min(5, 'Minimal 5 karakter'),
  shortDescription: z.string().optional().nullable(),
  description:      z.string().min(10, 'Minimal 10 karakter'),
  speakerName:      z.string().min(2, 'Nama pembicara wajib diisi'),
  speakerRole:      z.string().optional().nullable(),
  price:            z.number().min(0),
  scheduledAt:      z.string().min(1, 'Jadwal wajib diisi'),
  duration:         z.number().min(1, 'Minimal 1 menit'),
  meetingUrl:       z.string().optional().nullable(),
  recordingUrl:     z.string().optional().nullable(),
  quota:            z.number().optional().nullable(),
  status:           z.enum(['DRAFT', 'PUBLISHED']),
  certificateTemplateId: z.string().optional().nullable(),
  bannerUrl:        z.string().optional().nullable(),
})
type WebinarForm = z.infer<typeof webinarSchema>

interface WebinarItem {
  id: string
  title: string
  description: string
  shortDescription?: string
  speakerName: string
  speakerRole?: string
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
  isEnded?: boolean
  certificateTemplateId?: string
  _count?: { registrations: number }
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: 'var(--color-text-secondary)', marginBottom: 8,
}
const inputStyleClean: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.06)', background: '#f9fafb',
  fontSize: '14px', color: 'var(--color-text-primary)', outline: 'none',
  transition: 'all 0.2s ease', boxSizing: 'border-box',
}

// ─── Webinar Modal ─────────────────────────────────────────
function WebinarModal({ webinar, onClose }: { webinar?: WebinarItem; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!webinar

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ['certificate-templates'],
    queryFn: () => api.get('/certificates/templates').then((r) => r.data.data ?? []),
    staleTime: 5 * 60 * 1000,
  })

  // Helper to format Date/ISO string to "YYYY-MM-DDTHH:mm" in local timezone for <input type="datetime-local">
  const toLocalDatetimeValue = (dateVal: string | Date | number) => {
    const d = new Date(dateVal)
    const pad = (n: number) => String(n).padStart(2, '0')
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const defaultDate = webinar?.scheduledAt
    ? toLocalDatetimeValue(webinar.scheduledAt)
    : toLocalDatetimeValue(Date.now() + 86400000)

  const { register, handleSubmit, control, formState: { errors } } = useForm<WebinarForm>({
    resolver: zodResolver(webinarSchema) as any,
    defaultValues: {
      title:            webinar?.title ?? '',
      shortDescription: webinar?.shortDescription ?? '',
      description:      webinar?.description ?? '',
      speakerName:      webinar?.speakerName ?? '',
      speakerRole:      webinar?.speakerRole ?? '',
      price:            webinar?.price ?? 0,
      scheduledAt:      defaultDate,
      duration:         webinar?.duration ?? 90,
      meetingUrl:       webinar?.meetingUrl ?? '',
      recordingUrl:     webinar?.recordingUrl ?? '',
      quota:            webinar?.quota ?? null,
      status:           webinar?.isPublished ? 'PUBLISHED' : 'DRAFT',
      certificateTemplateId: webinar?.certificateTemplateId ?? null,
      bannerUrl:        webinar?.bannerUrl ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: WebinarForm) => {
      const { status, scheduledAt, ...rest } = data
      const sanitizeUrl = (url?: string | null) => {
        if (!url || !url.trim()) return null
        return ensureAbsoluteUrl(url)
      }
      // Konversi local input "2026-10-12T19:15" ke UTC ISO string sesuai browser timezone (WIB)
      const scheduledAtIso = new Date(scheduledAt).toISOString()

      const payload = {
        ...rest,
        scheduledAt: scheduledAtIso,
        meetingUrl: sanitizeUrl(rest.meetingUrl),
        recordingUrl: sanitizeUrl(rest.recordingUrl),
        isPublished: status === 'PUBLISHED',
      }
      return isEdit
        ? api.patch(`/admin/webinars/${webinar!.id}`, payload).then(r => r.data)
        : api.post('/admin/webinars', payload).then(r => r.data)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Webinar diperbarui.' : 'Webinar berhasil dibuat!')
      qc.invalidateQueries({ queryKey: ['admin', 'webinars'] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan webinar.')
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', overflowY: 'auto'
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
        style={{
          background: '#ffffff', borderRadius: '24px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
          width: '100%', maxWidth: 640, margin: 'auto',
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            cursor: pointer;
            opacity: 0.6;
            transition: 0.2s;
          }
          input[type="date"]::-webkit-calendar-picker-indicator:hover,
          input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
            opacity: 1;
          }
        `}} />

        {/* Modal Header */}
        <div style={{
          padding: '32px 32px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {isEdit ? 'Edit Webinar & Workshop' : 'Buat Webinar Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-tertiary)', width: 36, height: 36, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ padding: '0 32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Banner Poster */}
          <div>
            <label style={labelStyle}>Banner Poster Webinar</label>
            <Controller
              control={control}
              name="bannerUrl"
              render={({ field }) => (
                <ImageUpload value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Judul Webinar <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <input
              {...register('title')}
              placeholder="Contoh: Mastering Next.js 15 & Server Components"
              style={inputStyleClean}
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.title && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.title.message}</p>}
          </div>

          {/* Speaker Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nama Pembicara / Speaker <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input
                {...register('speakerName')}
                placeholder="Contoh: Alex Pratama"
                style={inputStyleClean}
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
              {errors.speakerName && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.speakerName.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Role & Perusahaan</label>
              <input
                {...register('speakerRole')}
                placeholder="Contoh: Tech Lead"
                style={inputStyleClean}
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>

          {/* Schedule & Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Tanggal & Waktu Pelaksanaan <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input
                type="datetime-local"
                {...register('scheduledAt')}
                style={inputStyleClean}
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
              {errors.scheduledAt && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.scheduledAt.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Durasi (menit) <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input
                type="number"
                {...register('duration', { valueAsNumber: true })}
                min={1}
                placeholder="90"
                style={inputStyleClean}
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>

          {/* Price & Quota */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Harga Tiket (Rp) <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input
                type="number"
                {...register('price', { valueAsNumber: true })}
                placeholder="0"
                min={0}
                style={inputStyleClean}
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 4, display: 'block' }}>
                Masukkan 0 jika webinar diselenggarakan gratis.
              </span>
            </div>
            <div>
              <label style={labelStyle}>Batas Kuota Peserta</label>
              <input
                type="number"
                {...register('quota', { setValueAs: v => (v === '' ? null : Number(v)) })}
                placeholder="Tak terbatas"
                min={1}
                style={inputStyleClean}
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 4, display: 'block' }}>
                Kosongkan jika kuota tidak dibatasi.
              </span>
            </div>
          </div>

          {/* Meeting Link */}
          <div>
            <label style={labelStyle}>Link Room (Zoom / Google Meet)</label>
            <input
              {...register('meetingUrl')}
              placeholder="https://meet.google.com/... atau Zoom link"
              style={inputStyleClean}
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Deskripsi Sesi <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Jelaskan poin-poin materi dan apa yang akan dipelajari dalam sesi ini..."
              style={{ ...inputStyleClean, resize: 'vertical' }}
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.description && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.description.message}</p>}
          </div>

          {/* Status & Template Sertifikat */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Status Publikasi <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <CleanCombobox
                    options={[
                      { value: 'PUBLISHED', label: 'PUBLISHED (Terbuka)' },
                      { value: 'DRAFT', label: 'DRAFT (Disimpan)' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pilih Status"
                    width="100%"
                    direction="down"
                    style={{ ...inputStyleClean, padding: '12px 16px', background: '#fff' }}
                  />
                )}
              />
            </div>
            <div>
              <label style={labelStyle}>Template Sertifikat</label>
              <Controller
                control={control}
                name="certificateTemplateId"
                render={({ field }) => (
                  <CleanCombobox
                    options={[
                      { value: '', label: 'Tanpa Sertifikat' },
                      ...templates.map(t => ({ value: t.id, label: t.name })),
                    ]}
                    value={field.value || ''}
                    onChange={val => field.onChange(val === '' ? null : val)}
                    placeholder="Pilih Template"
                    width="100%"
                    direction="down"
                    style={{ ...inputStyleClean, padding: '12px 16px', background: '#fff' }}
                  />
                )}
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)',
                background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                color: 'var(--color-text-secondary)', transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                padding: '12px 24px', borderRadius: '12px', border: 'none',
                background: 'var(--color-primary)', color: '#fff', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', opacity: mutation.isPending ? 0.7 : 1, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!mutation.isPending) e.currentTarget.style.filter = 'brightness(1.1)' }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
            >
              {mutation.isPending ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Buat Webinar')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Admin Webinars Page ──────────────────────────────
export default function AdminWebinarsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<WebinarItem | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WebinarItem | null>(null)

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'webinars', { search, status, page }],
    placeholderData: keepPreviousData,
    queryFn: () =>
      api.get('/admin/webinars', {
        params: {
          search: search || undefined,
          status: status || undefined,
          page,
          limit: 10,
        },
      }).then(r => r.data.data),
    staleTime: 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/webinars/${id}`),
    onSuccess: () => {
      toast.success('Webinar berhasil dihapus.')
      qc.invalidateQueries({ queryKey: ['admin', 'webinars'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus webinar.'),
  })

  const toggleEndMutation = useMutation({
    mutationFn: ({ id, isEnded }: { id: string; isEnded: boolean }) =>
      api.patch(`/admin/webinars/${id}/end`, { isEnded }),
    onSuccess: (_, variables) => {
      toast.success(variables.isEnded ? 'Sesi webinar ditandai selesai.' : 'Sesi webinar diaktifkan kembali.')
      qc.invalidateQueries({ queryKey: ['admin', 'webinars'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah status sesi webinar.')
    },
  })

  const items: WebinarItem[] = data?.items ?? []
  const pagination = data?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminPageHeader
        title="Webinar & Workshop"
        description="Kelola jadwal webinar live, narasumber, link streaming, dan peserta terdaftar."
        action={
          <button
            suppressHydrationWarning
            onClick={() => setModal('new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Buat Webinar
          </button>
        }
      />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          suppressHydrationWarning
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cari webinar atau pembicara..."
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)',
            fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300,
          }}
        />

        <CleanCombobox
          value={status}
          onChange={val => { setStatus(val); setPage(1) }}
          placeholder="Semua Status"
          options={[
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'DRAFT', label: 'Draft' },
          ]}
          width={180}
        />
      </div>

      {/* Data Table */}
      {isLoading ? (
        <AdminTableSkeleton rows={6} cols={8} />
      ) : items.length === 0 ? (
        <AdminEmptyState
          type={search ? 'no-results' : 'empty'}
          message={search ? 'Tidak ada webinar yang cocok dengan pencarian.' : 'Belum ada data webinar & workshop.'}
        />
      ) : (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                {['#', 'Webinar', 'Speaker', 'Jadwal & Waktu', 'Harga', 'Pendaftar', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((w, idx) => (
                <tr
                  key={w.id}
                  style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 18px', color: 'var(--color-text-tertiary)' }}>
                    {(pagination.page - 1) * pagination.limit + idx + 1}
                  </td>

                  {/* Title */}
                  <td style={{ padding: '14px 18px', maxWidth: 260 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.35 }}>
                      {w.title}
                    </div>
                  </td>

                  {/* Speaker */}
                  <td style={{ padding: '14px 18px', maxWidth: 220 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: '14px' }}>🎙️</span> {w.speakerName}
                    </div>
                    {w.speakerRole && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                        {w.speakerRole}
                      </div>
                    )}
                  </td>

                  {/* Schedule */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      <Calendar size={13} color="#64748b" /> {formatDate(w.scheduledAt)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                      <Clock size={12} color="#94a3b8" /> {w.duration} menit
                    </div>
                  </td>

                  {/* Price */}
                  <td style={{ padding: '14px 18px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {w.price === 0 ? <span style={{ color: '#059669' }}>Gratis</span> : formatRupiah(w.price)}
                  </td>

                  {/* Registrations */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {w._count?.registrations ?? 0}
                    </span>
                    {w.quota ? (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        /{w.quota}
                      </span>
                    ) : null}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 18px' }}>
                    {w.isEnded ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 6, fontSize: '11px', fontWeight: 700,
                        background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                      }}>
                        SELESAI
                      </span>
                    ) : (
                      <AdminStatusChip status={w.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => toggleEndMutation.mutate({ id: w.id, isEnded: !w.isEnded })}
                        title={w.isEnded ? 'Aktifkan Kembali Sesi' : 'Akhiri Sesi Webinar'}
                        disabled={toggleEndMutation.isPending}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: w.isEnded ? '1px solid #e5e7eb' : '1px solid rgba(16, 185, 129, 0.3)',
                          background: w.isEnded ? '#f3f4f6' : 'rgba(16, 185, 129, 0.08)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer',
                          color: w.isEnded ? '#6b7280' : 'var(--color-primary)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <CheckCircle2 size={12} /> {w.isEnded ? 'Selesai' : 'Akhiri Sesi'}
                      </button>

                      <button
                        onClick={() => setModal(w)}
                        title="Edit Webinar"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                          borderRadius: 'var(--radius-md)', border: '1px solid #e5e7eb', background: '#fff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', color: '#374151', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = 'var(--color-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#374151' }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>

                      <Link
                        href={`/admin/webinars/${w.id}/participants`}
                        title="Lihat Pendaftar"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                          borderRadius: 'var(--radius-md)', border: '1px solid #e5e7eb', background: '#fff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600,
                          textDecoration: 'none', color: '#374151', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = 'var(--color-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#374151' }}
                      >
                        <Users size={12} /> Peserta
                      </Link>

                      <button
                        onClick={() => setDeleteTarget(w)}
                        title="Hapus Webinar"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 'var(--radius-md)', border: '1px solid #fee2e2',
                          background: '#fff', color: '#ef4444', cursor: 'pointer', transition: 'all 0.15s',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#fef2f2'
                          e.currentTarget.style.color = '#dc2626'
                          e.currentTarget.style.borderColor = '#fca5a5'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fff'
                          e.currentTarget.style.color = '#ef4444'
                          e.currentTarget.style.borderColor = '#fee2e2'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <AdminPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              limit={pagination.limit}
              total={pagination.total}
              onPageChange={setPage}
              onLimitChange={() => {}}
            />
          )}
        </div>
      )}

      {/* Modal Buat / Edit */}
      <AnimatePresence>
        {modal && (
          <WebinarModal
            webinar={modal === 'new' ? undefined : modal}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AdminConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Webinar"
        description={`Apakah Anda yakin ingin menghapus webinar "${deleteTarget?.title}"? Data pendaftar juga akan terhapus.`}
        confirmLabel="Hapus"
        isDangerous={true}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
