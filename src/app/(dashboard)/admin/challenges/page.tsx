'use client'
// src/app/admin/challenges/page.tsx
// Kelola Challenge Bank (QUIZ / PROJECT)
// Sesuai concept doc Section 6 + system_flow.md ChallengeType enum
// Challenge linked to BootcampSession.type=CHALLENGE via challengeId

import {  useState , useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { toast } from 'sonner'

// ─── Types (sesuai Prisma schema Challenge model) ──────────
interface Challenge {
  id: string; title: string; type: 'QUIZ' | 'PROJECT'
  field: string; maxScore: number; description?: string
  deadlineAt?: string
  options?: Array<{ id: string; question: string; options: Array<{ id: string; text: string; isCorrect: boolean; explanation?: string }> }>
  _count?: { attempts: number }
}
interface Filters { type?: string; field?: string; search?: string; page: number; limit: number }

// ─── Zod Schema ────────────────────────────────────────────
const challengeSchema = z.object({
  title:       z.string().min(5, 'Minimal 5 karakter'),
  description: z.string().min(10, 'Minimal 10 karakter'),
  type:        z.enum(['QUIZ', 'PROJECT'], { error: () => ({ message: 'Pilih tipe challenge' }) }),
  field:       z.enum(['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'], { error: () => ({ message: 'Pilih bidang' }) }),
  maxScore:    z.number().min(1).max(1000),
  options:     z.array(z.object({
    id: z.string(),
    question: z.string().min(5, 'Soal minimal 5 karakter'),
    options: z.array(z.object({
      id: z.string(),
      text: z.string().min(1, 'Pilihan tidak boleh kosong'),
      isCorrect: z.boolean()
    }))
  })).optional(),
}).refine(data => {
  if (data.type === 'QUIZ') {
    if (!data.options || data.options.length === 0) return false
    for (const q of data.options) {
      if (!q.options || q.options.length < 2) return false
      if (!q.options.some(o => o.isCorrect)) return false
    }
  }
  return true
}, {
  message: 'Setiap kuis minimal 1 soal, tiap soal minimal 2 pilihan dan 1 jawaban benar',
  path: ['type']
})
type ChallengeForm = z.infer<typeof challengeSchema>

const FIELD_LABELS: Record<string, string> = { UI_UX: 'UI/UX', FRONTEND: 'Frontend', BACKEND: 'Backend', MOBILE: 'Mobile' }
const FIELD_OPTS = ['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'] as const

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)',
  background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none',
}

