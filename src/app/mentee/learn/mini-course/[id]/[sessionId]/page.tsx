'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, CheckCircle2, PlayCircle, FileText,
  MessageSquare, BookOpen, StickyNote, ChevronDown, Loader2,
  Send, Plus, Clock, Zap, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import api from '@/lib/axios'
import { ROUTES, formatDuration } from '@/lib/utils'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

interface Session {
  id: string; title: string; type: string; videoUrl?: string
  videoDuration?: number; materials?: Array<{ name: string; url: string }>
  isFreePreview: boolean; isCompleted: boolean; orderIndex: number
  xpReward: number; assignmentDescription?: string; assignmentDeadline?: string
  quizOptions?: Array<{ id: string; text: string; isCorrect: boolean; explanation: string }>
  assignment?: { score?: number; feedback?: string; fileUrl?: string; submittedAt?: string }
}

interface Chapter {
  id: string; title: string; sessions: Session[]
}

interface LearningData {
  course: { id: string; title: string; field: string }
  chapters: Chapter[]
  currentSession: Session
  prevSessionId?: string
  nextSessionId?: string
  progress: number
}

export default function CourseLearningPlayerPage() {
  const { id: courseId, sessionId } = useParams<{ id: string; sessionId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'qna' | 'materials'>('overview')
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(['0']))
  const [note, setNote] = useState('')
  const [qnaMessage, setQnaMessage] = useState('')
  const playerRef = useRef<unknown>(null)
  const completeTriggerRef = useRef(false)

  const { data, isLoading } = useQuery<LearningData>({
    queryKey: ['learn-course', courseId, sessionId],
    queryFn: () =>
      api.get(`/courses/${courseId}/learn/${sessionId}`).then((r) => r.data.data),
  })

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', courseId, sessionId],
    queryFn: () => api.get(`/courses/${courseId}/sessions/${sessionId}/notes`).then((r) => r.data.data),
    enabled: activeTab === 'notes',
  })

  const { data: qnaMessages = [] } = useQuery({
    queryKey: ['qna', courseId, sessionId],
    queryFn: () => api.get(`/courses/${courseId}/sessions/${sessionId}/qna`).then((r) => r.data.data),
    enabled: activeTab === 'qna',
  })

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/courses/${courseId}/sessions/${sessionId}/complete`).then((r) => r.data),
    onSuccess: (data) => {
      setIsCompleted(true)
      queryClient.invalidateQueries({ queryKey: ['learn-course'] })
      if (data.data?.xpEarned) {
        toast.success(`+${data.data.xpEarned} XP diperoleh! 🎉`, { duration: 3000 })
      }
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/courses/${courseId}/sessions/${sessionId}/notes`, { content, timestampSec: Math.floor(playedSeconds) }),
    onSuccess: () => {
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Catatan disimpan')
    },
  })

  const sendQnaMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/courses/${courseId}/sessions/${sessionId}/qna`, { content }),
    onSuccess: () => {
      setQnaMessage('')
      queryClient.invalidateQueries({ queryKey: ['qna'] })
    },
  })

  const uploadAssignmentMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/courses/${courseId}/sessions/${sessionId}/assignment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      toast.success('Tugas berhasil dikumpulkan!')
      queryClient.invalidateQueries({ queryKey: ['learn-course'] })
    },
    onError: () => toast.error('Gagal mengumpulkan tugas.'),
  })

  // Auto complete when 90% watched
  const handleProgress = useCallback(({ playedSeconds: ps, played }: { playedSeconds: number; played: number }) => {
    setPlayedSeconds(ps)
    if (played >= 0.9 && !completeTriggerRef.current && !isCompleted && !data?.currentSession.isCompleted) {
      completeTriggerRef.current = true
      completeMutation.mutate()
    }
  }, [isCompleted, data])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast.error('File maksimal 20MB'); return }
    const fd = new FormData()
    fd.append('file', file)
    uploadAssignmentMutation.mutate(fd)
  }

  if (isLoading || !data) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
      </div>
    )
  }

  const { course, chapters, currentSession, prevSessionId, nextSessionId } = data

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Bar ────────────────────────────────────────── */}
      <header style={{
        background: '#111', borderBottom: '1px solid #222',
        padding: '0 var(--space-4)', height: 56,
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexShrink: 0,
      }}>
        <Link href={ROUTES.LEARN_COURSE(courseId)} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          color: '#888', textDecoration: 'none', fontSize: 'var(--text-sm)',
          transition: 'color var(--transition-fast)',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
        >
          <ChevronLeft size={16} />
          <span className="truncate" style={{ maxWidth: 200 }}>{course.title}</span>
        </Link>

        <div style={{ flex: 1 }}>
          <div style={{ height: 4, background: '#222', borderRadius: 2, maxWidth: 400 }}>
            <div style={{ height: '100%', background: 'var(--color-primary)', borderRadius: 2, width: `${data.progress}%`, transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: '11px', color: '#666', marginTop: 2, display: 'block' }}>{data.progress}% selesai</span>
        </div>

        {(currentSession.isCompleted || isCompleted) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-primary)' }}>
            <CheckCircle2 size={16} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Selesai</span>
          </div>
        )}
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Video / Content Area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Video Player */}
          {currentSession.type === 'VIDEO' && currentSession.videoUrl && (
            <div style={{ background: '#000', aspectRatio: '16/9', maxHeight: '60vh', width: '100%' }}>
              <ReactPlayer
                ref={playerRef as any}
                url={currentSession.videoUrl}
                width="100%"
                height="100%"
                controls
                onProgress={handleProgress}
                onEnded={() => { if (!completeTriggerRef.current) { completeTriggerRef.current = true; completeMutation.mutate() } }}
                config={{ file: { attributes: { controlsList: 'nodownload' } } }}
              />
            </div>
          )}

          {/* Content Panel */}
          <div style={{ background: 'var(--color-bg)', minHeight: 'calc(100% - 60vh)' }}>
            {/* Tabs */}
            <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '0 var(--space-6)' }}>
              <div className="tabs">
                {[
                  { id: 'overview', label: 'Ringkasan', icon: BookOpen },
                  { id: 'notes', label: 'Catatan', icon: StickyNote },
                  { id: 'qna', label: 'QnA', icon: MessageSquare },
                  { id: 'materials', label: 'Materi', icon: FileText },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: 'var(--space-6)', maxWidth: 760 }}>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
                    <div>
                      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>{currentSession.title}</h1>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        {currentSession.videoDuration && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                            <Clock size={13} /> {formatDuration(currentSession.videoDuration)}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--color-xp)' }}>
                          <Zap size={13} /> +{currentSession.xpReward} XP
                        </span>
                      </div>
                    </div>
                    {!(currentSession.isCompleted || isCompleted) && currentSession.type !== 'VIDEO' && (
                      <button
                        onClick={() => completeMutation.mutate()}
                        disabled={completeMutation.isPending}
                        className="btn btn-primary btn-sm"
                      >
                        {completeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Tandai Selesai</>}
                      </button>
                    )}
                  </div>

                  {/* Assignment */}
                  {currentSession.type === 'ASSIGNMENT' && currentSession.assignmentDescription && (
                    <div style={{ background: 'var(--color-primary-xlight)', border: '1.5px solid var(--color-primary-light)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                      <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-primary)' }}>📋 Deskripsi Tugas</h3>
                      <p style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-line', marginBottom: 'var(--space-5)' }}>
                        {currentSession.assignmentDescription}
                      </p>

                      {currentSession.assignment ? (
                        <div style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <CheckCircle2 size={16} color="var(--color-primary)" />
                            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>Tugas Sudah Dikumpulkan</span>
                          </div>
                          {currentSession.assignment.score !== undefined && (
                            <div style={{ fontSize: 'var(--text-sm)' }}>
                              <strong>Nilai:</strong> {currentSession.assignment.score}/100
                              {currentSession.assignment.feedback && (
                                <p style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>{currentSession.assignment.feedback}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                            {uploadAssignmentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Upload size={14} /> Kumpulkan Tugas</>}
                            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }}
                              accept=".pdf,.doc,.docx,.zip,.png,.jpg" disabled={uploadAssignmentMutation.isPending} />
                          </label>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 8 }}>PDF, DOC, ZIP, atau gambar. Maks 20MB.</p>
                          {currentSession.assignmentDeadline && (
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', marginTop: 4 }}>
                              ⏰ Deadline: {new Date(currentSession.assignmentDeadline).toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nav buttons */}
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    {prevSessionId && (
                      <Link href={ROUTES.LEARN_COURSE_SESSION(courseId, prevSessionId)} className="btn btn-secondary" style={{ flex: 1 }}>
                        <ChevronLeft size={16} /> Sebelumnya
                      </Link>
                    )}
                    {nextSessionId && (
                      <Link href={ROUTES.LEARN_COURSE_SESSION(courseId, nextSessionId)} className="btn btn-primary" style={{ flex: 1 }}>
                        Selanjutnya <ChevronRight size={16} />
                      </Link>
                    )}
                    {!nextSessionId && (currentSession.isCompleted || isCompleted) && (
                      <Link href={ROUTES.CERTIFICATES} className="btn btn-primary" style={{ flex: 1 }}>
                        🎉 Kursus Selesai — Lihat Sertifikat
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Catatan Saya</h2>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Tulis catatan untuk sesi ini..."
                      className="form-textarea"
                      rows={3}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                      {currentSession.videoDuration && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                          Timestamp: {formatDuration(Math.floor(playedSeconds))}
                        </span>
                      )}
                      <button
                        onClick={() => note.trim() && addNoteMutation.mutate(note)}
                        disabled={!note.trim() || addNoteMutation.isPending}
                        className="btn btn-primary btn-sm"
                      >
                        {addNoteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Simpan</>}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {(notes as Array<{ id: string; content: string; timestampSec?: number; createdAt: string }>).map((n) => (
                      <div key={n.id} style={{ padding: 'var(--space-4)', background: 'var(--color-accent-light)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-lg)' }}>
                        {n.timestampSec !== undefined && (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 4, display: 'block' }}>
                            ⏱ {formatDuration(n.timestampSec)}
                          </span>
                        )}
                        <p style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-line' }}>{n.content}</p>
                      </div>
                    ))}
                    {(notes as unknown[]).length === 0 && (
                      <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-8)' }}>Belum ada catatan untuk sesi ini.</p>
                    )}
                  </div>
                </div>
              )}

              {/* QnA Tab */}
              {activeTab === 'qna' && (
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Tanya Jawab</h2>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <textarea
                      value={qnaMessage}
                      onChange={(e) => setQnaMessage(e.target.value)}
                      placeholder="Tulis pertanyaanmu..."
                      className="form-textarea"
                      rows={3}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                      <button
                        onClick={() => qnaMessage.trim() && sendQnaMutation.mutate(qnaMessage)}
                        disabled={!qnaMessage.trim() || sendQnaMutation.isPending}
                        className="btn btn-primary btn-sm"
                      >
                        <Send size={14} /> Kirim
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {(qnaMessages as Array<{ id: string; content: string; user: { name: string }; createdAt: string }>).map((msg) => (
                      <div key={msg.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                          <div className="avatar avatar-sm" style={{ fontSize: '11px' }}>{msg.user.name[0]}</div>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{msg.user.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
                            {new Date(msg.createdAt).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials Tab */}
              {activeTab === 'materials' && (
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Materi Sesi</h2>
                  {currentSession.materials && currentSession.materials.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {currentSession.materials.map((mat) => (
                        <a
                          key={mat.url}
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: 'var(--space-4)', border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)', textDecoration: 'none',
                            color: 'var(--color-text-primary)', transition: 'background var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <FileText size={16} color="var(--color-primary)" />
                          <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>{mat.name}</span>
                          <ChevronRight size={14} color="var(--color-text-tertiary)" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-8)' }}>
                      Tidak ada materi tambahan untuk sesi ini.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar: Curriculum ─────────────────────────── */}
        <div style={{
          width: 300, background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          overflow: 'auto', flexShrink: 0,
        }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Kurikulum</h3>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div className="progress-bar progress-bar-thin">
                <div className="progress-bar-fill" style={{ width: `${data.progress}%` }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2, display: 'block' }}>
                {data.progress}% selesai
              </span>
            </div>
          </div>

          {chapters.map((chapter, idx) => {
            const isOpen = expandedChapters.has(String(idx))
            const completedCount = chapter.sessions.filter((s) => s.isCompleted).length
            return (
              <div key={chapter.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <button
                  onClick={() => setExpandedChapters((prev) => {
                    const next = new Set(prev)
                    next.has(String(idx)) ? next.delete(String(idx)) : next.add(String(idx))
                    return next
                  })}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'transparent', cursor: 'pointer',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{chapter.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                      {completedCount}/{chapter.sessions.length} selesai
                    </div>
                  </div>
                  <ChevronDown size={14} color="var(--color-text-tertiary)"
                    style={{ transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 200ms' }} />
                </button>
                {isOpen && chapter.sessions.map((sess) => {
                  const isActive = sess.id === sessionId
                  return (
                    <Link
                      key={sess.id}
                      href={ROUTES.LEARN_COURSE_SESSION(courseId, sess.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                        padding: 'var(--space-2) var(--space-4) var(--space-2) var(--space-6)',
                        background: isActive ? 'var(--color-primary-xlight)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                        textDecoration: 'none', transition: 'background var(--transition-fast)',
                      }}
                    >
                      {sess.isCompleted
                        ? <CheckCircle2 size={12} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                        : <PlayCircle size={12} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
                      }
                      <span style={{
                        fontSize: '12px', flex: 1,
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: isActive ? 600 : 400,
                        lineHeight: 1.4,
                      }}>{sess.title}</span>
                      {sess.videoDuration && (
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                          {formatDuration(sess.videoDuration)}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
