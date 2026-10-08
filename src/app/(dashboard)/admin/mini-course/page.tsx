'use client'
// src/app/admin/mini-course/page.tsx
// List Mini Course + Modal Buat/Edit
// Sesuai concept doc Section 5A + 5B

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Layers, BarChart2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import { formatRupiah } from '@/lib/utils'
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

// ─── Schema (sesuai design_superadmin.md) ─────────────────
const miniCourseSchema = z.object({
  title:       z.string().min(5, 'Minimal 5 karakter'),
  descShort:   z.string().max(160, 'Maks 160 karakter'),
  descLong:    z.string().min(20, 'Minimal 20 karakter'),
  field:       z.enum(['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'], { error: () => ({ message: 'Pilih bidang' }) }),
  price:       z.number().min(0),
  accessDays:  z.number().min(1).max(3650),
  totalDuration: z.number().min(1),
  status:      z.enum(['DRAFT', 'PUBLISHED'], { error: () => ({ message: 'Pilih status' }) }),
  certificateTemplateId: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
})
type CourseForm = z.infer<typeof miniCourseSchema>

// ─── Types ─────────────────────────────────────────────────
interface MiniCourse {
  id: string; title: string; field: string; price: number
  accessDays: number; totalDuration: number; status: string
  descShort?: string; rating?: number
  certificateTemplateId?: string
  thumbnailUrl?: string
  isFeatured?: boolean
  _count?: { enrollments: number }
}
interface Filters { field?: string; status?: string; search?: string; page: number; limit: number }

const FIELD_OPTS = ['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'] as const
const FIELD_LABELS: Record<string, string> = { UI_UX: 'UI/UX', FRONTEND: 'Frontend', BACKEND: 'Backend', MOBILE: 'Mobile' }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)',
  background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none',
}

