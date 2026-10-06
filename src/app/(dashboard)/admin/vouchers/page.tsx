'use client'
// src/app/admin/vouchers/page.tsx
// Kelola Voucher Diskon
// Sesuai concept doc Section 10 + Prisma Voucher model:
// id, code, discountType (FIXED/PERCENT), discountValue, maxUses, usedCount,
// validFrom, validUntil, isActive, productType (BOOTCAMP/MINI_COURSE/ALL)
// CATATAN: TIDAK ADA field minAmount (sesuai architecture.md)

import {  useState , useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, Copy, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import { formatDate, formatRupiah } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

let _cachedVouchers: Voucher[] = []
let _cachedPagination: any = null
let _vouchersHasLoaded = false

// ─── Types ─────────────────────────────────────────────────
interface Voucher {
  id: string; code: string
  discountType: 'FIXED' | 'PERCENT'
  discountValue: number; maxUses: number; usedCount: number
  validFrom: string; validUntil: string; isActive: boolean
  productType: 'BOOTCAMP' | 'MINI_COURSE' | 'ALL'
}
interface Filters { isActive?: boolean | string; search?: string; page: number; limit: number }

// ─── Zod Schema ────────────────────────────────────────────
const voucherSchema = z.object({
  code:          z.string().min(4, 'Minimal 4 karakter').max(20, 'Maks 20 karakter').regex(/^[A-Z0-9_-]+$/, 'Hanya huruf kapital, angka, - dan _'),
  discountType:  z.enum(['FIXED', 'PERCENT']),
  discountValue: z.number().min(1, 'Minimal 1'),
  maxUses:       z.number().min(1, 'Minimal 1'),
  validFrom:     z.string().min(1, 'Wajib diisi'),
  validUntil:    z.string().min(1, 'Wajib diisi'),
  productType:   z.enum(['BOOTCAMP', 'MINI_COURSE', 'ALL']),
  isActive:      z.boolean(),
})
type VoucherForm = z.infer<typeof voucherSchema>

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)',
  background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none',
}

