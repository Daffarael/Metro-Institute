'use client'
import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Plus, GripVertical, Trash2, ChevronDown, ChevronRight, X, LayoutTemplate, Video, FileText, Target, Info, Edit } from 'lucide-react'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Types ─────────────────────────────────────────────────
interface BootcampSession {
  id: string; title: string; type: 'LIVE' | 'VIDEO' | 'MATERIAL' | 'QUIZ'
  videoUrl?: string; materialUrl?: string; isPreview: boolean
  order: number; challengeId?: string; deadlineAt?: string
}

interface BootcampChapter {
  id: string; title: string; order: number
  sessions: BootcampSession[]
}

interface Bootcamp { id: string; name: string }

const SESSION_TYPE_COLORS: Record<string, { bg: string; color: string; icon: any }> = {
  LIVE:      { bg: '#ECFDF5', color: '#059669', icon: Video },
  VIDEO:     { bg: '#EFF6FF', color: '#2563EB', icon: Video },
  MATERIAL:  { bg: '#FEF3C7', color: '#D97706', icon: FileText },
  QUIZ: { bg: '#F5F3FF', color: '#7C3AED', icon: Target },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)', background: 'var(--color-surface)',
  color: 'var(--color-text-primary)', outline: 'none', transition: 'all 0.2s',
}

