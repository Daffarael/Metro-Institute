'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Calendar, Search, CheckCircle2, XCircle, Trash2, Mail, Phone, ExternalLink } from 'lucide-react'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import { toast } from 'sonner'

interface ParticipantItem {
  registrationId: string
  registeredAt: string
  attended: boolean
  user: {
    id: string
    name: string
    email: string
    phone?: string
    photoUrl?: string
  }
}

interface WebinarData {
  id: string
  title: string
  scheduledAt: string
  quota?: number
}

export default function AdminWebinarParticipantsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const webinarId = params.id
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ParticipantItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'webinars', webinarId, 'participants'],
    queryFn: () => api.get(`/admin/webinars/${webinarId}/participants`).then(r => r.data.data),
    enabled: Boolean(webinarId),
  })

  const webinar: WebinarData | undefined = data?.webinar
  const participants: ParticipantItem[] = data?.participants ?? []

  // Toggle attend mutation
  const toggleAttendMutation = useMutation({
    mutationFn: ({ regId, attended }: { regId: string; attended: boolean }) =>
      api.patch(`/admin/webinars/${webinarId}/participants/${regId}/attend`, { attended }),
    onSuccess: () => {
      toast.success('Status kehadiran berhasil diperbarui')
      qc.invalidateQueries({ queryKey: ['admin', 'webinars', webinarId, 'participants'] })
    },
    onError: () => toast.error('Gagal memperbarui status kehadiran'),
  })

  // Delete participant mutation
  const deleteMutation = useMutation({
    mutationFn: (regId: string) =>
      api.delete(`/admin/webinars/${webinarId}/participants/${regId}`),
    onSuccess: () => {
      toast.success('Peserta berhasil dihapus dari webinar')
      qc.invalidateQueries({ queryKey: ['admin', 'webinars', webinarId, 'participants'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error('Gagal menghapus peserta'),
  })

  const filteredParticipants = participants.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.user.name.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q) ||
      (p.user.phone && p.user.phone.toLowerCase().includes(q))
    )
  })

  const attendedCount = participants.filter(p => p.attended).length

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header Back & Info */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => router.push('/admin/webinars')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'var(--color-text-secondary)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 12,
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Webinar
        </button>

        <AdminPageHeader
          title={webinar ? `Peserta: ${webinar.title}` : 'Peserta Webinar'}
          description={
            webinar
              ? `Jadwal: ${formatDate(webinar.scheduledAt)} • Total Terdaftar: ${participants.length} ${
                  webinar.quota ? `(Kuota: ${webinar.quota})` : ''
                }`
              : 'Daftar peserta yang terdaftar pada webinar ini'
          }
        />
      </div>

      {/* Stats Summary Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: '16px 20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Pendaftar
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4 }}>
            {participants.length}
            {webinar?.quota && (
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginLeft: 6 }}>
                / {webinar.quota} Kuota
              </span>
            )}
          </div>
        </div>

        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: '16px 20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hadir di Sesi
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669', marginTop: 4 }}>
            {attendedCount}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginLeft: 6 }}>
              ({participants.length > 0 ? Math.round((attendedCount / participants.length) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: '16px 20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Belum Konfirmasi Hadir
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
            {participants.length - attendedCount}
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 16, flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari nama, email, no HP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10,
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              fontSize: '13px', color: 'var(--color-text-primary)', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <AdminTableSkeleton rows={6} cols={5} />
      ) : filteredParticipants.length === 0 ? (
        <AdminEmptyState
          type={search ? 'no-results' : 'empty'}
          message={search ? 'Tidak ada peserta yang cocok dengan pencarian.' : 'Belum ada mentee yang mendaftar pada webinar ini.'}
        />
      ) : (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                {['#', 'Peserta', 'Kontak', 'Waktu Daftar', 'Kehadiran', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((p, idx) => (
                <tr
                  key={p.registrationId}
                  style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 18px', color: 'var(--color-text-tertiary)', width: 50 }}>
                    {idx + 1}
                  </td>

                  {/* Name & Avatar */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '13px', overflow: 'hidden', flexShrink: 0,
                      }}>
                        {p.user.photoUrl ? (
                          <img src={p.user.photoUrl} alt={p.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          p.user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {p.user.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                          ID: {p.user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      <Mail size={12} color="#94a3b8" /> {p.user.email}
                    </div>
                    {p.user.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-tertiary)', fontSize: '11px', marginTop: 3 }}>
                        <Phone size={11} color="#94a3b8" /> {p.user.phone}
                      </div>
                    )}
                  </td>

                  {/* Registered At */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                    {formatDate(p.registeredAt)}
                  </td>

                  {/* Attended Status */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => toggleAttendMutation.mutate({ regId: p.registrationId, attended: !p.attended })}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 600,
                        border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                        background: p.attended ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                        color: p.attended ? '#059669' : '#64748b',
                      }}
                      title="Klik untuk mengubah status kehadiran"
                    >
                      {p.attended ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {p.attended ? 'Hadir' : 'Belum Hadir'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px', width: 60 }}>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      title="Keluarkan dari webinar"
                      style={{
                        width: 28, height: 28, borderRadius: 'var(--radius-md)', border: '1px solid #fee2e2',
                        background: '#fff', color: '#ef4444', cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#fef2f2'
                        e.currentTarget.style.color = '#dc2626'
                        e.currentTarget.style.borderColor = '#fca5a5'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#fff'
                        e.currentTarget.style.color = '#ef4444'
                        e.currentTarget.style.borderColor = '#fee2e2'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminConfirmModal
          isOpen={true}
          title="Hapus Peserta Webinar"
          description={`Apakah Anda yakin ingin menghapus "${deleteTarget.user.name}" (${deleteTarget.user.email}) dari webinar ini?`}
          confirmLabel="Hapus Peserta"
          isDangerous={true}
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.registrationId)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