// ─── Challenge Modal ───────────────────────────────────────
function ChallengeModal({ challenge, onClose }: { challenge?: Challenge; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!challenge

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<ChallengeForm>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title:       challenge?.title ?? '',
      description: challenge?.description ?? '',
      type:        challenge?.type ?? ('' as any),
      field:       challenge?.field ?? ('' as any),
      maxScore:    challenge?.maxScore ?? 100,
      options:     challenge?.options?.length && 'question' in challenge.options[0] 
        ? challenge.options 
        : [
          {
            id: 'q1',
            question: challenge?.description ?? '',
            options: [
              { id: 'A', text: '', isCorrect: true },
              { id: 'B', text: '', isCorrect: false },
              { id: 'C', text: '', isCorrect: false },
              { id: 'D', text: '', isCorrect: false }
            ]
          }
        ]
    },
  })

  const watchType = watch('type')
  const { fields, append, remove, update } = useFieldArray({ control, name: 'options' })

  const mutation = useMutation({
    mutationFn: (data: ChallengeForm) =>
      isEdit
        ? api.patch(`/challenge/${challenge!.id}`, data).then(r => r.data)
        : api.post('/challenge', data).then(r => r.data),
    onSuccess: () => {
      toast.success(isEdit ? 'Challenge diperbarui.' : 'Challenge dibuat.')
      qc.invalidateQueries({ queryKey: ['admin', 'challenges']})
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
       style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
       style={{ background: '#ffffff', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)', width: '100%', maxWidth: 640, margin: 'auto' }}>
        
        {/* Header */}
        <div style={{
          padding: '32px 32px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {isEdit ? 'Edit Challenge' : 'Buat Challenge Baru'}
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
          <div>
            <label style={labelStyle}>Judul Challenge <span style={{color: 'var(--color-error)'}}>*</span></label>
            <input {...register('title')} style={inputStyleClean} placeholder="Membuat Prototype Aplikasi E-Commerce" 
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.title && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: 6, fontWeight: 500 }}>{errors.title.message}</p>}
          </div>
          
          <div>
            <label style={labelStyle}>
              {watchType === 'QUIZ' ? 'Instruksi / Deskripsi Kuis' : 'Deskripsi / Instruksi'} <span style={{color: 'var(--color-error)'}}>*</span>
            </label>
            <textarea {...register('description')} rows={4} style={{ ...inputStyleClean, resize: 'vertical' }} placeholder={watchType === 'QUIZ' ? "Jelaskan instruksi kuis ini secara umum..." : "Jelaskan apa yang harus dikerjakan mentee..."} 
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            {errors.description && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: 6, fontWeight: 500 }}>{errors.description.message}</p>}
          </div>
          
          <div className="grid-cols-2" style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Tipe Challenge <span style={{color: 'var(--color-error)'}}>*</span></label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <CleanCombobox 
                    options={[
                      { value: 'QUIZ', label: 'Quiz' },
                      { value: 'PROJECT', label: 'Project' }
                    ]} 
                    value={field.value as string} 
                    onChange={field.onChange} 
                    placeholder="Pilih Tipe"
                  />
                )}
              />
              {errors.type && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: 6, fontWeight: 500 }}>{errors.type.message}</p>}
            </div>
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
                  />
                )}
              />
              {errors.field && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: 6, fontWeight: 500 }}>{errors.field.message}</p>}
            </div>
          </div>
          
          <div>
            <label style={labelStyle}>Skor Maksimal <span style={{color: 'var(--color-error)'}}>*</span></label>
            <input type="number" {...register('maxScore', { valueAsNumber: true })} style={inputStyleClean} min={1} max={1000} 
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 8 }}>Default 100. Untuk PROJECT, skor diberikan oleh admin saat menilai submission.</p>
          </div>
          
          <AnimatePresence>
            {watchType === 'QUIZ' && (
              <motion.div
                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div style={{ marginTop: 8, padding: '20px', background: '#f8f9fc', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Daftar Soal Kuis</label>
                    <button type="button" onClick={() => append({ id: Math.random().toString(36).substr(2, 9), question: '', options: [{ id: 'A', text: '', isCorrect: true }, { id: 'B', text: '', isCorrect: false }, { id: 'C', text: '', isCorrect: false }, { id: 'D', text: '', isCorrect: false }] })} style={{ padding: '6px 12px', borderRadius: '8px', background: '#fff', border: '1px solid var(--color-border)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Plus size={14} /> Tambah Soal
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {fields.map((field, qIndex) => (
                      <div key={field.id} style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', position: 'relative' }}>
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(qIndex)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,59,48,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: '6px', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                        <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: 12, color: 'var(--color-text-primary)' }}>Soal {qIndex + 1}</h4>
                        
                        <input
                          {...register(`options.${qIndex}.question` as const)}
                          placeholder="Ketik pertanyaan di sini..."
                          style={{ ...inputStyleClean, padding: '10px 14px', marginBottom: 16 }}
                          onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                          onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {field.options.map((opt, optIndex) => (
                            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                                {['A', 'B', 'C', 'D'][optIndex] || optIndex + 1}
                              </div>
                              <input
                                {...register(`options.${qIndex}.options.${optIndex}.text` as const)}
                                placeholder={`Pilihan ${['A', 'B', 'C', 'D'][optIndex] ?? optIndex + 1}...`}
                                style={{ ...inputStyleClean, flex: 1, padding: '8px 12px', fontSize: '13px' }}
                                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
                              />
                              <Controller
                                control={control}
                                name={`options.${qIndex}.options.${optIndex}.isCorrect` as const}
                                render={({ field: checkboxField }) => (
                                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 4px', height: 28 }}>
                                    <input 
                                      type="radio" 
                                      name={`correct_answer_${qIndex}`} 
                                      checked={checkboxField.value}
                                      onChange={() => {
                                        const newOptions = [...field.options];
                                        newOptions.forEach((o, i) => o.isCorrect = i === optIndex);
                                        update(qIndex, { ...field, options: newOptions });
                                      }}
                                      style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                                    />
                                  </label>
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {errors.options && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: 4, fontWeight: 500 }}>Periksa kembali kelengkapan soal Anda.</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Challenge'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

let _cachedChallenges: Challenge[] = []
let _cachedPagination: any = null
let _challengeHasLoaded = false

// ─── Page ──────────────────────────────────────────────────
export default function AdminChallengesPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 10 })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'new' | Challenge>(null)
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'challenges', filters], placeholderData: keepPreviousData,
    queryFn: () => api.get('/challenge', { params: filters }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

  if (data?.items !== undefined) {
    _cachedChallenges = data.items
    _cachedPagination = data.pagination
    _challengeHasLoaded = true
  }

  const items: Challenge[] = _cachedChallenges
  const pagination = _cachedPagination

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: search || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getEmptyMessage = () => {
    if (!filters.search && !filters.field && !filters.type) {
      return "Sistem belum mendeteksi adanya data Challenge. Silakan buat Challenge baru terlebih dahulu."
    }
    const parts = []
    if (filters.search) parts.push(`kata kunci "${filters.search}"`)
    if (filters.type) parts.push(`tipe "${filters.type}"`)
    if (filters.field) parts.push(`bidang "${FIELD_LABELS[filters.field] ?? filters.field}"`)
    
    return `Sistem tidak menemukan Challenge dengan kriteria: ${parts.join(', ')}.`
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/challenge/${id}`),
    onSuccess: () => {
      toast.success('Challenge dihapus.')
      qc.invalidateQueries({ queryKey: ['admin', 'challenges']})
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus.'),
  })

  return (
    <div>
      <AdminPageHeader
        title="Challenge Bank"
        description="Bank soal challenge yang dapat digunakan di silabus Bootcamp dan Mini Course."
        action={
          <button suppressHydrationWarning onClick={() => setModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> Buat Challenge
          </button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari judul challenge..."
          suppressHydrationWarning
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300 }}
        />
        <CleanCombobox
          value={filters.type ?? ''}
          onChange={val => setFilters(f => ({ ...f, type: val || undefined, page: 1 }))}
          placeholder="Semua Tipe"
          options={[
            { value: 'QUIZ', label: 'Quiz' },
            { value: 'PROJECT', label: 'Project' }
          ]}
          width={180}
        />
        <CleanCombobox
          value={filters.field ?? ''}
          onChange={val => setFilters(f => ({ ...f, field: val || undefined, page: 1 }))}
          placeholder="Semua Bidang"
          options={FIELD_OPTS.map(f => ({ value: f, label: FIELD_LABELS[f] }))}
          width={180}
        />
      </div>

      {/* Table */}
      <AnimatePresence mode="wait">
        {!_challengeHasLoaded && isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <AdminTableSkeleton rows={8} cols={7} />
          </motion.div>
        ) : items.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ background: 'transparent' }}>
            <AdminEmptyState 
              type={filters.search || filters.type || filters.field ? 'no-results' : 'empty'} 
              message={getEmptyMessage()} 
              action={<button onClick={() => setModal('new')} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>Buat Challenge</button>} 
            />
          </motion.div>
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    {['#', 'Judul', 'Tipe', 'Bidang', 'Skor Max', 'Pengerjaan', 'Aksi'].map(h => (
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
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, maxWidth: 260 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                        {c.description && <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <AdminStatusChip status={c.type} label={c.type} />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{FIELD_LABELS[c.field] ?? c.field}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 600 }}>{c.maxScore}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{c._count?.attempts ?? 0}x</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setModal(c)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => setDeleteTarget(c)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-error)', background: 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-error)' }}>
                          <Trash2 size={12} /> Hapus
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

      <AnimatePresence mode="wait">
        {modal && <ChallengeModal challenge={modal === 'new' ? undefined : modal as Challenge} onClose={() => setModal(null)} />}
      </AnimatePresence>
      <AdminConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus Challenge?"
        description={`Challenge "${deleteTarget?.title ?? ''}" akan dihapus permanen. Pastikan tidak ada silabus yang menggunakan challenge ini.`}
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
