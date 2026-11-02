'use client'

import MarkdownTextarea from '@/components/ui/MarkdownTextarea'
import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Plus, GripVertical, Trash2, ChevronDown, ChevronRight, X, LayoutTemplate, Video, FileText, Target, Info, Edit } from 'lucide-react'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import CleanCombobox from '@/components/admin/CleanCombobox'
import VideoInputWithUpload from '@/components/admin/VideoInputWithUpload'
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
  order: number; challengeId?: string; deadlineAt?: string; xpReward?: number
}

interface BootcampChapter {
  id: string; title: string; order: number
  sessions: BootcampSession[]
}

interface Bootcamp { id: string; name?: string; title?: string }

const SESSION_TYPE_COLORS: Record<string, { bg: string; color: string; icon: any; border?: string }> = {
  LIVE:      { bg: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', icon: Video },
  MATERIAL:  { bg: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', icon: FileText },
  VIDEO:     { bg: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', icon: Video },
  QUIZ:      { bg: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', icon: Target },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)', background: 'var(--color-surface)',
  color: 'var(--color-text-primary)', outline: 'none', transition: 'all 0.2s',
}

// ─── Datetime & Timezone Helpers (Asia/Jakarta WIB) ────────
function toLocalDatetimeValue(dateVal?: string | Date | null): string {
  if (!dateVal) return ''
  try {
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
    if (isNaN(d.getTime())) return ''
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    return formatter.format(d).replace(' ', 'T')
  } catch {
    return ''
  }
}

function toIsoDatetime(localStr?: string | null): string | null {
  if (!localStr || !localStr.trim()) return null
  const s = localStr.trim()
  if (!s.includes('+') && !s.includes('Z') && !s.match(/-\d{2}:\d{2}$/)) {
    return `${s}:00+07:00`
  }
  return new Date(s).toISOString()
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
          <button disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()} style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: !title.trim() ? '#E2E8F0' : '#018556', color: !title.trim() ? '#94A3B8' : '#fff', fontWeight: 600, cursor: !title.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', boxShadow: title.trim() ? '0 2px 8px rgba(1,133,86,0.25)' : 'none' }}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Bab'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function AddSessionModal({ bootcampId, chapterId, editSession, onClose }: any) {
  const qc = useQueryClient()

  // Fetch the fresh single session data to guarantee 100% complete, up-to-date fields
  const { data: freshSession } = useQuery({
    queryKey: ['admin', 'bootcamp', bootcampId, 'session', editSession?.id],
    queryFn: () => api.get(`/admin/bootcamps/${bootcampId}/sessions/${editSession.id}`).then(r => r.data.data),
    enabled: !!editSession?.id,
  })

  const current = freshSession || editSession

  const [form, setForm] = useState({ 
    title: current?.title || '', 
    description: current?.description || '',
    type: current?.type || ('LIVE' as BootcampSession['type']), 
    scheduledAt: toLocalDatetimeValue(current?.liveScheduledAt || current?.scheduledAt),
    durationMin: current?.videoDuration ?? (current?.durationMin ?? 90),
    meetingUrl: current?.liveUrl || (current?.meetingUrl || ''),
    videoUrl: current?.videoUrl || '', 
    materialUrl: (Array.isArray(current?.materials) && current?.materials?.[0]?.url) ? current.materials[0].url : (current?.materialUrl || ''), 
    isPreview: current?.isFreePreview ?? (current?.isPreview ?? false),
    assignmentDescription: current?.assignmentDescription || '',
    assignmentDeadline: toLocalDatetimeValue(current?.assignmentDeadline),
    xpReward: current?.xpReward !== undefined ? current.xpReward : 10
  })
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const [quizOptions, setQuizOptions] = useState<any[]>(
    current?.quizOptions && Array.isArray(current.quizOptions) && current.quizOptions.length > 0
      ? current.quizOptions
      : [
          { id: Math.random().toString(36).substr(2, 9), question: '', options: [{ id: 'A', text: '', isCorrect: true }, { id: 'B', text: '', isCorrect: false }, { id: 'C', text: '', isCorrect: false }, { id: 'D', text: '', isCorrect: false }] }
        ]
  )

  // Sync form when freshSession arrives
  useEffect(() => {
    if (freshSession) {
      setForm({
        title: freshSession.title || '',
        description: freshSession.description || '',
        type: freshSession.type || 'LIVE',
        scheduledAt: toLocalDatetimeValue(freshSession.liveScheduledAt || freshSession.scheduledAt),
        durationMin: freshSession.videoDuration ?? (freshSession.durationMin ?? 90),
        meetingUrl: freshSession.liveUrl || (freshSession.meetingUrl || ''),
        videoUrl: freshSession.videoUrl || '',
        materialUrl: (Array.isArray(freshSession.materials) && freshSession.materials[0]?.url) ? freshSession.materials[0].url : (freshSession.materialUrl || ''),
        isPreview: freshSession.isFreePreview ?? (freshSession.isPreview ?? false),
        assignmentDescription: freshSession.assignmentDescription || '',
        assignmentDeadline: toLocalDatetimeValue(freshSession.assignmentDeadline),
        xpReward: freshSession.xpReward !== undefined ? freshSession.xpReward : 10
      })
      if (freshSession.quizOptions && Array.isArray(freshSession.quizOptions) && freshSession.quizOptions.length > 0) {
        setQuizOptions(freshSession.quizOptions)
      }
    }
  }, [freshSession])

  const mutation = useMutation({
    mutationFn: () => {
      const scheduledIso = toIsoDatetime(form.scheduledAt)
      const deadlineIso = toIsoDatetime(form.assignmentDeadline)

      let payload: any = { 
        ...form, 
        scheduledAt: scheduledIso,
        liveScheduledAt: scheduledIso,
        assignmentDeadline: deadlineIso,
        liveUrl: form.meetingUrl,
        meetingUrl: form.meetingUrl,
        videoDuration: Number(form.durationMin) || 90,
        durationMin: Number(form.durationMin) || 90,
        isFreePreview: form.isPreview,
        isPreview: form.isPreview,
        xpReward: Number(form.xpReward) || 10,
        quizOptions: (form.type === 'QUIZ' || form.type === 'ASSIGNMENT') ? quizOptions : null 
      }
      if (editSession) {
        return api.put(`/admin/bootcamps/${bootcampId}/sessions/${editSession.id}`, payload)
      } else {
        payload.order = 0
        return api.post(`/admin/bootcamps/${bootcampId}/chapters/${chapterId}/sessions`, payload)
      }
    },
    onSuccess: () => {
      toast.success(editSession ? 'Materi diperbarui.' : 'Materi berhasil ditambahkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] })
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'schedules'] })
      if (editSession?.id) {
        qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'session', editSession.id] })
      }
      onClose()
    },
    onError: () => toast.error('Gagal menyimpan materi.'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} style={{ background: 'var(--color-surface)', borderRadius: 20, width: '100%', maxWidth: form.type === 'QUIZ' ? 680 : (form.type === 'VIDEO' ? 640 : 560), maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)', flexShrink: 0 }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', margin: 0 }}>{editSession ? 'Edit Sesi Materi' : 'Tambah Sesi Materi (Session)'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 6 }}><X size={20} color="var(--color-text-secondary)" /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Judul Materi / Sesi <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Contoh: Sesi 1 - Pengenalan Design System & Figma" style={inputStyle} autoFocus />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Jenis Materi</label>
            <div style={{ width: '100%' }}>
              <CleanCombobox
                value={form.type}
                onChange={val => f('type', val as any)}
                placeholder="Pilih Jenis Materi"
                options={[
                  { value: 'LIVE', label: 'LIVE - Sesi Tatap Muka Google Meet' },
                  { value: 'MATERIAL', label: 'MATERIAL - Modul Bacaan Teori / PDF' },
                  { value: 'QUIZ', label: 'QUIZ - Kuis & Tugas Pendamping' },
                  { value: 'VIDEO', label: 'VIDEO - Rekaman / Video Pendukung' },
                ]}
                width="100%"
                direction="down"
              />
            </div>
          </div>

          {/* Fields for LIVE */}
          {form.type === 'LIVE' && (
            <>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Jadwal Pertemuan (Tanggal & Jam WIB) <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input 
                  type="datetime-local" 
                  value={form.scheduledAt} 
                  onChange={e => f('scheduledAt', e.target.value)} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                    Durasi (Menit)
                  </label>
                  <input 
                    type="number" 
                    min={15} 
                    max={480} 
                    value={form.durationMin} 
                    onChange={e => f('durationMin', Number(e.target.value))} 
                    placeholder="90" 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                    Link Google Meet <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input 
                    value={form.meetingUrl} 
                    onChange={e => f('meetingUrl', e.target.value)} 
                    placeholder="https://meet.google.com/xxx-xxxx-xxx" 
                    style={inputStyle} 
                  />
                </div>
              </div>
            </>
          )}

          {/* Fields for MATERIAL */}
          {form.type === 'MATERIAL' && (
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                Link Dokumen / Modul Google Drive <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input 
                value={form.materialUrl} 
                onChange={e => f('materialUrl', e.target.value)} 
                placeholder="Contoh: https://drive.google.com/file/d/..." 
                style={inputStyle} 
              />
            </div>
          )}

          {/* Fields for VIDEO */}
          {form.type === 'VIDEO' && (
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                Konten Video Pembelajaran <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <VideoInputWithUpload
                value={form.videoUrl}
                onChange={(url) => f('videoUrl', url)}
              />
            </div>
          )}

          {/* Fields for QUIZ / ASSIGNMENT */}
          {(form.type === 'QUIZ' || form.type === 'ASSIGNMENT') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Instruksi Tugas / Kuis
                </label>
                <MarkdownTextarea 
                  value={form.assignmentDescription} 
                  onChange={v => f('assignmentDescription', v)} 
                  placeholder="Tuliskan petunjuk pengerjaan tugas atau kuis di sini..." 
                  rows={4}
                  minHeight={100}
                />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Tenggat Waktu Pengumpulan (Deadline)
                </label>
                <input 
                  type="datetime-local" 
                  value={form.assignmentDeadline} 
                  onChange={e => f('assignmentDeadline', e.target.value)} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                    Daftar Soal Kuis Pilihan Ganda ({quizOptions.length} Soal)
                  </label>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {quizOptions.map((q, qIndex) => (
                    <div key={q.id} style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border)', position: 'relative' }}>
                      {quizOptions.length > 1 && (
                        <button type="button" onClick={() => setQuizOptions(quizOptions.filter((_, i) => i !== qIndex))} style={{ position: 'absolute', top: 10, right: 10, background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '6px', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(220,38,38,0.25)', transition: 'all 0.2s ease' }} onMouseOver={e => { e.currentTarget.style.background = '#B91C1C' }} onMouseOut={e => { e.currentTarget.style.background = '#DC2626' }} title="Hapus Soal">
                          <Trash2 size={13} strokeWidth={2.5} />
                        </button>
                      )}
                      <h4 style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: 10, color: 'var(--color-text-primary)' }}>Soal {qIndex + 1}</h4>
                      
                      <input
                        value={q.question}
                        onChange={(e) => {
                          const newQuiz = [...quizOptions];
                          newQuiz[qIndex].question = e.target.value;
                          setQuizOptions(newQuiz);
                        }}
                        placeholder="Ketik pertanyaan kuis di sini..."
                        style={{ ...inputStyle, padding: '8px 12px', marginBottom: 12 }}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {q.options.map((opt: any, optIndex: number) => (
                          <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '6px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                              {['A', 'B', 'C', 'D'][optIndex] || optIndex + 1}
                            </div>
                            <input
                              value={opt.text}
                              onChange={(e) => {
                                const newQuiz = [...quizOptions];
                                newQuiz[qIndex].options[optIndex].text = e.target.value;
                                setQuizOptions(newQuiz);
                              }}
                              placeholder={`Pilihan ${['A', 'B', 'C', 'D'][optIndex] ?? optIndex + 1}...`}
                              style={{ ...inputStyle, flex: 1, padding: '7px 10px', fontSize: '12.5px' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 4px', height: 26 }}>
                              <input 
                                type="radio" 
                                name={`correct-${q.id}`} 
                                checked={opt.isCorrect}
                                onChange={() => {
                                  const newQuiz = [...quizOptions];
                                  newQuiz[qIndex].options.forEach((o: any) => o.isCorrect = false);
                                  newQuiz[qIndex].options[optIndex].isCorrect = true;
                                  setQuizOptions(newQuiz);
                                }}
                                style={{ width: 16, height: 16, accentColor: '#018556' }} 
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tombol Tambah Soal tepat di bawah soal terakhir */}
                <button 
                  type="button" 
                  onClick={() => setQuizOptions([
                    ...quizOptions, 
                    { 
                      id: Math.random().toString(36).substr(2, 9), 
                      question: '', 
                      options: [
                        { id: 'A', text: '', isCorrect: true }, 
                        { id: 'B', text: '', isCorrect: false }, 
                        { id: 'C', text: '', isCorrect: false }, 
                        { id: 'D', text: '', isCorrect: false }
                      ] 
                    }
                  ])} 
                  style={{ 
                    marginTop: 16, 
                    width: '100%', 
                    padding: '10px 16px', 
                    borderRadius: '8px', 
                    background: '#fff', 
                    border: '1px solid var(--color-border)', 
                    color: 'var(--color-text-primary)', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border-heavy)'
                    e.currentTarget.style.background = 'var(--color-surface)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.background = '#fff'
                  }}
                >
                  <Plus size={15} /> Tambah Soal
                </button>
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Deskripsi Materi (Opsional)</label>
            <MarkdownTextarea value={form.description} onChange={v => f('description', v)} placeholder="Tuliskan ringkasan materi atau catatan untuk mentee di sini..." rows={3} minHeight={85} />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Reward XP</label>
            <input 
              type="number"
              min={0}
              value={form.xpReward} 
              onChange={e => f('xpReward', Number(e.target.value))} 
              placeholder="10" 
              style={inputStyle} 
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>Poin XP yang diperoleh mentee setelah menyelesaikan sesi ini (default: 10 XP).</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: 'var(--color-text-secondary)' }}>Batal</button>
          <button 
            disabled={!form.title.trim() || mutation.isPending} 
            onClick={() => mutation.mutate()} 
            style={{ 
              padding: '10px 22px', 
              borderRadius: '12px', 
              border: 'none', 
              background: !form.title.trim() ? '#E2E8F0' : '#018556', 
              color: !form.title.trim() ? '#94A3B8' : '#ffffff', 
              fontWeight: 700, 
              fontSize: '14px',
              cursor: !form.title.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: form.title.trim() ? '0 2px 8px rgba(1,133,86,0.25)' : 'none'
            }}
          >
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Materi'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Sortable Session Item ─────────────────────────────────
function SortableSessionItem({ session, index, setDeleteTarget }: { session: BootcampSession; index?: number; setDeleteTarget: any }) {
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

  const typeConfig = SESSION_TYPE_COLORS[session.type] ?? { bg: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', icon: LayoutTemplate }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: isDragging ? 'var(--color-bg)' : 'transparent',
        cursor: isDragging ? 'grabbing' : undefined,
        transition: 'background var(--transition-fast)'
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = 'var(--color-bg)' }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = 'transparent' }}
    >
      <div
        {...attributes}
        {...listeners}
        className="syllabus-drag-handle"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          padding: 4,
          borderRadius: 4,
          touchAction: 'none'
        }}
      >
        <GripVertical size={16} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
      </div>
      {index !== undefined && (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', width: 24, textAlign: 'center', fontWeight: 700 }}>
          {index + 1}
        </span>
      )}
      <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>{session.title}</span>
      <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', background: typeConfig.bg, color: typeConfig.color, border: typeConfig.border || '1px solid var(--color-border)', fontSize: '11px', fontWeight: 700 }}>
        {session.type}
      </span>
      {session.isPreview && (
        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-light)', color: '#856404', fontSize: '11px', fontWeight: 600 }}>
          Preview
        </span>
      )}

      <button
        onClick={() => setDeleteTarget({ type: 'session', id: session.id, edit: true, session })}
        style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', transition: 'color 0.15s ease' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
        title="Edit Materi"
      >
        <Edit size={15} />
      </button>

      <button
        onClick={() => setDeleteTarget({ type: 'session', id: session.id })}
        style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', transition: 'color 0.15s ease' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
        title="Hapus Materi"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

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
    <div ref={setNodeRef} style={{ ...style, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 'var(--space-4)', boxShadow: isDragging ? 'var(--shadow-xl)' : 'var(--shadow-sm)', cursor: isDragging ? 'grabbing' : undefined }}>
      {/* Chapter Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--color-bg)', borderBottom: expanded ? '1px solid var(--color-border)' : 'none' }}>
        <div
          {...attributes}
          {...listeners}
          className="syllabus-drag-handle"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            padding: 4,
            borderRadius: 4,
            touchAction: 'none'
          }}
        >
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
        <button onClick={() => setDeleteTarget({ type: 'chapter', id: chapter.id })} style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', transition: 'color 0.15s ease' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-tertiary)')} title="Hapus Bab">
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
                  chapter.sessions.map((session: any, index: number) => (
                    <SortableSessionItem key={`session-${session.id}`} session={session} index={index} setDeleteTarget={setDeleteTarget} />
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

  // Cleanup dragging class on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('is-syllabus-dragging')
      }
    }
  }, [])

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

  const reorderSessionMutation = useMutation({
    mutationFn: (data: { sessions: any[] }) => api.put(`/admin/bootcamps/${bootcampId}/sessions/reorder`, data),
    onSuccess: () => toast.success('Urutan materi berhasil diperbarui!'),
    onError: () => {
      toast.error('Gagal menyimpan urutan materi.')
      qc.invalidateQueries({ queryKey: ['admin', 'bootcamp', bootcampId, 'syllabus'] }) // revert
    }
  })

  // DnD Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
    if (typeof document !== 'undefined') {
      document.body.classList.add('is-syllabus-dragging')
    }
  }

  const handleDragCancel = () => {
    setActiveDragId(null)
    if (typeof document !== 'undefined') {
      document.body.classList.remove('is-syllabus-dragging')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    if (typeof document !== 'undefined') {
      document.body.classList.remove('is-syllabus-dragging')
    }
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
        const chapterIndex = prev.findIndex(c => c.sessions.some(s => `session-${s.id}` === active.id))
        if (chapterIndex === -1) return prev

        const oldIndex = prev[chapterIndex].sessions.findIndex(s => `session-${s.id}` === active.id)
        const newIndex = prev[chapterIndex].sessions.findIndex(s => `session-${s.id}` === over.id)
        
        const newSessions = arrayMove(prev[chapterIndex].sessions, oldIndex, newIndex)
        
        const newChapters = [...prev]
        newChapters[chapterIndex] = {
          ...prev[chapterIndex],
          sessions: newSessions
        }
        
        // API Call for session reordering
        const payload = newSessions.map((s, i) => ({ id: s.id, order: i }))
        reorderSessionMutation.mutate({ sessions: payload })
        
        return newChapters
      })
    }
  }

  const chapterIds = useMemo(() => localChapters.map(c => `chapter-${c.id}`), [localChapters])

  return (
    <div style={{ paddingBottom: 'var(--space-20)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .syllabus-drag-handle {
          cursor: grab !important;
          user-select: none;
          -webkit-user-select: none;
        }
        .syllabus-drag-handle:active {
          cursor: grabbing !important;
        }
        body.is-syllabus-dragging,
        body.is-syllabus-dragging * {
          cursor: grabbing !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
      `}} />
      <AdminPageHeader
        title="Kurikulum & Silabus"
        description={bootcamp?.title ?? 'Memuat...'}
        breadcrumbs={[
          { label: 'Bootcamp', href: '/admin/bootcamp' },
          { label: bootcamp?.title ?? '...' },
          { label: 'Kurikulum' },
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
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