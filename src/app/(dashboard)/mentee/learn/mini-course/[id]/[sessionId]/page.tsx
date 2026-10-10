'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, CheckCircle2, PlayCircle, FileText,
  MessageSquare, BookOpen, StickyNote, ChevronDown, Loader2,
  Send, Plus, Clock, Zap, Upload, Download, Award
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import api from '@/lib/axios'
import { ROUTES, formatDuration } from '@/lib/utils'
import { CardTabs } from '@/components/ui/AnimatedTabs'

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
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f172a' }}>
      {/* -- Top Header --------------------------------------- */}
      <header style={{
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        height: 64, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        zIndex: 10,
      }}>
        <Link href={ROUTES.COURSE_DETAIL(courseId)} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          color: '#e2e8f0', textDecoration: 'none', fontSize: '15px', fontWeight: 600,
          transition: 'color 0.2s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#e2e8f0')}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ChevronLeft size={18} />
          </div>
          <span className="truncate" style={{ maxWidth: 300 }}>{course.title}</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 200 }}>
            <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--color-primary)', width: `${data.progress}%`, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>
              {data.progress}% Selesai
            </span>
          </div>
          
          {(currentSession.isCompleted || isCompleted) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981', borderRadius: 20, fontSize: '13px', fontWeight: 600
            }}>
              <CheckCircle2 size={16} /> Selesai
            </div>
          )}
        </div>
      </header>

      {/* -- Main Layout --------------------------------------- */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Video & Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', overflow: 'hidden' }}>
          
          {/* Video Player */}
          {currentSession.type === 'VIDEO' && currentSession.videoUrl ? (
            <div style={{
              background: '#000', width: '100%', flexShrink: 0,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 5,
            }}>
              <div style={{ width: '100%', maxWidth: '1200px', aspectRatio: '16/9', maxHeight: '65vh' }}>
                {(() => {
                  const Player = ReactPlayer as any;
                  return (
                    <Player
                      ref={playerRef as any}
                      url={currentSession.videoUrl}
                      width="100%" height="100%"
                      controls
                      onProgress={handleProgress as any}
                      onEnded={() => { if (!completeTriggerRef.current) { completeTriggerRef.current = true; completeMutation.mutate() } }}
                      config={{ file: { attributes: { controlsList: 'nodownload' } } } as any}
                    />
                  );
                })()}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#0f172a', width: '100%', padding: '60px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderBottom: '1px solid #1e293b'
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <BookOpen size={32} color="var(--color-primary)" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Sesi Teks / Tugas</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: 400, textAlign: 'center' }}>
                Pelajari materi di bawah ini dan tandai sebagai selesai jika Anda sudah memahaminya.
              </p>
            </div>
          )}

          {/* Content Area */}
          <div style={{ flex: 1, overflow: 'auto', padding: '32px 0' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 12, lineHeight: 1.3 }}>
                    {currentSession.title}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {currentSession.videoDuration && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                        <Clock size={16} /> {formatDuration(currentSession.videoDuration)}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '14px', fontWeight: 600, color: '#eab308' }}>
                      <Zap size={16} /> +{currentSession.xpReward} XP
                    </span>
                  </div>
                </div>
                {!(currentSession.isCompleted || isCompleted) && currentSession.type !== 'VIDEO' && (
                  <button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    style={{
                      padding: '12px 24px', background: 'var(--color-primary)', color: '#fff',
                      border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '14px',
                      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    {completeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={18} /> Tandai Selesai</>}
                  </button>
                )}
              </div>

              {/* Tabs Container */}
              <div style={{
                display: 'flex', gap: 8, marginBottom: 32, padding: 4,
                background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border-subtle)',
                width: 'max-content'
              }}>
                {[
                  { id: 'overview', label: 'Ringkasan', icon: BookOpen },
                  { id: 'notes', label: 'Catatan', icon: StickyNote },
                  { id: 'qna', label: 'Tanya Jawab', icon: MessageSquare },
                  { id: 'materials', label: 'Materi', icon: FileText },
                ].map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      style={{
                        padding: '10px 20px', borderRadius: 12,
                        border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: isActive ? '#fff' : 'transparent',
                        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <tab.icon size={16} color={isActive ? 'var(--color-primary)' : 'currentColor'} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 24, padding: 32, minHeight: 400 }}>
                {activeTab === 'overview' && (
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Tentang Sesi Ini</h2>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '15px' }}>
                      {currentSession.assignmentDescription || "Sesi ini akan membahas materi secara mendalam sesuai kurikulum yang telah disusun. Pastikan Anda menyimak dengan baik."}
                    </p>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                      <input
                        value={note} onChange={(e) => setNote(e.target.value)}
                        placeholder="Tulis catatan penting dari sesi ini..."
                        style={{
                          flex: 1, padding: '14px 20px', borderRadius: 12,
                          border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                          fontSize: '15px', color: 'var(--color-text-primary)'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && addNoteMutation.mutate()}
                      />
                      <button
                        onClick={() => addNoteMutation.mutate()} disabled={addNoteMutation.isPending || !note.trim()}
                        style={{
                          padding: '0 24px', borderRadius: 12, border: 'none',
                          background: 'var(--color-primary)', color: '#fff', fontWeight: 600,
                          cursor: note.trim() ? 'pointer' : 'not-allowed', opacity: note.trim() ? 1 : 0.6,
                          display: 'flex', alignItems: 'center', gap: 8
                        }}
                      >
                        <Plus size={18} /> Simpan
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {(notes as Array<{ id: string; content: string; timestamp: number }>).map((n) => (
                        <div key={n.id} style={{
                          padding: '16px 20px', border: '1px solid var(--color-border-subtle)',
                          borderRadius: 16, background: 'var(--color-bg)', display: 'flex', alignItems: 'flex-start', gap: 16
                        }}>
                          <div style={{
                            padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)',
                            borderRadius: 8, fontSize: '12px', fontWeight: 700, fontFamily: 'monospace'
                          }}>
                            {formatDuration(n.timestamp)}
                          </div>
                          <p style={{ flex: 1, margin: 0, color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{n.content}</p>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)' }}>
                          <StickyNote size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
                          <p>Belum ada catatan.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'qna' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input
                        value={qnaMessage} onChange={(e) => setQnaMessage(e.target.value)}
                        placeholder="Ada pertanyaan? Tanyakan di sini..."
                        style={{
                          flex: 1, padding: '14px 20px', borderRadius: 12,
                          border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                          fontSize: '15px'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && addQnaMutation.mutate()}
                      />
                      <button
                        onClick={() => addQnaMutation.mutate()} disabled={addQnaMutation.isPending || !qnaMessage.trim()}
                        style={{
                          padding: '0 24px', borderRadius: 12, border: 'none',
                          background: '#1e293b', color: '#fff', fontWeight: 600,
                          cursor: qnaMessage.trim() ? 'pointer' : 'not-allowed', opacity: qnaMessage.trim() ? 1 : 0.6,
                          display: 'flex', alignItems: 'center', gap: 8
                        }}
                      >
                        <Send size={18} /> Kirim
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {(qnaMessages as Array<{ id: string; content: string; user: { name: string }; createdAt: string }>).map((msg) => (
                        <div key={msg.id} style={{ padding: '20px', border: '1px solid var(--color-border-subtle)', borderRadius: 16, background: 'var(--color-bg)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#475569'
                            }}>
                              {msg.user.name[0]}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{msg.user.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{new Date(msg.createdAt).toLocaleString('id-ID')}</div>
                            </div>
                          </div>
                          <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{msg.content}</p>
                        </div>
                      ))}
                      {qnaMessages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)' }}>
                          <MessageSquare size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
                          <p>Jadilah yang pertama bertanya!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'materials' && (
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 20 }}>Materi Pendukung</h2>
                    {currentSession.materials && currentSession.materials.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {currentSession.materials.map((mat) => (
                          <a
                            key={mat.url} href={mat.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 16,
                              padding: '16px 20px', border: '1px solid var(--color-border-subtle)',
                              borderRadius: 16, textDecoration: 'none', background: 'var(--color-bg)',
                              color: 'var(--color-text-primary)', transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; e.currentTarget.style.boxShadow = 'none' }}
                          >
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileText size={20} color="var(--color-primary)" />
                            </div>
                            <span style={{ flex: 1, fontSize: '15px', fontWeight: 600 }}>{mat.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600 }}>
                              <Download size={16} /> Unduh
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)' }}>
                        <FileText size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
                        <p>Tidak ada materi tambahan untuk sesi ini.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Curriculum Sidebar */}
        <div style={{
          width: 360, background: '#fff',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.02)', zIndex: 10
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>Kurikulum Kelas</h3>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Progres Belajar</span>
                <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 700 }}>{data.progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--color-primary)', width: `${data.progress}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '16px 0' }}>
            {chapters.map((chapter, idx) => {
              const isOpen = expandedChapters.has(String(idx))
              const completedCount = chapter.sessions.filter((s) => s.isCompleted).length
              return (
                <div key={chapter.id} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => setExpandedChapters((prev) => {
                      const next = new Set(prev)
                      next.has(String(idx)) ? next.delete(String(idx)) : next.add(String(idx))
                      return next
                    })}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 24px', background: 'transparent', border: 'none', cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ textAlign: 'left', flex: 1, paddingRight: 16 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                        {chapter.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                        {completedCount}/{chapter.sessions.length} Sesi Selesai
                      </div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: 'var(--color-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <ChevronDown size={16} color="var(--color-text-secondary)"
                        style={{ transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div style={{ padding: '8px 16px' }}>
                      {chapter.sessions.map((sess, sIdx) => {
                        const isActive = sess.id === sessionId
                        return (
                          <Link
                            key={sess.id}
                            href={ROUTES.LEARN_COURSE_SESSION(courseId, sess.id)}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 12,
                              padding: '12px 16px', textDecoration: 'none',
                              background: isActive ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                              borderRadius: 12, marginBottom: 4,
                              border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.background = 'var(--color-bg)' }}
                            onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.background = 'transparent' }}
                          >
                            <div style={{ marginTop: 2 }}>
                              {sess.isCompleted
                                ? <CheckCircle2 size={18} color="var(--color-primary)" />
                                : <PlayCircle size={18} color={isActive ? 'var(--color-primary)' : '#cbd5e1'} />
                              }
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '13px', fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                lineHeight: 1.4, marginBottom: 4
                              }}>
                                {sIdx + 1}. {sess.title}
                              </div>
                              {sess.videoDuration && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                                  <Clock size={12} /> {formatDuration(sess.videoDuration)}
                                </div>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

