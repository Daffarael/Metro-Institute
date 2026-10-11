'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Users, Trash2, X, Calendar, Clock, Video, Link2, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import { formatRupiah, formatDate } from '@/lib/utils'
import Link from 'next/link'
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
  field:            z.enum(['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE']),
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
  certificateTemplateId?: string
  _count?: { registrations: number }
}

const FIELD_OPTS = ['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'] as const
const FIELD_LABELS: Record<string, string> = {
  UI_UX: 'UI/UX Design',
  FRONTEND: 'Frontend Development',
  BACKEND: 'Backend Development',
  MOBILE: 'Mobile Development',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: 'var(--color-text-secondary)', marginBottom: 8,
}
const inputStyleClean: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.08)', background: '#f9fafb',
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

  // Format scheduledAt for datetime-local input
  const defaultDate = webinar?.scheduledAt
    ? new Date(webinar.scheduledAt).toISOString().slice(0, 16)
    : new Date(Date.now() + 86400000).toISOString().slice(0, 16)

  const { register, handleSubmit, control, formState: { errors } } = useForm<WebinarForm>({
    resolver: zodResolver(webinarSchema) as any,
    defaultValues: {
      title:            webinar?.title ?? '',
      shortDescription: webinar?.shortDescription ?? '',
      description:      webinar?.description ?? '',
      speakerName:      webinar?.speakerName ?? '',
      speakerRole:      webinar?.speakerRole ?? '',
      field:            (webinar?.field as any) ?? 'FRONTEND',
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
      const payload = {
        ...data,
        isPublished: data.status === 'PUBLISHED',
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        style={{
          background: '#ffffff', borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18)',
          width: '100%', maxWidth: 680, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
              {isEdit ? 'Edit Webinar & Workshop' : 'Buat Webinar Baru'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Isi informasi sesi webinar/workshop untuk dipublikasikan.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: '#f8fafc', width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit(d => mutation.mutate(d))}
          style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
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
            <label style={labelStyle}>Judul Webinar <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              {...register('title')}
              placeholder="Contoh: Mastering Next.js 15 & Server Components"
              style={inputStyleClean}
            />
            {errors.title && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: 4 }}>{errors.title.message}</p>}
          </div>

          {/* Speaker Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nama Pembicara / Speaker <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                {...register('speakerName')}
                placeholder="Contoh: Alex Pratama"
                style={inputStyleClean}
              />
              {errors.speakerName && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: 4 }}>{errors.speakerName.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Role & Perusahaan</label>
              <input
                {...register('speakerRole')}
                placeholder="Contoh: Senior Frontend Lead di Tokopedia"
                style={inputStyleClean}
              />
            </div>
          </div>

          {/* Field & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Bidang <span style={{ color: '#ef4444' }}>*</span></label>
              <Controller
                control={control}
                name="field"
                render={({ field }) => (
                  <CleanCombobox
                    options={FIELD_OPTS.map(f => ({ value: f, label: FIELD_LABELS[f] }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pilih Bidang"
                    width="100%"
                  />
                )}
              />
            </div>
            <div>
              <label style={labelStyle}>Harga Tiket (Rp) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="number"
                {...register('price', { valueAsNumber: true })}
                placeholder="0 (Gratis)"
                min={0}
                style={inputStyleClean}
              />
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: 3, display: 'block' }}>
                Masukkan 0 jika webinar diselenggarakan gratis.
              </span>
            </div>
          </div>

          {/* Schedule & Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Tanggal & Waktu Pelaksanaan <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="datetime-local"
                {...register('scheduledAt')}
                style={inputStyleClean}
              />
              {errors.scheduledAt && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: 4 }}>{errors.scheduledAt.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Durasi (menit) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="number"
                {...register('duration', { valueAsNumber: true })}
                min={1}
                placeholder="90"
                style={inputStyleClean}
              />
            </div>
          </div>

          {/* Meeting Link & Quota */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Link Room (Zoom / Google Meet)</label>
              <input
                {...register('meetingUrl')}
                placeholder="https://meet.google.com/... atau Zoom link"
                style={inputStyleClean}
              />
            </div>
            <div>
              <label style={labelStyle}>Batas Kuota</label>
              <input
                type="number"
                {...register('quota', { setValueAs: v => (v === '' ? null : Number(v)) })}
                placeholder="Kosongkan jika tak terbatas"
                min={1}
                style={inputStyleClean}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Deskripsi Sesi <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Jelaskan poin-poin materi dan apa yang akan dipelajari dalam sesi ini..."
              style={{ ...inputStyleClean, resize: 'vertical' }}
            />
            {errors.description && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: 4 }}>{errors.description.message}</p>}
          </div>

          {/* Status & Template Sertifikat */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Status Publikasi <span style={{ color: '#ef4444' }}>*</span></label>
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
                  />
                )}
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '11px 22px', borderRadius: 10, border: '1px solid #e2e8f0',
                background: '#fff', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', color: '#64748b',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                padding: '11px 24px', borderRadius: 10, border: 'none',
                background: 'var(--color-primary)', color: '#fff', fontSize: '13.5px', fontWeight: 700,
                cursor: 'pointer', opacity: mutation.isPending ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              {mutation.isPending ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Buat Webinar')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Main Admin Webinars Page ──────────────────────────────
export default function AdminWebinarsPage() {
  const [search, setSearch] = useState('')
  const [field, setField] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<WebinarItem | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WebinarItem | null>(null)

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'webinars', { search, field, status, page }],
    placeholderData: keepPreviousData,
    queryFn: () =>
      api.get('/admin/webinars', {
        params: {
          search: search || undefined,
          field: field === 'ALL' ? undefined : field,
          status: status === 'ALL' ? undefined : status,
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

  const items: WebinarItem[] = data?.items ?? []
  const pagination = data?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminPageHeader
        title="Webinar & Workshop"
        description="Kelola jadwal webinar live, narasumber, link streaming, dan peserta terdaftar."
        action={
          <button
            onClick={() => setModal('new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: '10px',
              background: 'var(--color-primary)', color: '#ffffff',
              border: 'none', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            <Plus size={16} /> Buat Webinar
          </button>
        }
      />

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cari webinar atau pembicara..."
          style={{
            padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
            background: 'var(--color-surface)', fontSize: '13px', outline: 'none',
            minWidth: 260, flex: 1, maxWidth: 340,
          }}
        />

        <CleanCombobox
          options={[
            { value: 'ALL', label: 'Semua Bidang' },
            ...FIELD_OPTS.map(f => ({ value: f, label: FIELD_LABELS[f] })),
          ]}
          value={field}
          onChange={val => { setField(val); setPage(1) }}
          placeholder="Pilih Bidang"
          width={180}
        />

        <CleanCombobox
          options={[
            { value: 'ALL', label: 'Semua Status' },
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'DRAFT', label: 'Draft' },
          ]}
          value={status}
          onChange={val => { setStatus(val); setPage(1) }}
          placeholder="Pilih Status"
          width={160}
        />
      </div>

      {/* Data Table */}
      {isLoading ? (
        <AdminTableSkeleton rows={6} cols={6} />
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
                {['#', 'Webinar & Speaker', 'Jadwal & Waktu', 'Bidang', 'Harga', 'Pendaftar', 'Status', 'Aksi'].map(h => (
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

                  {/* Title & Speaker */}
                  <td style={{ padding: '14px 18px', maxWidth: 280 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 3, lineHeight: 1.3 }}>
                      {w.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      🎙️ {w.speakerName} {w.speakerRole ? `• ${w.speakerRole}` : ''}
                    </div>
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

                  {/* Field */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                      background: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-primary)',
                    }}>
                      {FIELD_LABELS[w.field] ?? w.field}
                    </span>
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
                    <AdminStatusChip status={w.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => setModal(w)}
                        title="Edit Webinar"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                          borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#334155',
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>

                      <Link
                        href={`/admin/webinars/${w.id}/participants`}
                        title="Lihat Pendaftar"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                          borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff',
                          fontSize: '12px', fontWeight: 600, textDecoration: 'none', color: '#334155',
                        }}
                      >
                        <Users size={12} /> Peserta
                      </Link>

                      <button
                        onClick={() => setDeleteTarget(w)}
                        title="Hapus Webinar"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 6, border: '1px solid #fee2e2',
                          background: '#fff', color: '#ef4444', cursor: 'pointer',
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