// ─── Voucher Modal ─────────────────────────────────────────
function VoucherModal({ voucher, onClose }: { voucher?: Voucher; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!voucher

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<VoucherForm>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      code:          voucher?.code ?? '',
      discountType:  voucher?.discountType ?? 'PERCENT',
      discountValue: voucher?.discountValue ?? 20,
      maxUses:       voucher?.maxUses ?? 100,
      validFrom:     voucher?.validFrom?.slice(0, 10) ?? '',
      validUntil:    voucher?.validUntil?.slice(0, 10) ?? '',
      productType:   voucher?.productType ?? 'ALL',
      isActive:      voucher?.isActive ?? true,
    },
  })

  const discountType = watch('discountType')

  const mutation = useMutation({
    mutationFn: (data: VoucherForm) =>
      isEdit
        ? api.patch(`/voucher/${voucher!.id}`, data).then(r => r.data)
        : api.post('/voucher', data).then(r => r.data),
    onSuccess: () => {
      toast.success(isEdit ? 'Voucher diperbarui.' : 'Voucher dibuat.')
      qc.invalidateQueries({ queryKey: ['admin', 'vouchers']})
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan.'),
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }} 
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
        style={{ background: '#ffffff', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)', width: '100%', maxWidth: 540, margin: 'auto' }}
      >
        
        {/* Header */}
        <div style={{
          padding: '32px 32px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {isEdit ? 'Edit Voucher' : 'Buat Voucher Baru'}
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

        {/* Form */}
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ padding: '0 32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Kode */}
          <div>
            <label style={labelStyle}>Kode Voucher <span style={{color: 'var(--color-error)'}}>*</span> <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400, marginLeft: 4 }}>(huruf kapital, angka, -, _)</span></label>
            <input {...register('code')} 
              style={{ ...inputStyleClean, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }} 
              placeholder="METRO20" 
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.code && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: 6, fontWeight: 500 }}>{errors.code.message}</p>}
          </div>

          {/* Tipe + Nilai diskon */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Tipe Diskon <span style={{color: 'var(--color-error)'}}>*</span></label>
              <Controller
                control={control}
                name="discountType"
                render={({ field }) => (
                  <CleanCombobox
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: 'PERCENT', label: 'Persentase (%)' },
                      { value: 'FIXED', label: 'Nominal Tetap (Rp)' }
                    ]}
                    placeholder="Pilih Tipe Diskon"
                    style={{ ...inputStyleClean, boxShadow: 'none' }}
                  />
                )}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Nilai Diskon <span style={{color: 'var(--color-error)'}}>*</span> <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400, marginLeft: 4 }}>{discountType === 'PERCENT' ? '(1–100%)' : '(Rp)'}</span>
              </label>
              <input type="number" {...register('discountValue', { valueAsNumber: true })} 
                style={inputStyleClean} 
                min={1} 
                max={discountType === 'PERCENT' ? 100 : undefined} 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
              {errors.discountValue && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: 6, fontWeight: 500 }}>{errors.discountValue.message}</p>}
            </div>
          </div>

          {/* Kuota + Produk */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Maks Penggunaan <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="number" {...register('maxUses', { valueAsNumber: true })} 
                style={inputStyleClean} 
                min={1} 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Berlaku untuk <span style={{color: 'var(--color-error)'}}>*</span></label>
              <Controller
                control={control}
                name="productType"
                render={({ field }) => (
                  <CleanCombobox
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: 'ALL', label: 'Semua Produk' },
                      { value: 'BOOTCAMP', label: 'Bootcamp saja' },
                      { value: 'MINI_COURSE', label: 'Mini Course saja' }
                    ]}
                    placeholder="Pilih Produk"
                    style={{ ...inputStyleClean, boxShadow: 'none' }}
                  />
                )}
              />
            </div>
          </div>

          {/* Masa Berlaku */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Mulai Berlaku <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="date" {...register('validFrom')} 
                style={inputStyleClean} 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Berakhir <span style={{color: 'var(--color-error)'}}>*</span></label>
              <input type="date" {...register('validUntil')} 
                style={inputStyleClean} 
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>

          {/* Status aktif */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Checkbox 
                  id="vIsActive" 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="h-4 w-4 rounded-sm border-2 border-[var(--color-border)] data-[state=checked]:border-primary"
                />
              )}
            />
            <label htmlFor="vIsActive" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', cursor: 'pointer', userSelect: 'none' }}>
              Voucher aktif (dapat digunakan oleh mentee)
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onClose} style={{
              padding: '12px 24px', borderRadius: '12px',
              border: 'none', background: 'transparent', color: 'var(--color-text-secondary)',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >Batal</button>
            <button type="submit" disabled={mutation.isPending} style={{
              padding: '12px 24px', borderRadius: '12px',
              border: 'none', background: 'var(--color-primary)', color: '#fff',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              opacity: mutation.isPending ? 0.7 : 1, transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Voucher'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────────
export default function AdminVouchersPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 10 })
  const [modal, setModal] = useState<null | 'new' | Voucher>(null)
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null)
  const qc = useQueryClient()

  const [search, setSearch] = useState(filters.search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setFilters(f => ({ ...f, search: search || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getEmptyMessage = () => {
    if (!filters.search && filters.isActive === undefined) {
      return "Sistem belum mendeteksi adanya data Voucher."
    }
    const parts = []
    if (filters.search) parts.push(`kata kunci "${filters.search}"`)
    if (filters.isActive !== undefined) parts.push(`status "${filters.isActive ? 'Aktif' : 'Nonaktif'}"`)
    
    return `Sistem tidak menemukan Voucher dengan kriteria: ${parts.join(', ')}.`
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'vouchers', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get('/voucher', { params: filters }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

  if (data?.items !== undefined) {
    _cachedVouchers = data.items
    _cachedPagination = data.pagination
    _vouchersHasLoaded = true
  }

  const items: Voucher[] = _cachedVouchers
  const pagination = _cachedPagination

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/voucher/${id}`),
    onSuccess: () => {
      toast.success('Voucher dihapus.')
      qc.invalidateQueries({ queryKey: ['admin', 'vouchers']})
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus.'),
  })

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Kode "${code}" disalin.`)
  }

  return (
    <div>
      <AdminPageHeader
        title="Voucher"
        description="Kelola kode diskon untuk Bootcamp dan Mini Course."
        action={
          <button suppressHydrationWarning onClick={() => setModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> Buat Voucher
          </button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari kode voucher..."
          suppressHydrationWarning
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300 }}
        />
        <CleanCombobox
          value={filters.isActive?.toString() ?? ''}
          onChange={val => setFilters(f => ({ ...f, isActive: val === '' ? undefined : val === 'true', page: 1 }))}
          placeholder="Semua Status"
          options={[
            { value: 'true', label: 'Aktif' },
            { value: 'false', label: 'Nonaktif' }
          ]}
          width={180}
        />
      </div>

      {/* Table */}
      <AnimatePresence mode="wait">
        {!_vouchersHasLoaded && isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AdminTableSkeleton rows={8} cols={8} />
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ background: 'transparent' }}>
              <AdminEmptyState 
                type={filters.isActive !== undefined || filters.search ? 'no-results' : 'empty'} 
                message={getEmptyMessage()} 
                action={<button onClick={() => setModal('new')} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>Buat Voucher</button>} 
              />
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Kode', 'Diskon', 'Berlaku', 'Kuota', 'Produk', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(v => {
                  const now = new Date()
                  const validUntil = new Date(v.validUntil)
                  const isExpired = validUntil < now
                  const isFull = v.usedCount >= v.maxUses

                  return (
                    <tr key={v.id}
                      style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--text-base)', letterSpacing: '0.05em' }}>{v.code}</span>
                          <button onClick={() => copyCode(v.code)} style={{ width: 22, height: 22, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {v.discountType === 'PERCENT' ? `${v.discountValue}%` : formatRupiah(v.discountValue)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px' }}>
                        <div style={{ color: 'var(--color-text-secondary)' }}>{formatDate(v.validFrom)}</div>
                        <div style={{ color: isExpired ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>{formatDate(v.validUntil)} {isExpired ? '(Kadaluarsa)' : ''}</div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ height: 6, width: 60, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min((v.usedCount / v.maxUses) * 100, 100)}%`, background: isFull ? 'var(--color-error)' : 'var(--color-primary)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: '12px', color: isFull ? 'var(--color-error)' : 'var(--color-text-secondary)', fontWeight: 500 }}>{v.usedCount}/{v.maxUses}</span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {v.productType === 'ALL' ? 'Semua Produk' : v.productType === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <AdminStatusChip status={v.isActive && !isExpired && !isFull ? 'ACTIVE' : 'INACTIVE'} label={v.isActive && !isExpired && !isFull ? 'Aktif' : isExpired ? 'Kadaluarsa' : isFull ? 'Habis' : 'Nonaktif'} />
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setModal(v)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => setDeleteTarget(v)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-error)', background: 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-error)' }}>
                            <Trash2 size={12} /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      {modal && <VoucherModal voucher={modal === 'new' ? undefined : modal as Voucher} onClose={() => setModal(null)} />}
      <AdminConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus Voucher?"
        description={`Voucher "${deleteTarget?.code ?? ''}" akan dihapus permanen. Mentee yang sudah menggunakan voucher ini tidak terpengaruh.`}
        confirmText="HAPUS"
        confirmLabel="Ya, Hapus"
        isDangerous
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
