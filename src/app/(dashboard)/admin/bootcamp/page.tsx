'use client'
// src/app/admin/bootcamp/page.tsx
// Sesuai concept doc Section 4A + 4B
// List Bootcamp + Modal Buat/Edit + Status DRAFT→PUBLISHED→OPEN→ONGOING→COMPLETED

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Users, CalendarDays, Layers, X } from 'lucide-react'
import api from '@/lib/axios'
import { formatRupiah, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import { motion, AnimatePresence } from 'motion/react'
import CleanCombobox from '@/components/admin/CleanCombobox'
import FieldMultiSelect from '@/components/admin/FieldMultiSelect'
import { toast } from 'sonner'

// ─── Schema (sesuai design_superadmin.md Zod Schemas) ─────
const bootcampSchema = z.object({
  name:            z.string().min(5, 'Minimal 5 karakter'),
  description:     z.string().min(20, 'Minimal 20 karakter'),
  fields:          z.array(z.enum(['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'])).min(1, 'Pilih minimal 1 bidang'),
  price:           z.number().min(0, 'Harga tidak boleh negatif'),
  purchaseOpenAt:  z.string().min(1, 'Wajib diisi'),
  purchaseCloseAt: z.string().min(1, 'Wajib diisi'),
  startDate:       z.string().min(1, 'Wajib diisi'),
  endDate:         z.string().min(1, 'Wajib diisi'),
  status:          z.enum(['DRAFT', 'PUBLISHED', 'OPEN', 'ONGOING', 'COMPLETED']),
  certificateTemplateId: z.string().optional().nullable(),
})

type BootcampForm = z.infer<typeof bootcampSchema>

// ─── Types ─────────────────────────────────────────────────
interface Bootcamp {
  id: string; name: string; fields: string[]; status: string
  price: number; purchaseOpenAt: string; purchaseCloseAt: string
  startDate: string; endDate: string; thumbnailUrl?: string
  certificateTemplateId?: string
  isFeatured?: boolean
  _count?: { registrations: number }
}

interface BootcampFilters {
  field?: string; status?: string; search?: string; page: number; limit: number
}

const FIELD_OPTS = ['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'] as const
const FIELD_LABELS: Record<string, string> = { UI_UX: 'UI/UX', FRONTEND: 'Frontend', BACKEND: 'Backend', MOBILE: 'Mobile' }
const STATUS_OPTS = ['DRAFT', 'PUBLISHED', 'OPEN', 'ONGOING', 'COMPLETED'] as const
const STATUS_NEXT: Record<string, string> = { DRAFT: 'PUBLISHED', PUBLISHED: 'OPEN', OPEN: 'ONGOING', ONGOING: 'COMPLETED', COMPLETED: '' }

// ─── Input / Select style helpers ─────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)', outline: 'none',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
}

