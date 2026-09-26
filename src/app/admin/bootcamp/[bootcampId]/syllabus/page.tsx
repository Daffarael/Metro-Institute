'use client'
// src/app/admin/bootcamp/[bootcampId]/syllabus/page.tsx
// DnD silabus: Chapter → Sessions (drag & drop order)
// Sesuai concept doc Section 4C + design doc section 8

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Plus, GripVertical, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import api from '@/lib/axios'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import { toast } from 'sonner'

// ─── Types (sesuai Prisma schema architecture.md) ──────────
interface BootcampSession {
  id: string; title: string; type: 'LIVE' | 'VIDEO' | 'MATERIAL' | 'CHALLENGE'
  videoUrl?: string; materialUrl?: string; isPreview: boolean
  order: number; challengeId?: string; deadlineAt?: string
}

interface BootcampChapter {
  id: string; title: string; order: number
  sessions: BootcampSession[]
}

interface Bootcamp { id: string; name: string }

const SESSION_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  LIVE:      { bg: '#ECFDF5', color: '#059669' },
  VIDEO:     { bg: '#EFF6FF', color: '#2563EB' },
  MATERIAL:  { bg: '#FEF3C7', color: '#D97706' },
  CHALLENGE: { bg: '#F5F3FF', color: '#7C3AED' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  outline: 'none',
}