// ─── Modals ────────────────────────────────────────────────
function AddChapterModal({ bootcampId, onClose }: any) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post(`/admin/bootcamps/${bootcampId}/chapters`, { title, order: 0 }),
    onSuccess: () => {
      toast.success('Bab berhasil ditambahkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] })
      onClose()
    },
    onError: () => toast.error('Gagal menambah bab.'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 420, padding: 'var(--space-6)', boxShadow: 'var(--shadow-2xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Tambah Bab (Chapter)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-secondary)" /></button>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Pengenalan UI/UX" style={inputStyle} autoFocus onKeyDown={e => e.key === 'Enter' && title.trim() && mutation.mutate()} />
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
          <button disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()} style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: !title.trim() ? 0.5 : 1 }}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Bab'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function AddSessionModal({ bootcampId, chapterId, editSession, onClose }: any) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ 
    title: editSession?.title || '', 
    description: editSession?.description || '',
    type: editSession?.type || ('LIVE' as BootcampSession['type']), 
    videoUrl: editSession?.videoUrl || '', 
    materialUrl: editSession?.materials?.[0]?.url || '', 
    isPreview: editSession?.isFreePreview || false,
    assignmentDescription: editSession?.assignmentDescription || '',
    assignmentDeadline: editSession?.assignmentDeadline ? editSession.assignmentDeadline.slice(0, 16) : ''
  })
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => {
      let payload: any = { ...form }
      if (editSession) {
        return api.put(`/admin/bootcamps/${bootcampId}/sessions/${editSession.id}`, payload)
      } else {
        payload.order = 0
        return api.post(`/admin/bootcamps/${bootcampId}/chapters/${chapterId}/sessions`, payload)
      }
    },
    onSuccess: () => {
      toast.success('Materi berhasil ditambahkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] })
      onClose()
    },
    onError: () => toast.error('Gagal menambah materi.'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 500, padding: 'var(--space-6)', boxShadow: 'var(--shadow-2xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Tambah Materi (Session)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-secondary)" /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Judul Materi <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Contoh: Fundamental Design System" style={inputStyle} autoFocus />
          </div>
          {form.type !== 'QUIZ' && (
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Deskripsi Materi (Opsional)</label>
              <textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="Tuliskan deskripsi materi atau modul di sini..." style={{...inputStyle, minHeight: 60}} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Jenis Materi</label>
            <div style={{ width: '100%' }}>
              <CleanCombobox
                value={form.type}
                onChange={val => f('type', val as any)}
                placeholder="Pilih Jenis Materi"
                options={[
                  { value: 'LIVE', label: 'LIVE - Sesi Video Call / Webinar' },
                  { value: 'MATERIAL', label: 'MATERIAL - Dokumen / PDF' },
                  { value: 'QUIZ', label: 'QUIZ - Tugas / Kuis' },
                ]}
                width="100%"
              />
            </div>
          </div>
          

          {form.type === 'LIVE' && (
            <div style={{ padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              <strong style={{ display: 'block', color: 'var(--color-text-primary)', marginBottom: 4 }}>Live Session Terintegrasi</strong>
              Sistem akan secara otomatis membuatkan ruang kelas Live (In-Platform) khusus untuk sesi ini setelah disimpan. Mentee tidak memerlukan link external.
            </div>
          )}

          {form.type === 'QUIZ' && (
            <>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Deskripsi Tugas / Quiz</label>
                <textarea value={form.assignmentDescription} onChange={e => f('assignmentDescription', e.target.value)} placeholder="Tuliskan deskripsi/instruksi tugas di sini..." style={{...inputStyle, minHeight: 80}} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Tenggat Waktu (Deadline)</label>
                <input type="datetime-local" value={form.assignmentDeadline} onChange={e => f('assignmentDeadline', e.target.value)} style={inputStyle} />
              </div>
            </>
          )}

          {form.type === 'MATERIAL' && (
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Link Dokumen (Google Drive) <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input value={form.materialUrl} onChange={e => f('materialUrl', e.target.value)} placeholder="Contoh: https://drive.google.com/file/d/..." style={inputStyle} />
            </div>
          )}

        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
          <button disabled={!form.title.trim() || mutation.isPending} onClick={() => mutation.mutate()} style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: !form.title.trim() ? 0.5 : 1 }}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Materi'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Sortable Session Item ─────────────────────────────────
function SortableSessionItem({ session, setDeleteTarget }: { session: BootcampSession; setDeleteTarget: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `session-${session.id}`,
    data: { type: 'session', session }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  const typeConfig = SESSION_TYPE_COLORS[session.type] ?? { bg: '#F3F4F6', color: '#6B7280', icon: LayoutTemplate }
  const Icon = typeConfig.icon

  return (
    <div ref={setNodeRef} style={{ ...style, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)', background: isDragging ? 'var(--color-bg)' : 'transparent', transition: 'background 0.2s' }}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', padding: 4, borderRadius: 4 }}>
        <GripVertical size={16} color="var(--color-text-tertiary)" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: typeConfig.bg, color: typeConfig.color }}>
        <Icon size={14} />
      </div>
      <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>{session.title}</span>
      <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', background: typeConfig.bg, color: typeConfig.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em' }}>
        {session.type}
      </span>

      <button onClick={() => setDeleteTarget({ type: 'session', id: session.id, edit: true, session })} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }} title="Edit Materi">
        <Edit size={15} />
      </button>
      <button onClick={() => setDeleteTarget({ type: 'session', id: session.id })} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }} title="Hapus Materi">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ─── Sortable Chapter Item ─────────────────────────────────