// ─── Modal Buat/Edit Bootcamp ──────────────────────────────
function BootcampModal({
  bootcamp, onClose,
}: { bootcamp?: Bootcamp; onClose: () => void }) {
  const router = useRouter() // Don't forget to import useRouter from next/navigation
  const qc = useQueryClient()
  const isEdit = !!bootcamp

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<BootcampForm>({
    resolver: zodResolver(bootcampSchema),
    defaultValues: {
      name:            bootcamp?.name ?? '',
      description:     '',
      fields:          bootcamp?.fields as any ?? [],
      price:           bootcamp?.price ?? 0,
      purchaseOpenAt:  bootcamp?.purchaseOpenAt?.slice(0, 10) ?? '',
      purchaseCloseAt: bootcamp?.purchaseCloseAt?.slice(0, 10) ?? '',
      startDate:       bootcamp?.startDate?.slice(0, 10) ?? '',
      endDate:         bootcamp?.endDate?.slice(0, 10) ?? '',
      status:          (bootcamp?.status as any) ?? 'DRAFT',
      certificateTemplateId: bootcamp?.certificateTemplateId ?? null,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: BootcampForm) =>
      isEdit
        ? api.patch(`/bootcamp/${bootcamp!.id}`, data).then(r => r.data)
        : api.post('/bootcamp', data).then(r => r.data),
    onSuccess: (data) => {
      toast.success(isEdit ? 'Bootcamp diperbarui.' : 'Bootcamp berhasil dibuat!')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamps'] })
      onClose()
      
      // Jika ini pembuatan baru, otomatis redirect ke halaman Silabus
      if (!isEdit && data?.data?.id) {
        router.push(`/admin/bootcamp/${data.data.id}/syllabus`)
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan.'),
  })

  const { data: templatesData } = useQuery({
    queryKey: ['admin', 'certificate-templates'],
    queryFn: () => api.get('/admin/certificate-templates').then(r => r.data),
  })
  const templateOptions = (templatesData?.data || [])
    .filter((t: any) => t.isActive && t.type === 'BOOTCAMP')
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
            {isEdit ? 'Edit Bootcamp' : 'Buat Bootcamp Baru'}
          </h2>
          <button type="button" onClick={onClose} style={{ 
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
            <label style={labelStyle}>Nama Bootcamp <span style={{color: 'var(--color-error)'}}>*</span></label>
            <input {...register('name')} style={inputStyleClean} placeholder="Bootcamp UI/UX Profesional Batch 3" 
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.name && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.name.message}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <CleanCombobox 
                    options={STATUS_OPTS.map(s => ({ value: s, label: s }))}
                    value={field.value as string} 
                    onChange={field.onChange} 
                    placeholder="Pilih Status"
                    width="100%"
                    direction="down"
                    style={{...inputStyleClean, padding: '12px 16px', background: '#fff'}}
                  />
                )}
              />
            </div>
            <div>
              <label style={labelStyle}>Harga (Rp) <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="number" {...register('price', { valueAsNumber: true })} style={inputStyleClean} placeholder="1500000" min={0} 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Bidang <span style={{color: 'var(--color-error)'}}>*</span></label>
            <FieldMultiSelect
              options={FIELD_OPTS.map(f => ({ value: f, label: FIELD_LABELS[f] }))}
              value={(watch('fields') as string[]) ?? []}
              onChange={val => setValue('fields', val as any)}
              placeholder="Pilih Bidang"
            />
            {errors.fields && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.fields.message}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Buka Pembelian <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="date" {...register('purchaseOpenAt')} style={inputStyleClean} 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Tutup Pembelian <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="date" {...register('purchaseCloseAt')} style={inputStyleClean} 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Mulai <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="date" {...register('startDate')} style={inputStyleClean} 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Berakhir <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="date" {...register('endDate')} style={inputStyleClean} 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
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
                  direction="down"
                  style={{...inputStyleClean, padding: '12px 16px', background: '#fff'}}
                />
              )}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Deskripsi <span style={{color: 'var(--color-error)'}}>*</span></label>
            </div>
            <textarea {...register('description')} rows={3} style={{ ...inputStyleClean, resize: 'vertical' }} placeholder="Deskripsi bootcamp minimal 20 karakter..." 
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.description && <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 6, fontWeight: 500 }}>{errors.description.message}</p>}
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
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Bootcamp'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────────
let _cachedBootcamps: Bootcamp[] = []
let _cachedPagination: any = null
let _bootcampHasLoaded = false

