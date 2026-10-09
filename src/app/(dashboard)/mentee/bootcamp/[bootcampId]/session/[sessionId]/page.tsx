'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { FileText, Video, ExternalLink, Send, Calendar, PlayCircle, Lock, ChevronDown, ChevronUp, Play, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDuration } from '@/lib/utils'

export default function BootcampSessionPage() {
  const params = useParams<{ bootcampId: string; sessionId: string }>()
  const router = useRouter()
  const [fileUrl, setFileUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['mentee', 'bootcamp', params.bootcampId, 'session', params.sessionId],
    queryFn: () => api.get(`/mentee/bootcamps/${params.bootcampId}/sessions/${params.sessionId}`).then(r => r.data.data),
  })

  // Ambil detail bootcamp untuk merender silabus/sidebar
  const { data: bootcamp } = useQuery({
    queryKey: ['bootcamp', params.bootcampId],
    queryFn: () => api.get(`/bootcamps/${params.bootcampId}`).then((r) => r.data.data),
  })

  // Expand the chapter containing the active session automatically
  useEffect(() => {
    if (bootcamp?.chapters) {
      const activeChapter = bootcamp.chapters.find((c: any) => c.sessions.some((s: any) => s.id === params.sessionId))
      if (activeChapter) {
        setExpandedChapter(activeChapter.id)
      }
    }
  }, [bootcamp, params.sessionId])

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/mentee/bootcamps/${params.bootcampId}/sessions/${params.sessionId}/assignments`, { fileUrl, linkUrl }),
    onSuccess: () => {
      toast.success('Tugas berhasil dikumpulkan!')
      refetch()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengumpulkan tugas')
    }
  })

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Memuat materi...</div>
  if (!session) return <div style={{ padding: 40, textAlign: 'center' }}>Sesi tidak ditemukan.</div>

  const assignment = session.assignments?.[0]

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
      
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => router.push(`/mentee/bootcamp/${params.bootcampId}`)} className="btn btn-ghost" style={{ padding: '0 8px', height: 36, color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={16} /> Kembali ke Bootcamp
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* === KIRI: PLAYER & MATERI === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* PLAYER SECTION */}
          {session.videoUrl ? (
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', background: '#000' }}>
              <iframe 
                width="100%" 
                height="500" 
                src={session.videoUrl.replace('watch?v=', 'embed/')} 
                title="Video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{ display: 'block' }}
              />
            </div>
          ) : session.type === 'LIVE' ? (
            <div style={{ borderRadius: 'var(--radius-lg)', minHeight: 350, background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', textAlign: 'center' }}>
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 16, borderRadius: '50%', marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <Calendar size={36} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 'var(--text-xl)', marginBottom: 12, color: 'var(--color-text-primary)' }}>Sesi Live Class</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32, fontSize: '15px' }}>
                {session.liveScheduledAt ? `Jadwal: ${formatDate(session.liveScheduledAt)}` : 'Silakan masuk ke Live Room untuk mengikuti sesi kelas langsung.'}
              </p>
              <Link href={`/mentee/bootcamp/${params.bootcampId}/live/${params.sessionId}`} className="btn btn-primary" style={{ padding: '0 32px' }}>
                Masuk Live Room <ExternalLink size={16} />
              </Link>
            </div>
          ) : (
            <div style={{ borderRadius: 'var(--radius-lg)', minHeight: 300, background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', textAlign: 'center' }}>
              <FileText size={40} color="var(--color-text-tertiary)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontWeight: 600, fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>Materi Bacaan / Tugas</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>Silakan pelajari materi dan instruksi di bawah.</p>
            </div>
          )}

          {/* JUDUL SESI */}
          <div style={{ paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--color-primary-xlight)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 700, marginBottom: 12 }}>
              {session.type} SESSION
            </div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{session.title}</h1>
          </div>

          {session.materials && session.materials.length > 0 && (
            <div style={{ padding: 20, background: 'var(--color-bg)', borderRadius: 12, marginBottom: 30 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Materi Tersedia</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {session.materials.map((mat: any, idx: number) => (
                  <a key={idx} href={mat.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                    <FileText size={16} color="var(--color-primary)" /> {mat.name || `Dokumen Materi ${idx + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}

          {(session.type === 'CHALLENGE' || session.assignmentDescription) && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 10 }}>Instruksi Tugas</h3>
              <div style={{ padding: 20, background: 'var(--color-bg)', borderRadius: 12, marginBottom: 30, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {session.assignmentDescription || 'Tidak ada deskripsi'}
              </div>

              {session.assignmentDeadline && (
                <div style={{ marginBottom: 20, color: 'var(--color-error)', fontWeight: 600 }}>
                  Tenggat Waktu: {new Date(session.assignmentDeadline).toLocaleString('id-ID')}
                </div>
              )}

              <div style={{ padding: 24, border: '1px solid var(--color-border)', borderRadius: 12 }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 20 }}>Pengumpulan Tugas</h3>
                
                {assignment?.gradedAt ? (
                  <div style={{ padding: 20, background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 12, color: '#065F46' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Tugas Telah Dinilai!</h4>
                    <p style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Skor: {assignment.score}/100</p>
                    <p><strong>Feedback:</strong> {assignment.feedback}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {assignment && (
                      <div style={{ padding: 12, background: '#EFF6FF', color: '#1D4ED8', borderRadius: 8, fontSize: 14 }}>
                        Anda sudah mengumpulkan tugas ini pada {new Date(assignment.submittedAt).toLocaleString('id-ID')}. Anda masih bisa mengubah URL sebelum tugas dinilai.
                      </div>
                    )}
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Link URL (Figma, GDrive, Github, dll)</label>
                      <input 
                        value={linkUrl} 
                        onChange={e => setLinkUrl(e.target.value)} 
                        placeholder={assignment?.linkUrl || "Masukkan URL..."} 
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)', outline: 'none' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Atau File URL (PDF/ZIP)</label>
                      <input 
                        value={fileUrl} 
                        onChange={e => setFileUrl(e.target.value)} 
                        placeholder={assignment?.fileUrl || "Masukkan URL File..."} 
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)', outline: 'none' }} 
                      />
                    </div>
                    <button 
                      disabled={(!linkUrl && !fileUrl) || submitMutation.isPending}
                      onClick={() => submitMutation.mutate()}
                      className="btn btn-primary"
                      style={{ marginTop: 10, width: '100%', opacity: (!linkUrl && !fileUrl) ? 0.5 : 1 }}
                    >
                      <Send size={18} /> {submitMutation.isPending ? 'Mengirim...' : 'Kumpulkan Tugas'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* === KANAN: SILABUS / SIDEBAR === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: 'var(--space-2)' }} className="hide-scrollbar">
          {bootcamp?.chapters?.map((chapter: any, chapterIdx: number) => {
            const isOpen = expandedChapter === chapter.id
            return (
              <div key={chapter.id} className="card" style={{
                overflow: 'hidden',
                transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)',
                borderRadius: isOpen ? 16 : 12,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                border: '1px solid var(--color-border-subtle)',
                padding: 0
              }}>
                <button
                  onClick={() => setExpandedChapter(isOpen ? null : chapter.id)}
                  style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14.5px', color: 'var(--color-text-primary)' }}
                >
                  <span>{chapter.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>{chapter.sessions.length} sesi</span>
                    <div style={{ display: 'flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronUp
                        size={16}
                        color="var(--color-text-tertiary)"
                        style={{
                          transition: 'transform 500ms cubic-bezier(0.4,0,0.2,1)',
                          transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)'
                        }}
                      />
                    </div>
                  </div>
                </button>

                <div
                  style={{
                    display: 'grid',
                    transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    opacity: isOpen ? 1 : 0,
                    background: 'var(--color-surface)'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 8px 12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {chapter.sessions.map((s: any, idx: number) => {
                          const isActive = s.id === params.sessionId
                          return (
                            <Link
                              key={s.id}
                              href={`/mentee/bootcamp/${params.bootcampId}/session/${s.id}`}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 12px',
                                borderRadius: 10,
                                background: isActive ? 'var(--color-primary-xlight)' : 'transparent',
                                border: '1px solid',
                                borderColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'color-mix(in srgb, var(--color-text-primary) 3%, transparent)' }}
                              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                            >
                              <div style={{
                                display: 'flex', height: 36, width: 36, flexShrink: 0,
                                alignItems: 'center', justifyContent: 'center',
                                borderRadius: 10, background: isActive ? 'var(--color-primary-light)' : 'var(--color-bg)',
                                border: '1px solid', borderColor: isActive ? 'var(--color-primary-light)' : 'var(--color-border-subtle)'
                              }}>
                                {s.type === 'LIVE' ? <Calendar size={15} color="var(--color-primary)" /> : <Play size={15} color={isActive ? "var(--color-primary)" : "var(--color-text-tertiary)"} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13.5px', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {s.title}
                                </div>
                              </div>
                              {s.type === 'LIVE' && s.liveScheduledAt ? (
                                <span style={{ fontSize: '11px', color: 'var(--color-primary)', flexShrink: 0 }}>{formatDate(s.liveScheduledAt)}</span>
                              ) : s.videoDuration ? (
                                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDuration(s.videoDuration)}</span>
                              ) : null}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
