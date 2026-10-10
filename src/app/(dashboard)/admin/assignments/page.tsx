'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useState } from 'react'
import { toast } from 'sonner'
import { FileText, ExternalLink, CheckCircle } from 'lucide-react'

export default function AdminAssignmentDesk() {
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [score, setScore] = useState<number | ''>('')
  const [feedback, setFeedback] = useState('')

  const { data: assignments, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'assignments'],
    queryFn: () => api.get('/admin/assignments').then(r => r.data.data),
  })

  const gradeMutation = useMutation({
    mutationFn: () => api.post(`/admin/assignments/${selectedAssignment.id}/grade`, { score: Number(score), feedback }),
    onSuccess: () => {
      toast.success('Nilai berhasil disimpan!')
      setSelectedAssignment(null)
      refetch()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan nilai')
    }
  })

  if (isLoading) return <div style={{ padding: 40 }}>Memuat data tugas...</div>

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 20 }}>Meja Penilaian (Assignment Desk)</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 30 }}>Berikan nilai dan ulasan untuk tugas yang dikumpulkan oleh Mentee.</p>

      <div className={selectedAssignment ? "grid-cols-2" : ""} style={{ display: 'grid', gridTemplateColumns: selectedAssignment ? '' : '1fr', gap: 24, alignItems: 'start' }}>
        
        {/* LIST TABLE */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflowX: 'auto', overflowY: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead style={{ background: 'var(--color-bg)', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Mentee</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Sesi Tugas</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Tanggal Dikumpulkan</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Status</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {assignments?.map((a: any) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: selectedAssignment?.id === a.id ? 'var(--color-bg)' : 'transparent' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{a.user?.name}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{a.user?.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{a.bootcampSession?.title || 'Unknown Session'}</td>
                  <td style={{ padding: '12px 16px' }}>{new Date(a.submittedAt).toLocaleDateString('id-ID')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {a.gradedAt ? (
                      <span style={{ padding: '4px 8px', background: '#D1FAE5', color: '#065F46', borderRadius: 4, fontSize: 'var(--text-xs)', fontWeight: 600 }}>Dinilai ({a.score})</span>
                    ) : (
                      <span style={{ padding: '4px 8px', background: '#FEF3C7', color: '#92400E', borderRadius: 4, fontSize: 'var(--text-xs)', fontWeight: 600 }}>Menunggu</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                      onClick={() => {
                        setSelectedAssignment(a)
                        setScore(a.score ?? '')
                        setFeedback(a.feedback ?? '')
                      }}
                      style={{ padding: '6px 12px', background: 'var(--color-primary)', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                    >
                      Buka
                    </button>
                  </td>
                </tr>
              ))}
              {assignments?.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center' }}>Belum ada tugas yang dikumpulkan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* GRADING PANEL */}
        {selectedAssignment && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 24, position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Penilaian Tugas</h2>
              <button onClick={() => setSelectedAssignment(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Tutup</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Mentee</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{selectedAssignment.user?.name}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Lampiran Tugas</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {selectedAssignment.linkUrl && (
                  <a href={selectedAssignment.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 6, textDecoration: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                    <ExternalLink size={14} /> Buka Tautan Link
                  </a>
                )}
                {selectedAssignment.fileUrl && (
                  <a href={selectedAssignment.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 6, textDecoration: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                    <FileText size={14} /> Buka File PDF/ZIP
                  </a>
                )}
                {(!selectedAssignment.linkUrl && !selectedAssignment.fileUrl) && (
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>Tidak ada lampiran.</span>
                )}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: '20px 0' }} />

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>Skor (0-100) <span style={{ color: 'red' }}>*</span></label>
              <input 
                type="number" 
                min="0" max="100" 
                value={score} 
                onChange={e => setScore(e.target.value ? Number(e.target.value) : '')} 
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', outline: 'none' }} 
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>Feedback / Ulasan</label>
              <textarea 
                rows={4}
                value={feedback} 
                onChange={e => setFeedback(e.target.value)} 
                placeholder="Berikan ulasan membangun untuk mentee..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', outline: 'none', resize: 'vertical' }} 
              />
            </div>

            <button 
              disabled={score === '' || gradeMutation.isPending}
              onClick={() => gradeMutation.mutate()}
              style={{ width: '100%', padding: 14, background: 'var(--color-primary)', color: 'white', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, opacity: score === '' ? 0.5 : 1 }}
            >
              <CheckCircle size={18} /> {gradeMutation.isPending ? 'Menyimpan...' : 'Simpan Nilai & Kirim Feedback'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