export default function AdminBootcampPage() {
  const [filters, setFilters] = useState<BootcampFilters>({ page: 1, limit: 10 })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'new' | Bootcamp>(null)
  const qc = useQueryClient()

  const featuredMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      api.patch(`/admin/bootcamps/${id}/featured`, { isFeatured }),
    onSuccess: () => {
      toast.success('Status Featured diperbarui!')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamps'] })
    },
    onError: () => toast.error('Gagal memperbarui Featured.'),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'bootcamps', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get('/bootcamp', { params: filters }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

  if (data?.items !== undefined) {
    _cachedBootcamps = data.items
    _cachedPagination = data.pagination
    _bootcampHasLoaded = true
  }

  const items: Bootcamp[] = _cachedBootcamps
  const pagination = _cachedPagination

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: search || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getEmptyMessage = () => {
    if (!filters.search && !filters.field && !filters.status) {
      return "Sistem belum mendeteksi adanya data program Bootcamp. Silakan buat program baru terlebih dahulu."
    }
    const parts = []
    if (filters.search) parts.push(`kata kunci "${filters.search}"`)
    if (filters.field) parts.push(`bidang "${FIELD_LABELS[filters.field] ?? filters.field}"`)
    if (filters.status) parts.push(`status "${filters.status}"`)
    
    return `Sistem tidak menemukan program Bootcamp dengan kriteria: ${parts.join(', ')}.`
  }

  return (
    <div>
      <AdminPageHeader
        title="Bootcamp"
        description="Kelola semua program Bootcamp Metro Institute."
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
            <Plus size={16} /> Buat Bootcamp Baru
          </button>
        }
      />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          suppressHydrationWarning
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama bootcamp..."
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
          options={STATUS_OPTS.map(s => ({ value: s, label: s }))}
          width={180}
        />
      </div>

      {/* Table */}
      <div style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait">
          {!_bootcampHasLoaded && isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AdminTableSkeleton rows={8} cols={9} />
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AdminEmptyState
                type={filters.search || filters.field || filters.status ? 'no-results' : 'empty'}
                message={getEmptyMessage()}
                action={<button onClick={() => setModal('new')} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>Buat Bootcamp</button>}
              />
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  {['#', 'Nama', 'Bidang', 'Harga', 'Peserta', 'Buka Beli', 'Mulai', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((b, i) => (
                  <tr key={b.id}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                      {(filters.page - 1) * filters.limit + i + 1}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {b.fields.map(f => (
                          <span key={f} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                            {FIELD_LABELS[f] ?? f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, whiteSpace: 'nowrap' }}>{formatRupiah(b.price)}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {b._count?.registrations ?? 0}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {formatDate(b.purchaseOpenAt)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {formatDate(b.startDate)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <AdminStatusChip status={b.status} />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 6, whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setModal(b)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <Link href={`/admin/bootcamp/${b.id}/syllabus`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 500, textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                          <Layers size={12} /> Silabus
                        </Link>
                        <Link href={`/admin/bootcamp/${b.id}/schedules`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 500, textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                          <CalendarDays size={12} /> Jadwal
                        </Link>
                        <Link href={`/admin/bootcamp/${b.id}/participants`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 500, textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                          <Users size={12} /> Peserta
                        </Link>
                        {/* Featured Toggle */}
                        <button
                          title={b.isFeatured ? 'Hapus dari Featured (Landing Page)' : 'Tampilkan di Landing Page sebagai Featured'}
                          onClick={() => featuredMutation.mutate({ id: b.id, isFeatured: !b.isFeatured })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', borderRadius: 'var(--radius-md)',
                            border: `1px solid ${b.isFeatured ? '#F59E0B' : 'var(--color-border)'}`,
                            background: b.isFeatured ? '#FEF3C7' : 'transparent',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            color: b.isFeatured ? '#D97706' : 'var(--color-text-tertiary)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {b.isFeatured ? '⭐ Featured' : '☆ Feature'}
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
              page={filters.page}
              totalPages={pagination.totalPages}
              limit={filters.limit}
              total={pagination.total}
              onPageChange={p => setFilters(f => ({ ...f, page: p }))}
              onLimitChange={l => setFilters(f => ({ ...f, limit: l, page: 1 }))}
            />
          )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <BootcampModal
            bootcamp={modal === 'new' ? undefined : modal as Bootcamp}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