function SortableChapterItem({ chapter, bootcampId, setDeleteTarget, onAddSession }: any) {
  const [expanded, setExpanded] = useState(true)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `chapter-${chapter.id}`,
    data: { type: 'chapter', chapter }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 5 : 1,
    position: 'relative' as any,
  }

  const sessionIds = useMemo(() => chapter.sessions.map((s: any) => `session-${s.id}`), [chapter.sessions])

  return (
    <div ref={setNodeRef} style={{ ...style, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 'var(--space-4)', boxShadow: isDragging ? 'var(--shadow-xl)' : 'var(--shadow-sm)' }}>
      {/* Chapter Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--color-bg)', borderBottom: expanded ? '1px solid var(--color-border)' : 'none' }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', padding: 4, borderRadius: 4 }}>
          <GripVertical size={18} color="var(--color-text-secondary)" />
        </div>
        <button onClick={() => setExpanded(v => !v)} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', flex: 1, letterSpacing: '-0.01em' }}>{chapter.title}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', background: 'var(--color-surface)', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border-subtle)' }}>
          {chapter.sessions.length} Materi
        </span>
        <button onClick={() => onAddSession(chapter.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.borderColor = 'var(--color-border-heavy)' }} onMouseOut={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}>
          <Plus size={14} /> Tambah
        </button>
        <button onClick={() => setDeleteTarget({ type: 'chapter', id: chapter.id })} style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', border: '1px solid transparent', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', transition: 'all 0.2s' }} title="Hapus Bab" onMouseOver={e => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.background = '#FEE2E2' }} onMouseOut={e => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; e.currentTarget.style.background = 'transparent' }}>
          <Trash2 size={15} />
        </button>
      </div>

      {/* Sessions List - Sortable Context for nested items */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ background: 'var(--color-surface)' }}>
              <SortableContext items={sessionIds} strategy={verticalListSortingStrategy}>
                {chapter.sessions.length === 0 ? (
                  <div style={{ padding: 'var(--space-6)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', fontStyle: 'italic' }}>
                    Belum ada materi di bab ini. Klik tombol "Tambah" di atas.
                  </div>
                ) : (
                  chapter.sessions.map((session: any) => (
                    <SortableSessionItem key={`session-${session.id}`} session={session} setDeleteTarget={setDeleteTarget} />
                  ))
                )}
              </SortableContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function BootcampSyllabusPage() {
  const { bootcampId } = useParams<{ bootcampId: string }>()
  const qc = useQueryClient()
  
  const [localChapters, setLocalChapters] = useState<BootcampChapter[]>([])
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [addSessionToChapter, setAddSessionToChapter] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const { data: bootcamp } = useQuery<Bootcamp>({
    queryKey: ['admin', 'bootcamp', bootcampId],
    queryFn: () => api.get(`/admin/bootcamps/${bootcampId}`).then(r => r.data.data),
  })

  const { data: chaptersData, isLoading } = useQuery<BootcampChapter[]>({
    queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'],
    queryFn: () => api.get(`/admin/bootcamps/${bootcampId}/chapters`).then(r => r.data.data ?? []),
  })

  // Sync server data to local state for fast UI optimistic updates
  useEffect(() => {
    if (chaptersData) {
      // sort chapters and sessions safely
      const sorted = [...chaptersData].sort((a, b) => a.order - b.order).map(ch => ({
        ...ch,
        sessions: [...ch.sessions].sort((a, b) => a.order - b.order)
      }))
      setLocalChapters(sorted)
    }
  }, [chaptersData])

  // Mutations
  const reorderMutation = useMutation({
    mutationFn: (data: { chapters: any[] }) => api.put(`/admin/bootcamps/${bootcampId}/chapters/reorder`, data),
    onSuccess: () => toast.success('Urutan berhasil disimpan!'),
    onError: () => {
      toast.error('Gagal menyimpan urutan.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] }) // revert
    }
  })

  // DnD Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === 'chapter' && overType === 'chapter' && active.id !== over.id) {
      // Reorder Chapters
      setLocalChapters(prev => {
        const oldIndex = prev.findIndex(c => `chapter-${c.id}` === active.id)
        const newIndex = prev.findIndex(c => `chapter-${c.id}` === over.id)
        const newArr = arrayMove(prev, oldIndex, newIndex)
        
        // Optimistic UI, trigger API
        const payload = newArr.map((c, i) => ({ id: c.id, order: i }))
        reorderMutation.mutate({ chapters: payload })
        return newArr
      })
    }
    
    if (activeType === 'session' && overType === 'session' && active.id !== over.id) {
      // Reorder Sessions (assuming they are in the SAME chapter for now)
      setLocalChapters(prev => {
        const newChapters = [...prev]
        // Find which chapter holds the active session
        const chapterIndex = newChapters.findIndex(c => c.sessions.some(s => `session-${s.id}` === active.id))
        if (chapterIndex === -1) return prev

        const oldIndex = newChapters[chapterIndex].sessions.findIndex(s => `session-${s.id}` === active.id)
        const newIndex = newChapters[chapterIndex].sessions.findIndex(s => `session-${s.id}` === over.id)
        
        // Reorder
        newChapters[chapterIndex].sessions = arrayMove(newChapters[chapterIndex].sessions, oldIndex, newIndex)
        
        // Ideally we hit an API for session reordering here
        toast.info('Urutan materi diperbarui secara lokal. (API pending)')
        return newChapters
      })
    }
  }

  const chapterIds = useMemo(() => localChapters.map(c => `chapter-${c.id}`), [localChapters])

  return (
    <div style={{ paddingBottom: 'var(--space-20)' }}>
      <AdminPageHeader
        title="Kurikulum & Silabus"
        description={bootcamp?.title ?? 'Memuat...'}
        breadcrumbs={[
          { label: 'Bootcamp', href: '/admin/bootcamp' },
          { label: bootcamp?.title ?? '...' },
          { label: 'Syllabus' },
        ]}
        action={
          <button onClick={() => setShowAddChapter(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
            <Plus size={18} /> Tambah Bab
          </button>
        }
      />

      <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-6)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <Info size={18} />
        </div>
        <div>
          <strong style={{ display: 'block', marginBottom: 2, color: 'var(--color-text-primary)' }}>Tips Drag & Drop</strong>
          Tarik icon <GripVertical size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> untuk mengatur urutan Bab dan Materi. Perubahan akan tersimpan otomatis.
        </div>
      </div>

      {isLoading ? (
        <AdminTableSkeleton rows={5} cols={4} />
      ) : localChapters.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
            {localChapters.map(chapter => (
              <SortableChapterItem key={`chapter-${chapter.id}`} chapter={chapter} bootcampId={bootcampId} setDeleteTarget={setDeleteTarget} onAddSession={setAddSessionToChapter} />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border-heavy)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-16)', textAlign: 'center', marginTop: 'var(--space-8)' }}>
          <div style={{ width: 80, height: 80, background: 'var(--color-bg)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6)' }}>
            <LayoutTemplate size={36} color="var(--color-text-tertiary)" />
          </div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Kurikulum Masih Kosong</h3>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', maxWidth: 400, margin: '0 auto var(--space-6)' }}>Mulai susun alur belajar untuk bootcamp ini dengan menambahkan Bab pertama.</p>
          <button onClick={() => setShowAddChapter(true)} style={{ padding: '12px 28px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 'var(--text-base)', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}>+ Buat Bab Pertama</button>
        </div>
      )}

      {showAddChapter && <AddChapterModal bootcampId={bootcampId} onClose={() => setShowAddChapter(false)} />}
      
      {addSessionToChapter && <AddSessionModal bootcampId={bootcampId} chapterId={addSessionToChapter} onClose={() => setAddSessionToChapter(null)} />}
      
      {deleteTarget?.edit && <AddSessionModal bootcampId={bootcampId} chapterId={null} editSession={deleteTarget.session} onClose={() => setDeleteTarget(null)} />}
      
      {deleteTarget && !deleteTarget.edit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', width: 400, borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 16 }}>Hapus {deleteTarget.type === 'chapter' ? 'Bab' : 'Materi'}?</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Tindakan ini tidak dapat dibatalkan. Yakin ingin menghapus?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--color-bg)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
              <button 
                onClick={async () => {
                  try {
                    const endpoint = deleteTarget.type === 'chapter' 
                      ? `/admin/bootcamps/${bootcampId}/chapters/${deleteTarget.id}` 
                      : `/admin/bootcamps/${bootcampId}/sessions/${deleteTarget.id}`
                    await api.delete(endpoint)
                    toast.success('Berhasil dihapus!')
                    qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] })
                    setDeleteTarget(null)
                  } catch (err) { toast.error('Gagal menghapus.') }
                }} 
                style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--color-error)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
