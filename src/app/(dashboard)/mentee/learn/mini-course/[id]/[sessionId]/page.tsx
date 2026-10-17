'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, CheckCircle2, PlayCircle, FileText,
  MessageSquare, BookOpen, StickyNote, ChevronDown, Loader2,
  Send, Plus, Clock, Zap, Upload, Download, Award, HelpCircle, RotateCcw,
  Lock
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import api from '@/lib/axios'
import { ROUTES, formatDuration } from '@/lib/utils'
import { CardTabs } from '@/components/ui/AnimatedTabs'

import CourseVideoPlayer from '@/components/CourseVideoPlayer'

interface Session {
  id: string; title: string; type: string; videoUrl?: string
  description?: string
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
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'qna'>('overview')
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [playedRatio, setPlayedRatio] = useState(0)
  const [hasDownloaded, setHasDownloaded] = useState(false)
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

  useEffect(() => {
    setPlayedRatio(0)
    setHasDownloaded(false)
    completeTriggerRef.current = false
  }, [sessionId])

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
    setPlayedRatio(played)
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

  let parsedMaterials: Array<{ name: string; url: string }> = []
  if (currentSession?.materials) {
    if (typeof currentSession.materials === 'string') {
      try {
        parsedMaterials = JSON.parse(currentSession.materials)
      } catch {
        parsedMaterials = []
      }
    } else if (Array.isArray(currentSession.materials)) {
      parsedMaterials = currentSession.materials
    }
  }

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
            
