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

import CourseVideoPlayer from '@/components/CourseVideoPlayer'

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
      {/* -- Top Header --------------------------------------- */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        height: 64, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <Link href={ROUTES.COURSE_DETAIL(courseId)} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          color: '#0f172a', textDecoration: 'none',
          transition: 'all 0.15s',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#475569', transition: 'all 0.15s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
          >
            <ChevronLeft size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mini Course
            </div>
            <div className="truncate" style={{ maxWidth: 360, fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              {course.title}
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 220 }}>
            <div style={{ flex: 1, height: 7, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', width: `${data.progress}%`, transition: 'width 0.5s ease', borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
              {data.progress}% Selesai
            </span>
          </div>
          
          {(currentSession.isCompleted || isCompleted) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669', borderRadius: 20, fontSize: '12px', fontWeight: 700
            }}>
              <CheckCircle2 size={15} /> Selesai
            </div>
          )}
        </div>
      </header>

      {/* -- Main Layout --------------------------------------- */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Video & Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
          <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 32px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Video Player Card */}
            {currentSession.type === 'VIDEO' && currentSession.videoUrl ? (
              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: 20,
                overflow: 'hidden',
                background: '#000',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 16px 40px -12px rgba(0,0,0,0.14), 0 0 1px rgba(0,0,0,0.15)',
                position: 'relative'
              }}>
                <CourseVideoPlayer
                  url={currentSession.videoUrl}
                  title={currentSession.title}
                  onProgress={handleProgress}
                  onEnded={() => {
                    if (!completeTriggerRef.current && !currentSession.isCompleted && !isCompleted) {
                      completeTriggerRef.current = true
                      completeMutation.mutate()
                    }
                  }}
                />
              </div>
            ) : (
              <div style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '48px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14
                }}>
                  <BookOpen size={28} color="var(--color-primary)" />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Sesi Teks / Tugas
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px', maxWidth: 440, textAlign: 'center', margin: 0 }}>
                  Pelajari materi di bawah ini secara saksama dan tandai sebagai selesai jika Anda sudah memahaminya.
                </p>
              </div>
            )}

            {/* Session Info Header & Quick Actions */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: '#ffffff',
              padding: '24px 28px',
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--color-primary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.02em'
                    }}>
                      Sesi {currentSession.orderIndex || 1}
                    </span>

                    {currentSession.videoDuration && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#64748b'
                      }}>
                        <Clock size={13} color="#94a3b8" /> {formatDuration(currentSession.videoDuration)}
                      </span>
                    )}

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: '#fef3c7',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#b45309'
                    }}>
                      <Zap size={13} fill="#f59e0b" color="#f59e0b" /> +{currentSession.xpReward} XP
                    </span>
                  </div>

                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                    lineHeight: 1.3,
                    letterSpacing: '-0.02em'
                  }}>
                    {currentSession.title}
                  </h1>
                </div>

                {/* Right: Actions (Nav Prev/Next + Complete) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {prevSessionId && (
                    <Link
                      href={ROUTES.LEARN_COURSE_SESSION(courseId, prevSessionId)}
                      style={{
                        padding: '9px 15px',
                        borderRadius: 10,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        textDecoration: 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      <ChevronLeft size={16} /> Sebelumnya
                    </Link>
                  )}

                  {nextSessionId && (
                    <Link
                      href={ROUTES.LEARN_COURSE_SESSION(courseId, nextSessionId)}
                      style={{
                        padding: '9px 15px',
                        borderRadius: 10,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        textDecoration: 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      Selanjutnya <ChevronRight size={16} />
                    </Link>
                  )}

                  {!(currentSession.isCompleted || isCompleted) && (
                    <button
                      onClick={() => completeMutation.mutate()}
                      disabled={completeMutation.isPending}
                      style={{
                        padding: '9px 18px',
                        background: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      {completeMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Tandai Selesai
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs & Tab Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Tabs Switcher */}
              <div style={{
                display: 'flex',
                gap: 6,
                padding: 4,
                background: '#f1f5f9',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                width: 'fit-content'
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
                        padding: '8px 18px',
                        borderRadius: 10,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: isActive ? 700 : 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: isActive ? '#ffffff' : 'transparent',
                        color: isActive ? '#0f172a' : '#64748b',
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      <tab.icon size={15} color={isActive ? 'var(--color-primary)' : '#64748b'} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content Card */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 20,
                padding: '28px 32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                minHeight: 320
              }}>
                {activeTab === 'overview' && (
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                      Tentang Sesi Ini
                    </h3>
                    <p style={{ color: '#475569', lineHeight: 1.75, fontSize: '15px', margin: 0 }}>
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
                          flex: 1, padding: '12px 18px', borderRadius: 10,
                          border: '1px solid #e2e8f0', background: '#f8fafc',
                          fontSize: '14px', color: '#0f172a', outline: 'none'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && addNoteMutation.mutate()}
                      />
                      <button
                        onClick={() => addNoteMutation.mutate()} disabled={addNoteMutation.isPending || !note.trim()}
                        style={{
                          padding: '0 20px', borderRadius: 10, border: 'none',
                          background: 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: '13px',
                          cursor: note.trim() ? 'pointer' : 'not-allowed', opacity: note.trim() ? 1 : 0.6,
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <Plus size={16} /> Simpan
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(notes as Array<{ id: string; content: string; timestamp: number }>).map((n) => (
                        <div key={n.id} style={{
                          padding: '14px 18px', border: '1px solid #e2e8f0',
                          borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'flex-start', gap: 14
                        }}>
                          <div style={{
                            padding: '3px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)',
                            borderRadius: 6, fontSize: '11px', fontWeight: 700, fontFamily: 'monospace'
                          }}>
                            {formatDuration(n.timestamp)}
                          </div>
                          <p style={{ flex: 1, margin: 0, color: '#334155', fontSize: '14px', lineHeight: 1.5 }}>{n.content}</p>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                          <StickyNote size={40} opacity={0.3} style={{ margin: '0 auto 12px' }} />
                          <p style={{ fontSize: '14px', margin: 0 }}>Belum ada catatan untuk sesi ini.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'qna' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input
                        value={qnaMessage} onChange={(e) => setQnaMessage(e.target.value)}
                        placeholder="Ada pertanyaan seputar materi? Tanyakan di sini..."
                        style={{
                          flex: 1, padding: '12px 18px', borderRadius: 10,
                          border: '1px solid #e2e8f0', background: '#f8fafc',
                          fontSize: '14px', color: '#0f172a', outline: 'none'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && sendQnaMutation.mutate()}
                      />
                      <button
                        onClick={() => sendQnaMutation.mutate()} disabled={sendQnaMutation.isPending || !qnaMessage.trim()}
                        style={{
                          padding: '0 20px', borderRadius: 10, border: 'none',
                          background: '#0f172a', color: '#fff', fontWeight: 600, fontSize: '13px',
                          cursor: qnaMessage.trim() ? 'pointer' : 'not-allowed', opacity: qnaMessage.trim() ? 1 : 0.6,
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <Send size={16} /> Kirim
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(qnaMessages as Array<{ id: string; content: string; user: { name: string }; createdAt: string }>).map((msg) => (
                        <div key={msg.id} style={{ padding: '16px 20px', border: '1px solid #e2e8f0', borderRadius: 14, background: '#f8fafc' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#334155'
                            }}>
                              {msg.user.name[0]}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{msg.user.name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(msg.createdAt).toLocaleString('id-ID')}</div>
                            </div>
                          </div>
                          <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
                        </div>
                      ))}
                      {qnaMessages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                          <MessageSquare size={40} opacity={0.3} style={{ margin: '0 auto 12px' }} />
                          <p style={{ fontSize: '14px', margin: 0 }}>Jadilah yang pertama bertanya!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'materials' && (
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Materi Pendukung</h3>
                    {currentSession.materials && currentSession.materials.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {currentSession.materials.map((mat) => (
                          <a
                            key={mat.url} href={mat.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '14px 18px', border: '1px solid #e2e8f0',
                              borderRadius: 14, textDecoration: 'none', background: '#f8fafc',
                              color: '#0f172a', transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = '#ffffff' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
                          >
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileText size={18} color="var(--color-primary)" />
                            </div>
                            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>{mat.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600 }}>
                              <Download size={15} /> Unduh
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                        <FileText size={40} opacity={0.3} style={{ margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '14px', margin: 0 }}>Tidak ada materi tambahan untuk sesi ini.</p>
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

