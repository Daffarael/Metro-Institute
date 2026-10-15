'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, CheckCircle2, PlayCircle, FileText,
  MessageSquare, BookOpen, StickyNote, ChevronDown, Loader2,
  Send, Plus, Clock, Zap, Upload, Download, Award, HelpCircle, RotateCcw,
  Video, ExternalLink, Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { ROUTES, formatDuration, formatDate } from '@/lib/utils'
import { CardTabs } from '@/components/ui/AnimatedTabs'
import CourseVideoPlayer from '@/components/CourseVideoPlayer'

interface Session {
  id: string
  title: string
  description?: string
  type: 'VIDEO' | 'LIVE' | 'ASSIGNMENT' | 'QUIZ' | 'MATERIAL'
  videoUrl?: string
  videoDuration?: number
  liveUrl?: string
  liveScheduledAt?: string
  attendanceWindowMin?: number
  materials?: Array<{ name: string; url: string }>
  isFreePreview: boolean
  isCompleted: boolean
  orderIndex: number
  xpReward: number
  assignmentDescription?: string
  assignmentDeadline?: string
  quizOptions?: Array<{ id: string; text: string; isCorrect: boolean; explanation: string }>
  assignment?: { score?: number; feedback?: string; fileUrl?: string; linkUrl?: string; submittedAt?: string }
}

interface Chapter {
  id: string
  title: string
  sessions: Session[]
}

interface LearningData {
  bootcamp: { id: string; title: string; field: string }
  chapters: Chapter[]
  currentSession: Session
  prevSessionId?: string
  nextSessionId?: string
  progress: number
}

interface QuizQuestion {
  id: string
  question: string
  options: Array<{ id: string; text: string; isCorrect: boolean }>
}

