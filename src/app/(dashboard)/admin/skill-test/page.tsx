'use client'
// src/app/admin/skill-test/page.tsx

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { Plus, Edit2, Trash2, X, Search, GripVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminPagination from '@/components/admin/AdminPagination'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { toast } from 'sonner'

interface SkillTestOption {
  id: string
  text: string
  field?: string
}

interface SkillTestQuestion {
  id: string
  question: string
  options: SkillTestOption[]
  weights: Record<string, number>
  orderIndex: number
  isActive: boolean
}

const FIELD_OPTS = ['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE'] as const

const FIELD_LABELS: Record<string, string> = {
  UI_UX: 'UI/UX',
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  MOBILE: 'Mobile',
}

const inputStyleClean: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.06)',
  fontSize: '14px',
  outline: 'none',
  background: '#f9fafb',
  color: 'var(--color-text-primary)',
  transition: 'all 0.2s ease',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: 8,
  color: 'var(--color-text-secondary)',
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

// Removed WeightChips as per new flat +1 logic

// ─────────────────────────────────────────────
// Question Card
// ─────────────────────────────────────────────
function QuestionCard({
  q,
  onEdit,
  onDelete,
}: {
  q: SkillTestQuestion
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isDragging ? 'var(--color-bg)' : 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        padding: '20px 24px',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        transition: transition || 'background 0.15s ease',
        boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.1)' : 'none',
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = 'var(--color-bg)' }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = 'var(--color-surface)' }}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners} 
        style={{ 
          cursor: 'grab', 
          color: 'var(--color-text-tertiary)', 
          padding: '2px',
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GripVertical size={16} />
      </div>

      {/* Number */}
      <span style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
        lineHeight: '22px',
        flexShrink: 0,
        width: 20,
        textAlign: 'right',
        userSelect: 'none',
      }}>
        {q.orderIndex}.
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Question */}
        <p style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          lineHeight: 1.6,
          margin: '0 0 12px',
        }}>
          {q.question}
        </p>

        {/* Options */}
        <div className="grid-cols-2" style={{
          display: 'grid',
          gap: '3px 32px',
        }}>
          {q.options.map((o, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 6,
              fontSize: '12px',
              lineHeight: 1.5,
            }}>
              <span style={{ flexShrink: 0, fontWeight: 500, color: 'var(--color-text-tertiary)' }}>{OPTION_LABELS[i]}.</span>
              <span style={{ color: 'var(--color-text-secondary)', flex: 1 }}>{o.text}</span>
              {o.field && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'var(--color-primary-xlight)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginLeft: 'auto'
                }}>
                  {FIELD_LABELS[o.field]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions — icon only, ghost */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <button
          onClick={onEdit}
          title="Edit"
          style={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-border-subtle)'
            e.currentTarget.style.color = 'var(--color-text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-tertiary)'
          }}
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          title="Hapus"
          style={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-error-bg)'
            e.currentTarget.style.color = 'var(--color-error)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-tertiary)'
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────
function QuestionModal({
  question,
  onClose,
}: {
  question?: SkillTestQuestion
  onClose: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!question

  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      question: question?.question ?? '',
      options: question?.options ?? [
        { id: 'a', text: '', field: '' },
        { id: 'b', text: '', field: '' },
        { id: 'c', text: '', field: '' },
        { id: 'd', text: '', field: '' },
      ],
      orderIndex: question?.orderIndex ?? 1,
      isActive: question?.isActive ?? true,
    },
  })

  const { fields } = useFieldArray({ control, name: 'options' })

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, weights: {}, orderIndex: Number(data.orderIndex) }
      return isEdit
        ? api.patch(`/admin/skill-test/questions/${question!.id}`, payload).then(r => r.data)
        : api.post('/admin/skill-test/questions', payload).then(r => r.data)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Soal diperbarui.' : 'Soal ditambahkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'skill-test'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Gagal menyimpan.'),
  })

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 'var(--z-modal)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
          width: '100%', maxWidth: 640,
          margin: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '32px 32px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: 4 }}>
              {isEdit ? 'Edit Soal' : 'Tambah Soal Baru'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {isEdit ? 'Perbarui skenario atau pemetaan bidang.' : 'Buat pertanyaan baru untuk bank soal.'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-tertiary)', width: 36, height: 36, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(d => mutation.mutate(d))}
          style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* Question + order */}
          <div className="grid-question-order" style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={labelStyle}>Pertanyaan <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <textarea
                {...register('question')}
                rows={3} required
                placeholder="Tulis pertanyaan skenario..."
                style={{ ...inputStyleClean, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Urutan <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input
                type="number"
                {...register('orderIndex')}
                required
                min={1}
                style={{ ...inputStyleClean, textAlign: 'center' }}
                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>

          {/* Options */}
          <div>
            <label style={labelStyle}>Opsi Jawaban & Pemetaan Bidang <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fields.map((field, idx) => (
                <div key={field.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)',
                    flexShrink: 0,
                  }}>
                    {OPTION_LABELS[idx]}
                  </span>
                  <input
                    {...register(`options.${idx}.text`)}
                    required
                    placeholder={`Teks opsi ${OPTION_LABELS[idx]}...`}
                    style={{ ...inputStyleClean, flex: 2 }}
                    onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                    onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name={`options.${idx}.field` as any}
                      render={({ field: f }) => (
                        <CleanCombobox
                          options={FIELD_OPTS.map(o => ({ value: o, label: FIELD_LABELS[o] }))}
                          value={f.value as string ?? ''}
                          onChange={f.onChange}
                          placeholder="Pilih Bidang"
                          width="100%"
                        />
                      )}
                    />
                  </div>
                  <input {...register(`options.${idx}.id`)} type="hidden" />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                border: 'none', background: 'transparent',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            >
              Batal
            </button>
            <button
              type="submit" disabled={mutation.isPending}
              style={{
                padding: '10px 28px', borderRadius: '10px',
                border: 'none', background: 'var(--color-primary)', color: '#fff',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                opacity: mutation.isPending ? 0.7 : 1, transition: 'opacity 0.2s',
              }}
            >
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Soal'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

let _cachedSkillTests: SkillTestQuestion[] = []
let _cachedPagination: any = null
let _skillTestHasLoaded = false

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AdminSkillTestPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [modal, setModal] = useState<null | 'new' | SkillTestQuestion>(null)
  const [deleteTarget, setDeleteTarget] = useState<SkillTestQuestion | null>(null)
  const qc = useQueryClient()

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'skill-test', { page, limit, search: debouncedSearch }],
    placeholderData: keepPreviousData,
    queryFn: () =>
      api.get('/admin/skill-test/questions', {
        params: { page, limit, search: debouncedSearch || undefined },
      }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  })

  if (data?.items !== undefined) {
    _cachedSkillTests = data.items
    _cachedPagination = data.pagination
    _skillTestHasLoaded = true
  }

  const pagination = _cachedPagination
  const [items, setItems] = useState<SkillTestQuestion[]>(_cachedSkillTests)

  useEffect(() => {
    if (data?.items) setItems(data.items)
  }, [data?.items])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const reorderMutation = useMutation({
    mutationFn: (newItems: SkillTestQuestion[]) => {
      const payload = {
        items: newItems.map((item, index) => ({
          id: item.id,
          orderIndex: (page - 1) * limit + index + 1
        }))
      }
      return api.patch('/admin/skill-test/questions/reorder', payload)
    },
    onSuccess: () => {
      // Avoid success toast spam during drag, invalidate query silently
      qc.invalidateQueries({ queryKey: ['admin', 'skill-test'] })
    },
    onError: () => toast.error('Gagal memperbarui urutan')
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex(item => item.id === active.id)
        const newIndex = currentItems.findIndex(item => item.id === over.id)
        
        const newItems = arrayMove(currentItems, oldIndex, newIndex)
        
        // Update orderIndex locally for immediate UI update
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          orderIndex: (page - 1) * limit + index + 1
        }))
        
        reorderMutation.mutate(updatedItems)
        return updatedItems
      })
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/skill-test/questions/${id}`),
    onSuccess: () => {
      toast.success('Soal dihapus.')
      qc.invalidateQueries({ queryKey: ['admin', 'skill-test'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus.'),
  })

  return (
    <div>
      <AdminPageHeader
        title="Soal Skill Test"
        description="Kelola bank soal Skill Test. Bobot tiap pertanyaan menentukan rekomendasi bidang pengguna."
        action={
          <button
            onClick={() => setModal('new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Tambah Soal
          </button>
        }
      />

      {/* Search */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari pertanyaan..."
          suppressHydrationWarning
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 260, width: 'auto', flex: 1, maxWidth: 300 }}
        />
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        {!_skillTestHasLoaded && isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AdminTableSkeleton rows={8} cols={1} />
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ background: 'transparent' }}>
              <AdminEmptyState
                type={search ? 'no-results' : 'empty'}
                message={search ? 'Tidak ada soal yang sesuai pencarian.' : 'Belum ada soal skill test.'}
              />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Card list container */}
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    {items.map(q => (
                      <QuestionCard
                        key={q.id}
                        q={q}
                        onEdit={() => setModal(q)}
                        onDelete={() => setDeleteTarget(q)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              {pagination && (
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderTop: 'none',
                  borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                  overflow: 'hidden',
                }}>
                  <AdminPagination
                    page={page} totalPages={pagination.totalPages}
                    limit={limit} total={pagination.total}
                    onPageChange={setPage}
                    onLimitChange={l => { setLimit(l); setPage(1) }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <QuestionModal
            question={modal === 'new' ? undefined : (modal as SkillTestQuestion)}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      <AdminConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus Soal?"
        description="Soal ini akan dihapus permanen dari bank soal."
        confirmLabel="Ya, Hapus"
        isDangerous
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

