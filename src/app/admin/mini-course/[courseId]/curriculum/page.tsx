'use client'
// src/app/admin/mini-course/[courseId]/curriculum/page.tsx
// Kelola kurikulum mini course (DnD sessions)
// Sesuai concept doc Section 5C — Tipe: VIDEO | MATERIAL | CHALLENGE (tidak ada LIVE)

import {  useState , useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Plus, GripVertical, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import { toast } from 'sonner'

interface CourseSession {
  id: string; title: string; type: 'VIDEO' | 'MATERIAL' | 'CHALLENGE'
  videoUrl?: string; materialUrl?: string; isPreview: boolean; order: number
}
interface MiniCourse { id: string; title: string }

const SESSION_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  VIDEO:     { bg: '#EFF6FF', color: '#2563EB' },
  MATERIAL:  { bg: '#FEF3C7', color: '#D97706' },
  CHALLENGE: { bg: '#F5F3FF', color: '#7C3AED' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)',
  background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none',
}

function AddSessionModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', type: 'VIDEO' as CourseSession['type'], videoUrl: '', materialUrl: '', isPreview: false })

  const mutation = useMutation({
    mutationFn: () => api.post(`/mini-course/${courseId}/sessions`, { ...form, order: 0 }),
    onSuccess: () => {
      toast.success('Sesi ditambahkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId, 'curriculum'], placeholderData: keepPreviousData, })
      onClose()
    },
    onError: () => toast.error('Gagal menambah sesi.'),
  })

  const f = (key: keyof typeof form, val: any) => setForm(p => ({ ...p, [key]: val }))

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
       style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
       style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 480, padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Tambah Sesi Kurikulum</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Judul Sesi *</label>
            <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Pengenalan Figma Interface" style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Tipe Konten</label>
            <select value={form.type} onChange={e => f('type', e.target.value)} style={inputStyle}>
              <option value="VIDEO">VIDEO — Rekaman video</option>
              <option value="MATERIAL">MATERIAL — PDF / dokumen</option>
              <option value="CHALLENGE">CHALLENGE — Tugas / Quiz</option>
            </select>
            <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 3 }}>Mini Course tidak memiliki sesi LIVE.</p>
          </div>
          {form.type === 'VIDEO' && (
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>URL Video</label>
              <input value={form.videoUrl} onChange={e => f('videoUrl', e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
          )}
          {form.type === 'MATERIAL' && (
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>URL Materi</label>
              <input value={form.materialUrl} onChange={e => f('materialUrl', e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="preview" checked={form.isPreview} onChange={e => f('isPreview', e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="preview" style={{ fontSize: 'var(--text-sm)', cursor: 'pointer' }}>Preview gratis (bisa ditonton tanpa beli)</label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Batal</button>
          <button disabled={!form.title.trim() || mutation.isPending} onClick={() => mutation.mutate()} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)', opacity: !form.title.trim() ? 0.5 : 1 }}>
            {mutation.isPending ? 'Menyimpan...' : 'Tambah Sesi'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function MiniCourseCurriculumPage() {
  const params = useParams<{ courseId: string }>()
  const { courseId } = params
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: course } = useQuery<MiniCourse>({
    queryKey: ['admin', 'course', courseId], placeholderData: keepPreviousData,
    queryFn: () => api.get(`/mini-course/${courseId}`).then(r => r.data.data),
  })

  const { data: sessions, isLoading } = useQuery<CourseSession[]>({
    queryKey: ['admin', 'course', courseId, 'curriculum'], placeholderData: keepPreviousData,
    queryFn: () => api.get(`/mini-course/${courseId}/sessions`).then(r => r.data.data ?? []),
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/mini-course/sessions/${id}`),
    onSuccess: () => {
      toast.success('Sesi dihapus.')
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId, 'curriculum'], placeholderData: keepPreviousData, })
      setDeleteId(null)
    },
    onError: () => toast.error('Gagal menghapus.'),
  })

  const sorted = [...(sessions ?? [])].sort((a, b) => a.order - b.order)

  return (
    <div>
      <AdminPageHeader
        title="Kelola Kurikulum"
        description={course?.title}
        breadcrumbs={[
          { label: 'Mini Course', href: '/admin/mini-course' },
          { label: course?.title ?? '...', href: '/admin/mini-course' },
          { label: 'Kurikulum' },
        ]}
        action={
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> Tambah Sesi
          </button>
        }
      />

      <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-info-bg)', color: 'var(--color-info)', fontSize: 'var(--text-xs)', fontWeight: 500, marginBottom: 'var(--space-5)', border: '1px solid #BFDBFE' }}>
        💡 Tipe sesi tersedia: VIDEO, MATERIAL, CHALLENGE. Mini Course tidak memiliki sesi LIVE.
      </div>

      {isLoading ? <AdminTableSkeleton rows={6} cols={5} /> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {sorted.length === 0 ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>Kurikulum kosong</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 16 }}>Tambahkan sesi pertama untuk memulai.</p>
              <button onClick={() => setShowAdd(true)} style={{ padding: '9px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>+ Tambah Sesi</button>
            </div>
          ) : (
            sorted.map((s, i) => {
              const tc = SESSION_TYPE_COLORS[s.type] ?? { bg: '#F3F4F6', color: '#6B7280' }
              return (
                <div key={s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderBottom: i < sorted.length - 1 ? '1px solid var(--color-border-subtle)' : 'none', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <GripVertical size={16} color="var(--color-text-tertiary)" style={{ cursor: 'grab', flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', width: 24, textAlign: 'center', fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>{s.title}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: tc.bg, color: tc.color, fontSize: '11px', fontWeight: 600 }}>{s.type}</span>
                  {s.isPreview && <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-light)', color: '#856404', fontSize: '11px', fontWeight: 600 }}>Preview</span>}
                  <button onClick={() => setDeleteId(s.id)} style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {showAdd && <AddSessionModal courseId={courseId} onClose={() => setShowAdd(false)} />}
      <AdminConfirmModal
        isOpen={deleteId !== null}
        title="Hapus Sesi?"
        description="Sesi ini akan dihapus permanen dari kurikulum."
        isDangerous
        confirmLabel="Ya, Hapus"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}