export default function BootcampLearningPlayerPage() {
  const { id: bootcampId, sessionId } = useParams<{ id: string; sessionId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'qna' | 'materials'>('overview')
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(['0']))
  const [note, setNote] = useState('')
  const [qnaMessage, setQnaMessage] = useState('')
  const [assignmentLink, setAssignmentLink] = useState('')
  const playerRef = useRef<unknown>(null)
  const completeTriggerRef = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data, isLoading, isError } = useQuery<LearningData>({
    queryKey: ['learn-bootcamp', bootcampId, sessionId],
    queryFn: () =>
      api.get(`/bootcamps/${bootcampId}/learn/${sessionId}`).then((r) => r.data.data),
  })

  const { data: notes = [] } = useQuery({
    queryKey: ['bootcamp-notes', bootcampId, sessionId],
    queryFn: () => api.get(`/bootcamps/${bootcampId}/sessions/${sessionId}/notes`).then((r) => r.data.data),
    enabled: activeTab === 'notes',
  })

  const { data: qnaMessages = [] } = useQuery({
    queryKey: ['bootcamp-qna', bootcampId, sessionId],
    queryFn: () => api.get(`/bootcamps/${bootcampId}/sessions/${sessionId}/qna`).then((r) => r.data.data),
    enabled: activeTab === 'qna',
  })

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/bootcamps/${bootcampId}/sessions/${sessionId}/complete`).then((r) => r.data),
    onSuccess: () => {
      setIsCompleted(true)
      queryClient.invalidateQueries({ queryKey: ['learn-bootcamp', bootcampId, sessionId] })
      queryClient.invalidateQueries({ queryKey: ['bootcamp-detail', bootcampId] })
      queryClient.invalidateQueries({ queryKey: ['enrolled-courses'] })
      toast.success('Sesi berhasil diselesaikan! XP Anda telah bertambah 🎉')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menandai sesi selesai')
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: () =>
      api.post(`/bootcamps/${bootcampId}/sessions/${sessionId}/notes`, {
        content: note,
        timestampSec: Math.floor(playedSeconds),
      }),
    onSuccess: () => {
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['bootcamp-notes', bootcampId, sessionId] })
      toast.success('Catatan berhasil disimpan!')
    },
    onError: () => toast.error('Gagal menyimpan catatan'),
  })

  const addQnaMutation = useMutation({
    mutationFn: () =>
      api.post(`/bootcamps/${bootcampId}/sessions/${sessionId}/qna`, { content: qnaMessage }),
    onSuccess: () => {
      setQnaMessage('')
      queryClient.invalidateQueries({ queryKey: ['bootcamp-qna', bootcampId, sessionId] })
      toast.success('Pertanyaan berhasil dikirim!')
    },
    onError: () => toast.error('Gagal mengirim pertanyaan'),
  })

  const submitAssignmentMutation = useMutation({
    mutationFn: () =>
      api.post(`/mentee/bootcamps/${bootcampId}/sessions/${sessionId}/assignments`, {
        linkUrl: assignmentLink,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learn-bootcamp', bootcampId, sessionId] })
      toast.success('Tugas berhasil dikumpulkan!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengumpulkan tugas')
    },
  })

  useEffect(() => {
    if (data?.currentSession) {
      setIsCompleted(data.currentSession.isCompleted)
      completeTriggerRef.current = false
      if (data.currentSession.assignment?.linkUrl) {
        setAssignmentLink(data.currentSession.assignment.linkUrl)
      }
    }
  }, [data?.currentSession])

  useEffect(() => {
    if (data?.chapters) {
      const currentChapterIdx = data.chapters.findIndex((c) =>
        c.sessions.some((s) => s.id === sessionId)
      )
      if (currentChapterIdx !== -1) {
        setExpandedChapters((prev) => new Set([...prev, String(currentChapterIdx)]))
      }
    }
  }, [data?.chapters, sessionId])

  const handleProgress = useCallback((state: { playedSeconds: number; played: number }) => {
    setPlayedSeconds(state.playedSeconds)
  }, [])

  if (isLoading || !mounted) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={36} className="animate-spin" color="var(--color-primary)" />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Memuat materi bootcamp...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 600 }}>Sesi tidak ditemukan atau Anda belum terdaftar.</p>
        <Link href={ROUTES.BOOTCAMP_DETAIL(bootcampId)} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
          Kembali ke Detail Bootcamp
        </Link>
      </div>
    )
  }

  const { bootcamp, chapters, currentSession, prevSessionId, nextSessionId } = data

  const toggleChapter = (idxStr: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(idxStr)) next.delete(idxStr)
      else next.add(idxStr)
      return next
    })
  }

  const formatSchedule = (isoString?: string) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d) + ' WIB'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Top Navbar */}
      <header style={{
        height: 64,
        background: '#ffffff',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href={ROUTES.BOOTCAMP_DETAIL(bootcampId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontSize: '13.5px',
              fontWeight: 600,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-border-subtle)',
              background: '#fff'
            }}
          >
            <ChevronLeft size={16} /> Detail Bootcamp
          </Link>
          <div style={{ height: 20, width: 1, background: 'var(--color-border)' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Bootcamp
            </span>
            <h1 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>
              {bootcamp.title}
            </h1>
          </div>
        </div>

        {/* Navigation & Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {prevSessionId && (
            <Link
              href={ROUTES.LEARN_BOOTCAMP_SESSION(bootcampId, prevSessionId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                background: '#fff', border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <ChevronLeft size={14} /> Sesi Sebelumnya
            </Link>
          )}

          {nextSessionId && (
            <Link
              href={ROUTES.LEARN_BOOTCAMP_SESSION(bootcampId, nextSessionId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                background: 'var(--color-primary)', border: '1px solid var(--color-primary)',
                color: '#fff', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Sesi Berikutnya <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side: Content & Tabs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ maxWidth: 1040, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Player / Content Based on Type */}
            {currentSession.type === 'VIDEO' && currentSession.videoUrl ? (
              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: 20,
                overflow: 'hidden',
                background: '#000',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 16px 40px -12px rgba(0,0,0,0.14)',
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
            ) : currentSession.type === 'LIVE' ? (
              <div style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '36px 32px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Video size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6,
                        background: '#fee2e2', color: '#dc2626',
                        fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em'
                      }}>
                        LIVE SESSION
                      </span>
                      {currentSession.liveScheduledAt && (
                        <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} /> {formatSchedule(currentSession.liveScheduledAt)}
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '6px 0 0' }}>
                      {currentSession.title}
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                  {currentSession.description || 'Sesi ini berlangsung secara tatap muka daring melalui Google Meet / Zoom. Pastikan Anda telah bergabung beberapa menit sebelum jadwal dimulai.'}
                </p>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {currentSession.liveUrl ? (
                    <a
                      href={currentSession.liveUrl.startsWith('http') ? currentSession.liveUrl : `https://${currentSession.liveUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '12px 24px', borderRadius: 10,
                        background: 'var(--color-primary)', color: '#fff',
                        fontWeight: 700, fontSize: '14px', textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      <Video size={16} /> Masuk Ruang Sesi Live <ExternalLink size={14} />
                    </a>
                  ) : (
                    <div style={{ padding: '10px 18px', background: '#f1f5f9', borderRadius: 8, color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
                      Tautan meeting akan diaktifkan menjelang jadwal sesi dimulai.
                    </div>
                  )}

                  {!isCompleted && (
                    <button
                      onClick={() => completeMutation.mutate()}
                      disabled={completeMutation.isPending}
                      style={{
                        padding: '11px 20px', borderRadius: 10,
                        background: '#fff', border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '13.5px',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <CheckCircle2 size={16} color="var(--color-primary)" /> Tandai Telah Hadir
                    </button>
                  )}
                </div>

                {/* Video replay if available */}
                {currentSession.videoUrl && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                      Rekaman Sesi Tersedia
                    </h3>
                    <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', background: '#000' }}>
                      <CourseVideoPlayer url={currentSession.videoUrl} title={`Rekaman - ${currentSession.title}`} />
                    </div>
                  </div>
                )}
              </div>
            ) : currentSession.type === 'ASSIGNMENT' ? (
              <div style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '36px 32px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'rgba(245, 158, 11, 0.1)', color: '#d97706',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6,
                      background: '#fef3c7', color: '#b45309',
                      fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em'
                    }}>
                      TUGAS / PROYEK PRAKTIK
                    </span>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>
                      {currentSession.title}
                    </h2>
                  </div>
                </div>

                <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Instruksi Tugas:</h4>
                  <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {currentSession.assignmentDescription || currentSession.description || 'Silakan kerjakan tugas sesuai arahan mentor dan kirimkan tautan repository GitHub / Google Drive / Figma Anda di bawah ini.'}
                  </p>
                </div>

                {/* Submission Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Tautan Pengumpulan Tugas (Google Drive / GitHub / Figma):
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="url"
                      value={assignmentLink}
                      onChange={(e) => setAssignmentLink(e.target.value)}
                      placeholder="https://..."
                      style={{
                        flex: 1, padding: '12px 16px', borderRadius: 10,
                        border: '1px solid #cbd5e1', background: '#fff',
                        fontSize: '14px', outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => submitAssignmentMutation.mutate()}
                      disabled={submitAssignmentMutation.isPending || !assignmentLink.trim()}
                      style={{
                        padding: '12px 24px', borderRadius: 10, border: 'none',
                        background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '13.5px',
                        cursor: assignmentLink.trim() ? 'pointer' : 'not-allowed',
                        opacity: assignmentLink.trim() ? 1 : 0.6, display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Upload size={16} /> {submitAssignmentMutation.isPending ? 'Mengirim...' : 'Kumpulkan'}
                    </button>
                  </div>

                  {currentSession.assignment && (
                    <div style={{
                      marginTop: 8, padding: '14px 18px', borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex', alignItems: 'center', gap: 10
                    }}>
                      <CheckCircle2 size={18} color="var(--color-primary)" />
                      <div style={{ fontSize: '13px', color: '#0f172a' }}>
                        <strong>Tugas telah dikumpulkan</strong> pada {new Date(currentSession.assignment.submittedAt || Date.now()).toLocaleDateString('id-ID')}.
                        {currentSession.assignment.score !== undefined && (
                          <span style={{ marginLeft: 6, fontWeight: 700, color: 'var(--color-primary)' }}>
                            Nilai: {currentSession.assignment.score}/100
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                  width: 56, height: 56, borderRadius: 14,
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14
                }}>
                  <BookOpen size={28} color="var(--color-primary)" />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Sesi Materi & Panduan
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
                        <Clock size={12} /> {formatDuration(currentSession.videoDuration)}
                      </span>
                    )}

                    {currentSession.xpReward > 0 && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#d97706'
                      }}>
                        <Zap size={12} fill="#d97706" /> +{currentSession.xpReward} XP
                      </span>
                    )}
                  </div>

                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                    {currentSession.title}
                  </h1>
                </div>

                {/* Mark Complete Button */}
                <div>
                  {isCompleted ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      <CheckCircle2 size={16} /> Selesai
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

            {/* CardTabs */}
            <CardTabs
              items={[
                { id: 'overview', label: 'Ringkasan', icon: BookOpen },
                { id: 'notes', label: 'Catatan', icon: StickyNote },
                { id: 'qna', label: 'Tanya Jawab', icon: MessageSquare },
                { id: 'materials', label: 'Materi', icon: FileText },
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
                    <p style={{ color: '#475569', lineHeight: 1.75, fontSize: '14.5px', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {currentSession.assignmentDescription || currentSession.description || 'Sesi ini akan membahas materi bootcamp secara intensif sesuai kurikulum yang telah disusun.'}
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
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                      <input
                        value={qnaMessage} onChange={(e) => setQnaMessage(e.target.value)}
                        placeholder="Tanyakan sesuatu tentang materi ini ke mentor..."
                        style={{
                          flex: 1, padding: '12px 18px', borderRadius: 10,
                          border: '1px solid #e2e8f0', background: '#f8fafc',
                          fontSize: '14px', color: '#0f172a', outline: 'none'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && addQnaMutation.mutate()}
                      />
                      <button
                        onClick={() => addQnaMutation.mutate()} disabled={addQnaMutation.isPending || !qnaMessage.trim()}
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
                              {msg.user?.name ? msg.user.name[0] : 'U'}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{msg.user?.name || 'Peserta'}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(msg.createdAt).toLocaleString('id-ID')}</div>
                            </div>
                          </div>
                          <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
                        </div>
                      ))}
                      {qnaMessages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                          <MessageSquare size={40} opacity={0.3} style={{ margin: '0 auto 12px' }} />
                          <p style={{ fontSize: '14px', margin: 0 }}>Jadilah yang pertama bertanya di sesi ini!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'materials' && (
                  <div className="animate-fade-in">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Materi Pendukung</h3>
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
                        <p style={{ fontSize: '14px', margin: 0 }}>Tidak ada file materi tambahan untuk sesi ini.</p>
                      </div>
                    )}
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
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>Kurikulum Bootcamp</h3>
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
              return (
                <div key={chapter.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <button
                    onClick={() => toggleChapter(String(idx))}
                    style={{
                      width: '100%', padding: '14px 24px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: isOpen ? 'var(--color-bg)' : '#fff', border: 'none', cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>BAB {idx + 1}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2 }}>{chapter.title}</div>
                    </div>
                    <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s ease', color: 'var(--color-text-secondary)' }} />
                  </button>

                  {isOpen && (
                    <div style={{ padding: '8px 16px 16px' }}>
                      {chapter.sessions.map((sess) => {
                        const isActive = sess.id === sessionId
                        return (
                          <Link
                            key={sess.id}
                            href={ROUTES.LEARN_BOOTCAMP_SESSION(bootcampId, sess.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 12px', borderRadius: 10,
                              background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                              border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                              textDecoration: 'none', marginBottom: 4, transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: sess.isCompleted ? 'var(--color-primary)' : '#f1f5f9',
                              color: sess.isCompleted ? '#fff' : '#94a3b8'
                            }}>
                              {sess.isCompleted ? <CheckCircle2 size={14} /> : <PlayCircle size={14} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontSize: '13px', margin: 0,
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }}>
                                {sess.title}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                {sess.type === 'LIVE' ? (
                                  <span style={{ color: '#dc2626', fontWeight: 700 }}>Live Session</span>
                                ) : sess.type === 'ASSIGNMENT' ? (
                                  <span style={{ color: '#d97706', fontWeight: 600 }}>Tugas</span>
                                ) : sess.videoDuration ? (
                                  <span>{formatDuration(sess.videoDuration)}</span>
                                ) : (
                                  <span>Materi</span>
                                )}
                                {sess.xpReward > 0 && <span>• +{sess.xpReward} XP</span>}
                              </div>
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
    if (!isCompleted) {
      onComplete()
    }
  }

  if (totalQ === 0) {
    return (
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '40px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', border: '1px solid #e2e8f0'
      }}>
        <HelpCircle size={28} color="var(--color-primary)" style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Kuis: {title}</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Belum ada pertanyaan yang disediakan untuk kuis ini.</p>
      </div>
    )
  }

  if (showResult) {
    const isPassed = score >= 70
    return (
      <div style={{
        background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0',
        padding: '44px 32px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center'
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: `conic-gradient(var(--color-primary) ${score * 3.6}deg, #e2e8f0 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18
        }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>{score}%</span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>SKOR</span>
          </div>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
          {isPassed ? 'Kuis Selesai! 🎉' : 'Kuis Telah Selesai'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: 440, lineHeight: 1.6, margin: '0 auto 24px' }}>
          {isPassed ? 'Selamat! Pemahaman Anda sangat baik. Sesi ini telah ditandai selesai.' : 'Jawaban Anda telah tersimpan. Anda dapat mengulang kuis untuk meningkatkan pemahaman.'}
        </p>

        <button
          onClick={() => {
            setShowResult(false)
            setCurrentQIdx(0)
            setAnswers({})
            setIsStarted(false)
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
            borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc',
            cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: '#475569'
          }}
        >
          <RotateCcw size={14} /> Coba Lagi Kuis
        </button>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div style={{
        background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0',
        padding: '40px 24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center'
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--color-primary)' }}>
          <HelpCircle size={24} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Siap untuk Mulai Kuis?</h2>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: 440, lineHeight: 1.6, margin: '0 auto 16px' }}>
          Kuis ini terdiri dari <strong style={{ color: '#0f172a' }}>{totalQ} pertanyaan</strong>. Pastikan Anda sudah memahami materi sesi ini.
        </p>

        <button
          onClick={() => setIsStarted(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px',
            background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: '14px', cursor: 'pointer'
          }}
        >
          <PlayCircle size={16} /> {isCompleted ? 'Kerjakan Ulang Kuis' : 'Mulai Kuis'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700 }}>
              Pertanyaan {currentQIdx + 1}
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>dari {totalQ}</span>
          </div>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>Terjawab: {answeredCount}/{totalQ}</span>
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', lineHeight: 1.5, marginBottom: 20 }}>
          {currentQ.question}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {currentQ.options.map((opt) => {
            const isSelected = answers[currentQ.id] === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.id }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderRadius: 12, border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid #e2e8f0',
                  background: isSelected ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? 'var(--color-primary)' : '#fff',
                  border: isSelected ? 'none' : '1px solid #cbd5e1',
                  color: isSelected ? '#fff' : '#64748b', fontSize: '13px', fontWeight: 700
                }}>
                  {opt.id}
                </div>
                <span style={{ flex: 1, fontSize: '14px', color: isSelected ? '#0f172a' : '#334155', fontWeight: isSelected ? 600 : 400 }}>
                  {opt.text}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setCurrentQIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentQIdx === 0}
            style={{
              padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff',
              fontSize: '13px', fontWeight: 600, color: '#475569', cursor: currentQIdx === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQIdx === 0 ? 0.4 : 1
            }}
          >
            ← Sebelumnya
          </button>

          {currentQIdx < totalQ - 1 ? (
            <button
              onClick={() => setCurrentQIdx((prev) => prev + 1)}
              style={{
                padding: '9px 20px', borderRadius: 8, background: 'var(--color-primary)', border: 'none',
                color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Berikutnya →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={answeredCount < totalQ}
              style={{
                padding: '9px 24px', borderRadius: 8, background: 'var(--color-primary)', border: 'none',
                color: '#fff', fontSize: '13px', fontWeight: 700,
                cursor: answeredCount < totalQ ? 'not-allowed' : 'pointer',
                opacity: answeredCount < totalQ ? 0.5 : 1
              }}
            >
              Kirim Jawaban
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