            {/* Celebration Banner when 100% Complete */}
            {data.progress === 100 && (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 6px 16px rgba(0,0,0,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                  }}>
                    <Award size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 3px', letterSpacing: '-0.01em' }}>
                      Selamat! Anda Telah Menyelesaikan Kelas Ini 🎉
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                      Sertifikat kelulusan Anda sudah resmi diterbitkan oleh Metro Institute dan siap diunduh.
                    </p>
                  </div>
                </div>

                <Link href={ROUTES.CERTIFICATES} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 20px',
                      background: 'var(--color-primary)',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Award size={15} /> Klaim & Unduh Sertifikat
                  </motion.div>
                </Link>
              </div>
            )}

            {/* Player / Content Card */}
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
                  isCompleted={Boolean(currentSession.isCompleted || isCompleted)}
                  onProgress={handleProgress}
                  onEnded={() => {
                    if (!completeTriggerRef.current && !currentSession.isCompleted && !isCompleted) {
                      completeTriggerRef.current = true
                      completeMutation.mutate()
                    }
                  }}
                />
              </div>
            ) : currentSession.type === 'QUIZ' || (currentSession.quizOptions && (Array.isArray(currentSession.quizOptions) ? currentSession.quizOptions.length > 0 : true)) ? (
              <InteractiveQuiz
                title={currentSession.title}
                quizOptions={currentSession.quizOptions}
                isCompleted={currentSession.isCompleted || isCompleted}
                onComplete={() => completeMutation.mutate()}
              />
            ) : (
              <div style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '24px 28px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.08)',
                      color: 'var(--color-primary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}>
                      <BookOpen size={13} /> Modul Pembelajaran
                    </span>
                    {parsedMaterials.length > 0 && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#64748b',
                        background: '#f1f5f9',
                        padding: '4px 10px',
                        borderRadius: 6,
                      }}>
                        {parsedMaterials.length} File Lampiran
                      </span>
                    )}
                  </div>
                </div>

                {/* Deskripsi / Isi Materi Teks */}
                {(currentSession.description || currentSession.assignmentDescription) && (
                  <div>
                    <div style={{
                      fontSize: '14.5px',
                      color: '#334155',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      background: '#f8fafc',
                      padding: '20px 24px',
                      borderRadius: 12,
                      border: '1px solid #f1f5f9'
                    }}>
                      {currentSession.description || currentSession.assignmentDescription}
                    </div>

                    {/* Jika materi hanya berupa teks tanpa berkas unduhan */}
                    {parsedMaterials.length === 0 && !isCompleted && !currentSession.isCompleted && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => completeMutation.mutate()}
                          disabled={completeMutation.isPending}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 18px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-primary)',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          {completeMutation.isPending ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 size={15} /> Selesai Membaca Materi
                            </>
                          )}
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}

                {/* File Materi Pendukung & Unduhan */}
                {parsedMaterials.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {parsedMaterials.map((mat: any, idx: number) => {
                      const displayName = mat.name && mat.name !== 'Materi' ? mat.name : (currentSession.title ? `Dokumen - ${currentSession.title}` : `Materi Pembelajaran ${idx + 1}`)
                      return (
                        <a
                          key={idx}
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setHasDownloaded(true)
                            if (!currentSession.isCompleted && !isCompleted) {
                              completeMutation.mutate()
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            padding: '14px 18px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            textDecoration: 'none',
                            background: '#ffffff',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: 'rgba(16, 185, 129, 0.08)',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FileText size={20} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#0f172a',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {displayName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                                Dokumen Pembelajaran • Unduh untuk menyelesaikan sesi
                              </div>
                            </div>
                          </div>

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '8px 16px',
                              background: 'var(--color-primary)',
                              color: '#ffffff',
                              borderRadius: 'var(--radius-md)',
                              fontWeight: 600,
                              fontSize: '13px',
                              flexShrink: 0,
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                          >
                            <Download size={14} /> Unduh
                          </motion.div>
                        </a>
                      )
                    })}
                  </div>
                )}

                {/* If no description and no materials */}
                {!currentSession.description && !currentSession.assignmentDescription && parsedMaterials.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px 0',
                    color: '#64748b',
                    fontSize: '14px'
                  }}>
                    Materi pembelajaran untuk sesi ini dapat Anda diskusikan langsung pada tab <strong>Tanya Jawab</strong> atau buat <strong>Catatan</strong> pribadi di bawah.
                  </div>
                )}
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
                      <Zap size={13} fill="#f59e0b" color="#f59e0b" /> +{currentSession.xpReward > 0 ? currentSession.xpReward : 10} XP
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
                    (currentSession.isCompleted || isCompleted) ? (
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
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentSession.type === 'VIDEO') {
                            toast.info(`Tonton video minimal 90% untuk melanjutkan (saat ini ${Math.round(playedRatio * 100)}%).`)
                          } else if (parsedMaterials.length > 0 && !hasDownloaded) {
                            toast.info('Unduh dokumen materi terlebih dahulu untuk melanjutkan.')
                          } else if (currentSession.type === 'QUIZ') {
                            toast.info('Selesaikan kuis dengan nilai minimal 80% untuk melanjutkan.')
                          } else {
                            toast.info('Selesaikan sesi ini terlebih dahulu untuk melanjutkan.')
                          }
                        }}
                        style={{
                          padding: '9px 15px',
                          borderRadius: 10,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#94a3b8',
                          fontSize: '13px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'not-allowed',
                          opacity: 0.75,
                        }}
                        title="Selesaikan sesi ini terlebih dahulu"
                      >
                        Selanjutnya <Lock size={13} />
                      </button>
                    )
                  )}

                  {/* Status / Tombol Selesai Terbuka Sesuai Syarat */}
                  {(currentSession.isCompleted || isCompleted) ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '9px 18px',
                        borderRadius: 10,
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}
                    >
                      <CheckCircle2 size={16} /> Selesai ✓
                    </div>
                  ) : currentSession.type === 'VIDEO' ? (
                    playedRatio >= 0.9 ? (
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
                    ) : (
                      <button
                        disabled
                        title="Tonton video hingga minimal 90% untuk membuka tombol selesai"
                        style={{
                          padding: '9px 18px',
                          background: '#f1f5f9',
                          color: '#94a3b8',
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          fontWeight: 600,
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'not-allowed',
                        }}
                      >
                        <Lock size={14} /> Tonton min. 90% ({Math.min(99, Math.round(playedRatio * 100))}%)
                      </button>
                    )
                  ) : parsedMaterials.length > 0 ? (
                    hasDownloaded ? (
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
                    ) : (
                      <button
                        disabled
                        title="Unduh dokumen materi pembelajaran di atas terlebih dahulu"
                        style={{
                          padding: '9px 18px',
                          background: '#f1f5f9',
                          color: '#94a3b8',
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          fontWeight: 600,
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'not-allowed',
                        }}
                      >
                        <Lock size={14} /> Unduh Materi Dahulu
                      </button>
                    )
                  ) : currentSession.type === 'QUIZ' ? (
                    <div
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#d97706',
                        background: '#fef3c7',
                        padding: '6px 12px',
                        borderRadius: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <HelpCircle size={14} /> Min. Benar 80% untuk Lulus
                    </div>
                  ) : (
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

            {/* CardTabs — browser-tab style like bootcamp */}
            <CardTabs
              items={[
                { id: 'overview', label: 'Ringkasan', icon: BookOpen },
                { id: 'notes', label: 'Catatan', icon: StickyNote },
                { id: 'qna', label: 'Tanya Jawab', icon: MessageSquare },
              ]}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as typeof activeTab)}
            >
              <div style={{ minHeight: 280 }}>
                {activeTab === 'overview' && (
                  <div className="animate-fade-in">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                      Tentang Sesi Ini
                    </h3>
                    <p style={{ color: '#475569', lineHeight: 1.75, fontSize: '14.5px', margin: 0 }}>
                      {currentSession.assignmentDescription || "Sesi ini akan membahas materi secara mendalam sesuai kurikulum yang telah disusun. Pastikan Anda menyimak dengan baik."}
                    </p>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                      <input
                        value={note} onChange={(e) => setNote(e.target.value)}
                        placeholder="Tulis catatan penting dari sesi ini..."
                        style={{
                          flex: 1, padding: '12px 18px', borderRadius: 10,
                          border: '1px solid #e2e8f0', background: '#f8fafc',
                          fontSize: '14px', color: '#0f172a', outline: 'none'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && note.trim() && addNoteMutation.mutate(note)}
                      />
                      <button
                        onClick={() => addNoteMutation.mutate(note)} disabled={addNoteMutation.isPending || !note.trim()}
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
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input
                        value={qnaMessage} onChange={(e) => setQnaMessage(e.target.value)}
                        placeholder="Ada pertanyaan seputar materi? Tanyakan di sini..."
                        style={{
                          flex: 1, padding: '12px 18px', borderRadius: 10,
                          border: '1px solid #e2e8f0', background: '#f8fafc',
                          fontSize: '14px', color: '#0f172a', outline: 'none'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && qnaMessage.trim() && sendQnaMutation.mutate(qnaMessage)}
                      />
                      <button
                        onClick={() => sendQnaMutation.mutate(qnaMessage)} disabled={sendQnaMutation.isPending || !qnaMessage.trim()}
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
              </div>
            </CardTabs>
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

interface QuizOption {
  id: string
  text: string
  isCorrect?: boolean
}

interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
}

function InteractiveQuiz({
  title,
  quizOptions,
  onComplete,
  isCompleted,
}: {
  title: string
  quizOptions: any
  onComplete: () => void
  isCompleted: boolean
}) {
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [isStarted, setIsStarted] = useState(false)

  // Normalize quiz questions safely
  const questions: QuizQuestion[] = useMemo(() => {
    let raw = quizOptions
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch {
        raw = []
      }
    }
    if (!Array.isArray(raw)) return []

    return raw
      .map((q: any, idx: number) => {
        if (q && q.question && Array.isArray(q.options)) {
          return {
            id: q.id || `q-${idx}`,
            question: q.question,
            options: q.options.map((opt: any, oIdx: number) => ({
              id: opt.id || String.fromCharCode(65 + oIdx),
              text: opt.text || '',
              isCorrect: !!opt.isCorrect,
            })),
          }
        }
        return null
      })
      .filter(Boolean) as QuizQuestion[]
  }, [quizOptions])

  useEffect(() => {
    setCurrentQIdx(0)
    setAnswers({})
    setShowResult(false)
    setIsStarted(false)
  }, [quizOptions])

  const totalQ = questions.length
  const currentQ = questions[currentQIdx]
  const answeredCount = Object.keys(answers).length

  const handleSubmit = () => {
    let correct = 0
    questions.forEach((q) => {
      const correctOpt = q.options.find((o) => o.isCorrect)
      if (correctOpt && answers[q.id] === correctOpt.id) {
        correct++
      }
    })
    const calculatedScore = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 100
    setScore(calculatedScore)
    setShowResult(true)
    if (calculatedScore >= 80) {
      if (!isCompleted) {
        onComplete()
      }
    } else {
      toast.error(`Nilai Anda ${calculatedScore}%. Minimal benar 80% untuk lulus sesi kuis ini. Silakan ulangi kuis.`)
    }
  }

  // 1. Empty state if no questions
  if (totalQ === 0) {
    return (
      <div
        className="animate-fade-in"
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <HelpCircle size={24} color="var(--color-primary)" strokeWidth={1.8} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.01em' }}>
          Kuis: {title}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: 420, textAlign: 'center', margin: 0 }}>
          Belum ada pertanyaan yang disediakan untuk kuis ini.
        </p>
      </div>
    )
  }

  // 2. Result state
  if (showResult) {
    const isPassed = score >= 80
    return (
      <div
        className="animate-fade-in"
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '44px 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Score Ring */}
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: `conic-gradient(var(--color-primary) ${score * 3.6}deg, #e2e8f0 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {score}%
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Skor
            </span>
          </div>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
          {isPassed ? 'Kuis Berhasil Diselesaikan! 🎉' : 'Nilai Belum Mencapai Batas Minimal (80%)'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: 460, lineHeight: 1.6, marginBottom: 24, margin: '0 auto 24px' }}>
          {isPassed
            ? `Selamat! Anda berhasil memperoleh skor ${score}% (lulus syarat minimal 80%). Sesi ini telah ditandai selesai dan Anda dapat melanjutkan.`
            : `Skor Anda saat ini ${score}%. Sesuai aturan, Anda wajib menjawab minimal 80% soal dengan benar untuk menyelesaikan sesi kuis ini dan melanjutkan ke materi berikutnya.`}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {isPassed && (
            <Link
              href={ROUTES.CERTIFICATES}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 24px',
                borderRadius: 8,
                background: 'var(--color-primary)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '13.5px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <Award size={16} /> Klaim & Lihat Sertifikat
            </Link>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowResult(false)
              setCurrentQIdx(0)
              setAnswers({})
              setIsStarted(false)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 20px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              color: '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} strokeWidth={2} /> Coba Lagi Kuis
          </motion.button>
        </div>
      </div>
    )
  }

  // 3. Start Screen state (!isStarted) - CLEAN & BUTTON MATCHES "Lanjut Belajar"
  if (!isStarted) {
    return (
      <div
        className="animate-fade-in"
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '40px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: 'var(--color-primary)',
          }}
        >
          <HelpCircle size={24} strokeWidth={1.8} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.01em' }}>
          Siap untuk Mulai Kuis?
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: 440, lineHeight: 1.6, margin: '0 auto 16px' }}>
          Kuis ini terdiri dari <strong style={{ color: '#0f172a' }}>{totalQ} pertanyaan</strong>. Pastikan Anda sudah memahami materi sesi ini sebelum memulai.
        </p>

        {isCompleted && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
              borderRadius: 8,
              fontSize: '12.5px',
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            <CheckCircle2 size={14} color="var(--color-primary)" strokeWidth={2} /> Kuis Sudah Pernah Dikerjakan
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsStarted(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 28px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <PlayCircle size={16} strokeWidth={2} />
          {isCompleted ? 'Kerjakan Ulang Kuis' : 'Mulai Kuis'}
        </motion.button>
      </div>
    )
  }

  // 4. Questions state - Clean layout
  return (
    <div
      className="animate-fade-in"
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: '32px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header Question counter & Answered */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                padding: '3px 9px',
                borderRadius: 6,
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              Pertanyaan {currentQIdx + 1}
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>dari {totalQ}</span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{answeredCount}</span>/{totalQ} Terjawab
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: 5,
            background: '#f1f5f9',
            borderRadius: 3,
            marginBottom: 24,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              width: `${(answeredCount / totalQ) * 100}%`,
              transition: 'width 0.3s ease',
              borderRadius: 3,
            }}
          />
        </div>

        {/* Question Prompt */}
        <div
          style={{
            background: '#f8fafc',
            borderRadius: 10,
            padding: '20px 22px',
            border: '1px solid #e2e8f0',
            marginBottom: 18,
          }}
        >
          <p
            style={{
              fontSize: '15.5px',
              fontWeight: 600,
              lineHeight: 1.6,
              color: '#0f172a',
              margin: 0,
            }}
          >
            {currentQ.question}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = answers[currentQ.id] === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.id }))}
                style={{
                  padding: '13px 16px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                  background: isSelected ? 'rgba(16, 185, 129, 0.05)' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#cbd5e1'
                    e.currentTarget.style.background = '#f8fafc'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.background = '#ffffff'
                  }
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid #cbd5e1',
                    background: isSelected ? 'var(--color-primary)' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#0f172a' : '#334155',
                    flex: 1,
                  }}
                >
                  {opt.text}
                </span>
              </button>
            )
          })}
        </div>

        {/* Navigation buttons with Lanjut Belajar styling */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <motion.button
            whileHover={currentQIdx > 0 ? { scale: 1.02 } : {}}
            whileTap={currentQIdx > 0 ? { scale: 0.98 } : {}}
            onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
            disabled={currentQIdx === 0}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontWeight: 600,
              fontSize: '13px',
              cursor: currentQIdx === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQIdx === 0 ? 0.4 : 1,
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ChevronLeft size={16} /> Sebelumnya
          </motion.button>

          {currentQIdx === totalQ - 1 ? (
            <motion.button
              whileHover={answeredCount === totalQ ? { scale: 1.02 } : {}}
              whileTap={answeredCount === totalQ ? { scale: 0.98 } : {}}
              onClick={handleSubmit}
              disabled={answeredCount < totalQ}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: answeredCount < totalQ ? 'not-allowed' : 'pointer',
                opacity: answeredCount < totalQ ? 0.5 : 1,
              }}
            >
              <CheckCircle2 size={16} strokeWidth={2} /> Selesaikan Kuis
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentQIdx((i) => Math.min(totalQ - 1, i + 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 8,
                border: 'none',
                background: '#0f172a',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              Selanjutnya <ChevronRight size={16} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

