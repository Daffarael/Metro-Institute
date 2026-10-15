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

  const parsedMaterials = useMemo(() => {
    let raw = currentSession?.materials
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch {
        raw = []
      }
    }
    return Array.isArray(raw) ? raw : []
  }, [currentSession?.materials])

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
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
      {/* -- Top Header --------------------------------------- */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        height: 64, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <Link href={ROUTES.BOOTCAMP_DETAIL(bootcampId)} style={{
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
              Bootcamp
            </div>
            <div className="truncate" style={{ maxWidth: 360, fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              {bootcamp.title}
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
                      Selamat! Anda Telah Menyelesaikan Bootcamp Ini 🎉
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
                padding: '32px 32px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <BookOpen size={24} color="var(--color-primary)" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)',
                        fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em'
                      }}>
                        MATERI PEMBELAJARAN
                      </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>
                      {currentSession.title}
                    </h2>
                  </div>
                </div>

                {/* Deskripsi / Isi Materi Teks */}
                {(currentSession.description || currentSession.assignmentDescription) && (
                  <div style={{
                    fontSize: '14.5px',
                    color: '#334155',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    background: '#f8fafc',
                    padding: '20px 24px',
                    borderRadius: 14,
                    border: '1px solid #e2e8f0'
                  }}>
                    {currentSession.description || currentSession.assignmentDescription}
                  </div>
                )}

                {/* File Materi Pendukung & Unduhan */}
                {parsedMaterials.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color="var(--color-primary)" />
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        File Dokumen & Lampiran Materi ({parsedMaterials.length})
                      </h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {parsedMaterials.map((mat: any, idx: number) => (
                        <a
                          key={idx}
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 18px', border: '1px solid #e2e8f0',
                            borderRadius: 12, textDecoration: 'none', background: '#ffffff',
                            color: '#0f172a', transition: 'all 0.15s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.background = '#f0fdf4';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.background = '#ffffff';
                          }}
                        >
                          <div style={{
                            width: 38, height: 38, borderRadius: 8,
                            background: 'rgba(16, 185, 129, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-primary)', flexShrink: 0
                          }}>
                            <FileText size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {mat.name || `Lampiran Materi ${idx + 1}`}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                              Klik untuk membuka / unduh
                            </div>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '6px 12px', borderRadius: 8,
                            background: 'var(--color-primary)', color: '#ffffff',
                            fontSize: '12px', fontWeight: 600, flexShrink: 0
                          }}>
                            <Download size={13} /> Unduh
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* If no description and no materials */}
                {!currentSession.description && !currentSession.assignmentDescription && parsedMaterials.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    color: '#64748b',
                    fontSize: '14px'
                  }}>
                    Materi untuk sesi ini dapat Anda diskusikan langsung pada tab <strong>Tanya Jawab</strong> atau buat <strong>Catatan</strong> pribadi.
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

                {/* Right: Actions (Nav Prev/Next + Complete) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {prevSessionId && (
                    <Link
                      href={ROUTES.LEARN_BOOTCAMP_SESSION(bootcampId, prevSessionId)}
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
                      href={ROUTES.LEARN_BOOTCAMP_SESSION(bootcampId, nextSessionId)}
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

                  {(currentSession.isCompleted || isCompleted) && (
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
          width: 360,
          background: '#fff',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.02)',
          zIndex: 10
        }}>
          {/* Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border-subtle)', flexShrink: 0 }}>
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
            {chapters.map((chapter, idx) => {
              const isOpen = expandedChapters.has(String(idx))
              const completedCount = chapter.sessions.filter((s) => s.isCompleted).length
              return (
                <div key={chapter.id} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => toggleChapter(String(idx))}
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
                            href={ROUTES.LEARN_BOOTCAMP_SESSION(bootcampId, sess.id)}
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
                                : sess.type === 'LIVE'
                                ? <Video size={18} color={isActive ? 'var(--color-primary)' : '#cbd5e1'} />
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                <span style={{ textTransform: 'capitalize' }}>{sess.type.toLowerCase()}</span>
                                {sess.videoDuration && (
                                  <>
                                    <span>•</span>
                                    <span>{formatDuration(sess.videoDuration)}</span>
                                  </>
                                )}
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