// ─── Course Modal ──────────────────────────────────────────
function CourseModal({ course, onClose }: { course?: MiniCourse; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!course

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const { register, handleSubmit, control, formState: { errors } } = useForm<CourseForm>({
    resolver: zodResolver(miniCourseSchema),
    defaultValues: {
      title:         course?.title ?? '',
      descShort:     course?.descShort ?? '',
      descLong:      '',
      field:         course?.field ?? ('' as any),
      price:         course?.price ?? 0,
      accessDays:    course?.accessDays ?? 180,
      totalDuration: course?.totalDuration ?? 60,
      status:        course?.status ?? ('' as any),
      certificateTemplateId: course?.certificateTemplateId ?? null,
      thumbnailUrl:  course?.thumbnailUrl ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CourseForm) =>
      isEdit
        ? api.patch(`/mini-course/${course!.id}`, data).then(r => r.data)
        : api.post('/mini-course', data).then(r => r.data),
    onSuccess: () => {
      toast.success(isEdit ? 'Mini course diperbarui.' : 'Mini course dibuat.')
      qc.invalidateQueries({ queryKey: ['admin', 'courses']})
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan.'),
  })

  const { data: templatesData } = useQuery({
    queryKey: ['admin', 'certificate-templates'],
    queryFn: () => api.get('/admin/certificate-templates').then(r => r.data),
  })
  const templateOptions = (templatesData?.data || [])
    .filter((t: any) => t.isActive && t.type === 'MINI_COURSE')
    .map((t: any) => ({ value: t.id, label: t.name }))

  const inputStyleClean: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(0,0,0,0.06)',
    fontSize: '14px', outline: 'none',
    background: '#f9fafb',
    color: 'var(--color-text-primary)',
    transition: 'all 0.2s ease',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: 8,
    color: 'var(--color-text-secondary)'
  }

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
      }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
        style={{
          background: '#ffffff', borderRadius: '24px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)', width: '100%', maxWidth: 640,
          margin: 'auto'
        }}>
        <div style={{
          padding: '32px 32px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {isEdit ? 'Edit Mini Course' : 'Buat Mini Course Baru'}
          </h2>
          <button onClick={onClose} style={{ 
            background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer', 
            color: 'var(--color-text-tertiary)', width: 36, height: 36, borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' 
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ padding: '0 32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Judul <span style={{color: 'var(--color-error)'}}>*</span></label>
            <input {...register('title')} style={inputStyleClean} placeholder="Belajar Figma dari Nol" 
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.title && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.title.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>Gambar Thumbnail</label>
            <Controller
              control={control}
              name="thumbnailUrl"
              render={({ field }) => (
                <ImageUpload value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Deskripsi Singkat <span style={{color: 'var(--color-error)'}}>*</span></label>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Max 160 karakter</span>
            </div>
            <textarea {...register('descShort')} rows={2} style={{ ...inputStyleClean, resize: 'vertical' }} placeholder="Deskripsi singkat yang menarik..." 
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.descShort && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.descShort.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>Deskripsi Lengkap <span style={{color: 'var(--color-error)'}}>*</span></label>
            <textarea {...register('descLong')} rows={4} style={{ ...inputStyleClean, resize: 'vertical' }} placeholder="Deskripsi lengkap kursus..." 
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.descLong && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.descLong.message}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Bidang <span style={{color: 'var(--color-error)'}}>*</span></label>
              <Controller
                control={control}
                name="field"
                render={({ field }) => (
                  <CleanCombobox 
                    options={FIELD_OPTS.map(f => ({ value: f, label: FIELD_LABELS[f] }))} 
                    value={field.value as string} 
                    onChange={field.onChange} 
                    placeholder="Pilih Bidang"
                    width="100%"
                  />
                )}
              />
              {errors.field && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: 4, fontWeight: 500 }}>{errors.field.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Harga (Rp) <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="number" {...register('price', { valueAsNumber: true })} style={inputStyleClean} min={0} placeholder="149000" 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Durasi Akses (hari) <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="number" {...register('accessDays', { valueAsNumber: true })} style={inputStyleClean} min={1} placeholder="180" 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 6 }}>Dihitung sejak tanggal pembelian.</p>
            </div>
            <div>
              <label style={labelStyle}>Estimasi Total Durasi (menit) <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="number" {...register('totalDuration', { valueAsNumber: true })} style={inputStyleClean} min={1} placeholder="300" 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Status <span style={{color: 'var(--color-error)'}}>*</span></label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <CleanCombobox 
                  options={[
                    { value: 'DRAFT', label: 'DRAFT' },
                    { value: 'PUBLISHED', label: 'PUBLISHED' }
                  ]}
                  value={field.value as string} 
                  onChange={field.onChange} 
                  placeholder="Pilih Status"
                  width="100%"
                />
              )}
            />
            {errors.status && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: 4, fontWeight: 500 }}>{errors.status.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>Template Sertifikat</label>
            <Controller
              control={control}
              name="certificateTemplateId"
              render={({ field }) => (
                <CleanCombobox 
                  options={[{ value: '', label: 'Tanpa Sertifikat' }, ...templateOptions]}
                  value={field.value as string ?? ''} 
                  onChange={val => field.onChange(val === '' ? null : val)} 
                  placeholder="Pilih Template"
                  width="100%"
                  direction="up"
                  style={{...inputStyleClean, padding: '12px 16px', background: '#fff'}}
                />
              )}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ 
              padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', 
              background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-secondary)',
              transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              Batal
            </button>
            <button type="submit" disabled={mutation.isPending} style={{ 
              padding: '12px 24px', borderRadius: '12px', border: 'none', 
              background: 'var(--color-primary)', color: '#fff', fontSize: '14px', fontWeight: 600, 
              cursor: 'pointer', opacity: mutation.isPending ? 0.7 : 1, transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={e => { if (!mutation.isPending) e.currentTarget.style.filter = 'brightness(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
            >
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Mini Course'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────────
let _cachedCourses: MiniCourse[] = []
let _cachedPagination: any = null
let _courseHasLoaded = false

export default function AdminMiniCoursePage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 10 })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'new' | MiniCourse>(null)
  const [deleteTarget, setDeleteTarget] = useState<MiniCourse | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'courses', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get('/mini-course', { params: filters }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

  if (data?.items !== undefined) {
    _cachedCourses = data.items
    _cachedPagination = data.pagination
    _courseHasLoaded = true
  }

  const items: MiniCourse[] = _cachedCourses
  const pagination = _cachedPagination

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: search || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getEmptyMessage = () => {
    if (!filters.search && !filters.field && !filters.status) {
      return "Sistem belum mendeteksi adanya data Mini Course. Silakan buat Mini Course baru terlebih dahulu."
    }
    const parts = []
    if (filters.search) parts.push(`kata kunci "${filters.search}"`)
    if (filters.field) parts.push(`bidang "${FIELD_LABELS[filters.field] ?? filters.field}"`)
    if (filters.status) parts.push(`status "${filters.status}"`)
    
    return `Sistem tidak menemukan Mini Course dengan kriteria: ${parts.join(', ')}.`
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/mini-course/${id}`),
    onSuccess: () => {
      toast.success('Mini course dihapus.')
      qc.invalidateQueries({ queryKey: ['admin', 'courses']})
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus.'),
  })

  const featuredMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      api.patch(`/admin/courses/${id}/featured`, { isFeatured }),
    onSuccess: () => {
      toast.success('Status Featured diperbarui!')
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
    },
    onError: () => toast.error('Gagal memperbarui Featured.'),
  })

  return (
    <div>
      <AdminPageHeader
        title="Mini Course"
        description="Kelola semua Mini Course Metro Institute."
        action={
          <button suppressHydrationWarning onClick={() => setModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> Buat Mini Course
          </button>
        }
      />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          suppressHydrationWarning
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari judul course..."
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300 }}
        />
        <CleanCombobox
          value={filters.field ?? ''}
          onChange={val => setFilters(f => ({ ...f, field: val || undefined, page: 1 }))}
          placeholder="Semua Bidang"
          options={FIELD_OPTS.map(f => ({ value: f, label: FIELD_LABELS[f] }))}
          width={180}
        />
        <CleanCombobox
          value={filters.status ?? ''}
          onChange={val => setFilters(f => ({ ...f, status: val || undefined, page: 1 }))}
          placeholder="Semua Status"
          options={[
            { value: 'DRAFT', label: 'Draft' },
            { value: 'PUBLISHED', label: 'Tayang' }
          ]}
          width={180}
        />
      </div>

      {/* Table */}
      <div style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait">
          {!_courseHasLoaded && isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AdminTableSkeleton rows={8} cols={9} />
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AdminEmptyState 
                type={filters.search || filters.field || filters.status ? 'no-results' : 'empty'} 
                message={getEmptyMessage()} 
                action={<button onClick={() => setModal('new')} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>Buat Mini Course</button>} 
              />
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  {['#', 'Judul', 'Bidang', 'Harga', 'Akses', 'Siswa', 'Rating', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((c, i) => (
                  <tr key={c.id}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-tertiary)' }}>{(filters.page - 1) * filters.limit + i + 1}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                      {c.descShort && <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.descShort}</div>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{FIELD_LABELS[c.field] ?? c.field}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>{c.price === 0 ? 'Gratis' : formatRupiah(c.price)}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{c.accessDays} hari</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>{c._count?.enrollments ?? 0}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{c.rating != null ? `⭐ ${c.rating.toFixed(1)}` : '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><AdminStatusChip status={c.status} /></td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 6, whiteSpace: 'nowrap' }}>
                        <button onClick={() => setModal(c)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = 'var(--color-primary)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#374151' }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <Link href={`/admin/mini-course/${c.id}/curriculum`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = 'var(--color-primary)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#374151' }}
                        >
                          <Layers size={12} /> Kurikulum
                        </Link>
                        <Link href={`/admin/mini-course/${c.id}/stats`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = 'var(--color-primary)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#374151' }}
                        >
                          <BarChart2 size={12} /> Statistik
                        </Link>
                        {/* Featured Toggle */}
                        <button
                          title={c.isFeatured ? 'Hapus dari Featured (Landing Page)' : 'Tampilkan di Landing Page sebagai Featured'}
                          onClick={() => featuredMutation.mutate({ id: c.id, isFeatured: !c.isFeatured })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', borderRadius: 'var(--radius-md)',
                            border: `1px solid ${c.isFeatured ? '#F59E0B' : 'var(--color-border)'}`,
                            background: c.isFeatured ? '#FEF3C7' : 'transparent',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            color: c.isFeatured ? '#D97706' : 'var(--color-text-tertiary)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {c.isFeatured ? '⭐ Featured' : '☆ Feature'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <AdminPagination
              page={filters.page} totalPages={pagination.totalPages}
              limit={filters.limit} total={pagination.total}
              onPageChange={p => setFilters(f => ({ ...f, page: p }))}
              onLimitChange={l => setFilters(f => ({ ...f, limit: l, page: 1 }))}
            />
          )}
        </motion.div>
      )}
      </AnimatePresence>
      </div>

      <AnimatePresence>
        {modal && <CourseModal course={modal === 'new' ? undefined : modal as MiniCourse} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  )
}