// ─── Add Chapter Modal ─────────────────────────────────────
function AddChapterModal({ bootcampId, onClose }: { bootcampId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post(`/bootcamp/${bootcampId}/chapters`, { title, order: 0 }),
    onSuccess: () => {
      toast.success('Chapter ditambahkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] })
      onClose()
    },
    onError: () => toast.error('Gagal menambah chapter.'),
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 420, padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Tambah Chapter</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Judul chapter..."
          style={inputStyle}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && title.trim() && mutation.mutate()}
        />
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Batal</button>
          <button disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)', opacity: !title.trim() ? 0.5 : 1 }}>
            {mutation.isPending ? 'Menyimpan...' : 'Tambah Chapter'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Session Modal ─────────────────────────────────────
function AddSessionModal({ bootcampId, chapterId, onClose }: { bootcampId: string; chapterId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', type: 'VIDEO' as BootcampSession['type'], videoUrl: '', materialUrl: '', isPreview: false })

  const mutation = useMutation({
    mutationFn: () => api.post(`/bootcamp/${bootcampId}/chapters`, { ...form, chapterId, order: 0 }),
    onSuccess: () => {
      toast.success('Sesi ditambahkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] })
      onClose()
    },
    onError: () => toast.error('Gagal menambah sesi.'),
  })

  const f = (key: keyof typeof form, val: any) => setForm(p => ({ ...p, [key]: val }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 480, padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Tambah Sesi</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Judul Sesi *</label>
            <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Intro Design Thinking" style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Tipe Sesi</label>
            <select value={form.type} onChange={e => f('type', e.target.value)} style={inputStyle}>
              <option value="LIVE">LIVE — Sesi live class</option>
              <option value="VIDEO">VIDEO — Rekaman video</option>
              <option value="MATERIAL">MATERIAL — Materi PDF/doc</option>
              <option value="CHALLENGE">CHALLENGE — Tugas / Quiz</option>
            </select>
          </div>
          {(form.type === 'VIDEO' || form.type === 'LIVE') && (
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
            <input type="checkbox" id="isPreview" checked={form.isPreview} onChange={e => f('isPreview', e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="isPreview" style={{ fontSize: 'var(--text-sm)', cursor: 'pointer' }}>Bisa ditonton gratis (preview)</label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Batal</button>
          <button disabled={!form.title.trim() || mutation.isPending} onClick={() => mutation.mutate()} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)', opacity: !form.title.trim() ? 0.5 : 1 }}>
            {mutation.isPending ? 'Menyimpan...' : 'Tambah Sesi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Chapter Item ──────────────────────────────────────────
function ChapterItem({ chapter, bootcampId }: { chapter: BootcampChapter; bootcampId: string }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(true)
  const [showAddSession, setShowAddSession] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'chapter' | 'session'; id: string } | null>(null)

  const deleteChapter = useMutation({
    mutationFn: () => api.delete(`/bootcamp/chapters/${chapter.id}`),
    onSuccess: () => {
      toast.success('Chapter dihapus.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus.'),
  })

  const deleteSession = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/bootcamp/chapters/${sessionId}`),
    onSuccess: () => {
      toast.success('Sesi dihapus.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus.'),
  })

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
      {/* Chapter header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg)', borderBottom: expanded ? '1px solid var(--color-border-subtle)' : 'none' }}>
        <GripVertical size={16} color="var(--color-text-tertiary)" style={{ cursor: 'grab', flexShrink: 0 }} />
        <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', flex: 1 }}>{chapter.title}</span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{chapter.sessions.length} sesi</span>
        <button onClick={() => setShowAddSession(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--color-primary)' }}>
          <Plus size={12} /> Sesi
        </button>
        <button onClick={() => setDeleteTarget({ type: 'chapter', id: chapter.id })} style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)' }}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Sessions list */}
      {expanded && (
        <div>
          {chapter.sessions.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              Belum ada sesi. Klik "+ Sesi" untuk menambahkan.
            </div>
          ) : (
            chapter.sessions.map(session => {
              const typeStyle = SESSION_TYPE_COLORS[session.type] ?? { bg: '#F3F4F6', color: '#6B7280' }
              return (
                <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <GripVertical size={14} color="var(--color-text-tertiary)" style={{ cursor: 'grab', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{session.title}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: typeStyle.bg, color: typeStyle.color, fontSize: '11px', fontWeight: 600 }}>
                    {session.type}
                  </span>
                  {session.isPreview && (
                    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-light)', color: '#856404', fontSize: '11px', fontWeight: 600 }}>
                      Preview
                    </span>
                  )}
                  <button onClick={() => setDeleteTarget({ type: 'session', id: session.id })} style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}
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

      {/* Add Session Modal */}
      {showAddSession && <AddSessionModal bootcampId={bootcampId} chapterId={chapter.id} onClose={() => setShowAddSession(false)} />}

      {/* Delete confirm */}
      <AdminConfirmModal
        isOpen={deleteTarget !== null}
        title={deleteTarget?.type === 'chapter' ? 'Hapus Chapter?' : 'Hapus Sesi?'}
        description={deleteTarget?.type === 'chapter' ? `Chapter "${chapter.title}" dan semua sesinya akan dihapus permanen.` : 'Sesi ini akan dihapus permanen.'}
        confirmText={deleteTarget?.type === 'chapter' ? 'HAPUS' : undefined}
        confirmLabel="Ya, Hapus"
        isDangerous
        isLoading={deleteChapter.isPending || deleteSession.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          if (deleteTarget.type === 'chapter') deleteChapter.mutate()
          else deleteSession.mutate(deleteTarget.id)
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────
export default function BootcampSyllabusPage() {
  const params = useParams<{ bootcampId: string }>()
  const { bootcampId } = params
  const [showAddChapter, setShowAddChapter] = useState(false)

  const { data: bootcamp } = useQuery<Bootcamp>({
    queryKey: ['admin', 'bootcamp', bootcampId],
    queryFn: () => api.get(`/bootcamp/${bootcampId}`).then(r => r.data.data),
  })

  const { data: chapters, isLoading } = useQuery<BootcampChapter[]>({
    queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'],
    queryFn: () => api.get(`/bootcamp/${bootcampId}/chapters`).then(r => r.data.data ?? []),
    staleTime: 2 * 60 * 1000,
  })

  return (
    <div>
      <AdminPageHeader
        title="Kelola Silabus"
        description={bootcamp?.name ?? 'Bootcamp'}
        breadcrumbs={[
          { label: 'Bootcamp', href: '/admin/bootcamp' },
          { label: bootcamp?.name ?? '...', href: `/admin/bootcamp` },
          { label: 'Silabus' },
        ]}
        action={
          <button
            onClick={() => setShowAddChapter(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={16} /> Tambah Chapter
          </button>
        }
      />

      {/* Info note */}
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-info-bg)', color: 'var(--color-info)', fontSize: 'var(--text-xs)', fontWeight: 500, marginBottom: 'var(--space-5)', border: '1px solid #BFDBFE' }}>
        💡 Urutan chapter dan sesi akan segera tersimpan otomatis setelah drag & drop (auto-save).
      </div>

      {isLoading ? (
        <AdminTableSkeleton rows={5} cols={4} />
      ) : chapters && chapters.length > 0 ? (
        <div>
          {chapters
            .sort((a, b) => a.order - b.order)
            .map(chapter => (
              <ChapterItem key={chapter.id} chapter={chapter} bootcampId={bootcampId} />
            ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>📚</div>
          <p style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Belum ada chapter</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>Mulai dengan menambahkan chapter pertama.</p>
          <button onClick={() => setShowAddChapter(true)} style={{ padding: '9px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>+ Tambah Chapter</button>
        </div>
      )}

      {showAddChapter && <AddChapterModal bootcampId={bootcampId} onClose={() => setShowAddChapter(false)} />}
    </div>
  )
}
