'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { FileText, Video, ExternalLink, Send, Calendar, PlayCircle, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

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
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => router.push(`/mentee/bootcamp/${params.bootcampId}`)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', fontWeight: 600 }}>
          &larr; Kembali ke Detail Bootcamp
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* === KIRI: PLAYER & MATERI === */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 10, background: 'var(--color-bg)', borderRadius: 10 }}>
              {session.type === 'VIDEO' ? <Video size={24} /> : session.type === 'LIVE' ? <Calendar size={24} color="#3B82F6" /> : <FileText size={24} />}
            </div>
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{session.title}</h1>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Tipe: {session.type}</span>
            </div>
          </div>

          {session.videoUrl && (
            <div style={{ marginBottom: 30, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <iframe 
                width="100%" 
                height="480" 
                src={session.videoUrl.replace('watch?v=', 'embed/')} 
                title="Video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          )}

          {session.type === 'LIVE' && (
            <div style={{ padding: 30, background: 'var(--color-bg)', borderRadius: 12, marginBottom: 30, textAlign: 'center', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 10 }}>Sesi Live Class</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: '14px' }}>
                {session.liveScheduledAt ? `Jadwal: ${new Date(session.liveScheduledAt).toLocaleString('id-ID')}` : 'Silakan masuk ke Live Room untuk mengikuti sesi kelas langsung.'}
              </p>
              <Link href={`/mentee/bootcamp/${params.bootcampId}/live/${params.sessionId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#3B82F6', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                Masuk Live Room <ExternalLink size={16} />
              </Link>
            </div>
          )}

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
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, background: 'var(--color-primary)', color: 'white', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 10, opacity: (!linkUrl && !fileUrl) ? 0.5 : 1 }}
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
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>{bootcamp?.title || 'Daftar Materi'}</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 4 }}>Pilih sesi untuk lanjut belajar</p>
          </div>
          
          <div style={{ maxHeight: '80vh', overflowY: 'auto', padding: 'var(--space-3)' }}>
            {bootcamp?.chapters?.map((chapter: any, chapterIdx: number) => {
              const isOpen = expandedChapter === chapter.id
              return (
                <div key={chapter.id} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => setExpandedChapter(isOpen ? null : chapter.id)}
                    style={{ width: '100%', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isOpen ? 'var(--color-bg)' : 'transparent', border: '1px solid', borderColor: isOpen ? 'var(--color-border)' : 'transparent', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 2 }}>BAB {chapterIdx + 1}</div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--color-text-primary)' }}>{chapter.title}</div>
                    </div>
                    <div style={{ flexShrink: 0, paddingLeft: 10 }}>
                      {isOpen ? <ChevronUp size={16} color="var(--color-text-tertiary)" /> : <ChevronDown size={16} color="var(--color-text-tertiary)" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '8px 4px 8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {chapter.sessions.map((s: any, idx: number) => {
                        const isActive = s.id === params.sessionId
                        return (
                          <Link
                            key={s.id}
                            href={`/mentee/bootcamp/${params.bootcampId}/session/${s.id}`}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 10,
                              padding: '10px 12px',
                              borderRadius: 8,
                              background: isActive ? '#EFF6FF' : 'transparent',
                              border: '1px solid',
                              borderColor: isActive ? '#BFDBFE' : 'transparent',
                              textDecoration: 'none',
                              color: 'inherit'
                            }}
                          >
                            <div style={{ marginTop: 2 }}>
                              {s.type === 'VIDEO' ? <PlayCircle size={14} color={isActive ? "#3B82F6" : "var(--color-text-tertiary)"} /> :
                               s.type === 'LIVE' ? <Calendar size={14} color={isActive ? "#3B82F6" : "var(--color-text-tertiary)"} /> :
                               <FileText size={14} color={isActive ? "#3B82F6" : "var(--color-text-tertiary)"} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? '#1D4ED8' : 'var(--color-text-primary)' }}>
                                {idx + 1}. {s.title}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                {s.type === 'LIVE' ? 'Live Class' : s.type === 'CHALLENGE' ? 'Tugas' : 'Materi'}
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
