'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useState } from 'react'
import { toast } from 'sonner'
import { FileText, Video, ExternalLink, Send } from 'lucide-react'

export default function BootcampSessionPage() {
  const params = useParams<{ bootcampId: string; sessionId: string }>()
  const router = useRouter()
  const [fileUrl, setFileUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['mentee', 'bootcamp', params.bootcampId, 'session', params.sessionId],
    queryFn: () => api.get(`/mentee/bootcamps/${params.bootcampId}/sessions/${params.sessionId}`).then(r => r.data.data),
  })

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
    <div style={{ padding: 'var(--space-6)', maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ marginBottom: 20, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer' }}>
        &larr; Kembali
      </button>

      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ padding: 10, background: 'var(--color-bg)', borderRadius: 10 }}>
            {session.type === 'VIDEO' ? <Video size={24} /> : <FileText size={24} />}
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{session.title}</h1>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Tipe: {session.type}</span>
          </div>
        </div>

        {session.type === 'VIDEO' && session.videoUrl && (
          <div style={{ marginBottom: 30, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            {/* Simple youtube embed or generic video player */}
            <iframe 
              width="100%" 
              height="400" 
              src={session.videoUrl.replace('watch?v=', 'embed/')} 
              title="Video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>
        )}

        {session.type === 'MATERIAL' && session.materials?.[0] && (
          <div style={{ padding: 20, background: 'var(--color-bg)', borderRadius: 12, marginBottom: 30 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 10 }}>Materi Tersedia</h3>
            <a href={session.materials[0].url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-primary)', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              Buka Dokumen <ExternalLink size={16} />
            </a>
          </div>
        )}

        {session.type === 'CHALLENGE' && (
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
    </div>
  )
}
