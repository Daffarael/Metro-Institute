'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Mail, Phone, CalendarDays, Layers } from 'lucide-react'
import api from '@/lib/axios'
import { formatDate, FIELD_LABELS, BADGE_LABELS } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import { SlidingTabs } from '@/components/ui/SlidingTabs'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────
interface MenteeProfile {
  id: string; name: string; email: string; phone?: string
  field?: string; badgeLevel: string; totalXp: number
  isActive: boolean; createdAt: string; photoUrl?: string
  _count: { bootcampRegistrations: number; courseEnrollments: number; xpHistories: number }
}
interface XpHistory       { id: string; amount: number; reason: string; createdAt: string }
interface ActiveBootcamp  { id: string; name: string; progress: number; status: string; joinedAt: string }
interface CourseEnrollment { id: string; title: string; progress: number; purchasedAt: string }

// ── Sub-components ─────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(value, 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 80, height: 3, borderRadius: 99, background: 'var(--color-border)', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-text-secondary)', borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', minWidth: 32 }}>{value}%</span>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '11px', fontWeight: 500,
      color: 'var(--color-text-secondary)',
      background: 'var(--color-bg)', border: '1px solid var(--color-border)',
      padding: '2px 9px', borderRadius: '6px', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
      <span style={{ color: 'var(--color-text-tertiary)', display: 'flex' }}>{icon}</span>
      {children}
    </span>
  )
}

const TH: React.CSSProperties = {
  padding: '12px 24px', textAlign: 'left',
  fontSize: '12px', fontWeight: 600,
  color: 'var(--color-text-secondary)',
  borderBottom: '1px solid var(--color-border-subtle)',
  whiteSpace: 'nowrap',
}
const TD: React.CSSProperties = {
  padding: '14px 24px', verticalAlign: 'middle',
  fontSize: '13px', color: 'var(--color-text-primary)',
  borderBottom: '1px solid var(--color-border-subtle)',
}

// ── Page ───────────────────────────────────────────────────────
export default function AdminMenteeDetailPage() {
  const { menteeId } = useParams<{ menteeId: string }>()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'bootcamp' | 'course' | 'xp'>('bootcamp')

  const { data: mentee, isLoading } = useQuery<MenteeProfile>({
    queryKey: ['admin', 'mentee', menteeId],
    queryFn: () => api.get(`/admin/mentees/${menteeId}`).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  const { data: xpHistory } = useQuery<XpHistory[]>({
    queryKey: ['admin', 'mentee', menteeId, 'xp'],
    queryFn: () => api.get(`/admin/mentees/${menteeId}/xp`).then(r => r.data.data ?? []),
    enabled: activeTab === 'xp', staleTime: 2 * 60 * 1000,
  })
  const { data: bootcamps } = useQuery<ActiveBootcamp[]>({
    queryKey: ['admin', 'mentee', menteeId, 'bootcamps'],
    queryFn: () => api.get(`/admin/mentees/${menteeId}/bootcamps`).then(r => r.data.data ?? []),
    enabled: activeTab === 'bootcamp', staleTime: 2 * 60 * 1000,
  })
  const { data: courses } = useQuery<CourseEnrollment[]>({
    queryKey: ['admin', 'mentee', menteeId, 'courses'],
    queryFn: () => api.get(`/admin/mentees/${menteeId}/courses`).then(r => r.data.data ?? []),
    enabled: activeTab === 'course', staleTime: 2 * 60 * 1000,
  })

  const toggleStatus = useMutation({
    mutationFn: () => api.patch(`/admin/mentees/${menteeId}/toggle-status`),
    onSuccess: () => {
      toast.success(mentee?.isActive ? 'Akun dinonaktifkan.' : 'Akun diaktifkan.')
      qc.invalidateQueries({ queryKey: ['admin', 'mentee', menteeId] })
    },
    onError: () => toast.error('Gagal mengubah status.'),
  })

  if (isLoading) return (
    <div>
      <AdminPageHeader title="Profil Mentee" breadcrumbs={[{ label: 'Mentee', href: '/admin/mentees' }, { label: '...' }]} />
      <AdminTableSkeleton rows={5} cols={4} />
    </div>
  )
  if (!mentee) return null

  const tabs = [
    { key: 'bootcamp' as const, label: 'Bootcamp',   count: mentee._count?.bootcampRegistrations || 0 },
    { key: 'course'   as const, label: 'Mini Course', count: mentee._count?.courseEnrollments     || 0 },
    { key: 'xp'       as const, label: 'Riwayat XP',  count: mentee._count?.xpHistories           || 0 },
  ]

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title="Profil Mentee"
        breadcrumbs={[{ label: 'Mentee', href: '/admin/mentees' }, { label: mentee.name }]}
      />

      {/* ── Profile Card ─────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: 16,
      }}>
        {/* Top row: avatar + info + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          {/* Avatar */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: 'var(--color-text-tertiary)',
            overflow: 'hidden',
          }}>
            {mentee.photoUrl
              ? <img src={mentee.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : mentee.name.charAt(0).toUpperCase()}
          </div>

          {/* Name + chips + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {mentee.name}
              </span>
              <Chip>{(BADGE_LABELS as any)?.[mentee.badgeLevel] ?? mentee.badgeLevel}</Chip>
              <span style={{
                display: 'inline-block', fontSize: '11px', fontWeight: 500,
                padding: '2px 9px', borderRadius: '6px', whiteSpace: 'nowrap',
                color: mentee.isActive ? '#16a34a' : 'var(--color-text-tertiary)',
                background: mentee.isActive ? 'rgba(22,163,74,0.07)' : 'var(--color-bg)',
                border: `1px solid ${mentee.isActive ? 'rgba(22,163,74,0.2)' : 'var(--color-border)'}`,
              }}>
                {mentee.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <MetaItem icon={<Mail size={13} />}>{mentee.email}</MetaItem>
              {mentee.phone && <MetaItem icon={<Phone size={13} />}>{mentee.phone}</MetaItem>}
              {mentee.field && (
                <MetaItem icon={<Layers size={13} />}>
                  {(FIELD_LABELS as any)?.[mentee.field] ?? mentee.field}
                </MetaItem>
              )}
              <MetaItem icon={<CalendarDays size={13} />}>Bergabung {formatDate(mentee.createdAt)}</MetaItem>
            </div>
          </div>

          {/* Right: XP + toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                {mentee.totalXp.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>XP</div>
            </div>
            <button
              suppressHydrationWarning
              onClick={() => toggleStatus.mutate()}
              disabled={toggleStatus.isPending}
              style={{
                padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500,
                cursor: toggleStatus.isPending ? 'not-allowed' : 'pointer',
                border: '1px solid var(--color-border)', background: 'transparent',
                color: mentee.isActive ? '#DC2626' : 'var(--color-text-secondary)',
                opacity: toggleStatus.isPending ? 0.6 : 1, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {mentee.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs + Content (SlidingTabs) ─────────────── */}
      <SlidingTabs
        items={tabs.map(t => ({ value: t.key, label: t.label, count: t.count }))}
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        renderPanel={(val) => (
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderTop: 'none',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            overflow: 'hidden',
          }}>

            {/* Bootcamp */}
            {val === 'bootcamp' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Nama Bootcamp', 'Progress', 'Status', 'Bergabung'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(bootcamps ?? []).length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '48px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Belum mengikuti bootcamp.</td></tr>
                  ) : (bootcamps ?? []).map(b => (
                    <tr key={b.id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ ...TD, fontWeight: 500 }}>{b.name}</td>
                      <td style={TD}><ProgressBar value={b.progress} /></td>
                      <td style={TD}><Chip>{b.status}</Chip></td>
                      <td style={{ ...TD, fontSize: '12px', color: 'var(--color-text-secondary)' }}>{formatDate(b.joinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Course */}
            {val === 'course' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Judul Course', 'Progress', 'Tanggal Beli'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(courses ?? []).length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '48px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Belum membeli mini course.</td></tr>
                  ) : (courses ?? []).map(c => (
                    <tr key={c.id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ ...TD, fontWeight: 500 }}>{c.title}</td>
                      <td style={TD}><ProgressBar value={c.progress} /></td>
                      <td style={{ ...TD, fontSize: '12px', color: 'var(--color-text-secondary)' }}>{formatDate(c.purchasedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* XP History */}
            {val === 'xp' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Keterangan', 'XP', 'Tanggal'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(xpHistory ?? []).length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '48px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Belum ada riwayat XP.</td></tr>
                  ) : (xpHistory ?? []).map(x => (
                    <tr key={x.id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ ...TD, color: 'var(--color-text-secondary)' }}>{x.reason}</td>
                      <td style={{ ...TD, fontWeight: 700, color: x.amount >= 0 ? 'var(--color-text-primary)' : '#DC2626' }}>
                        {x.amount >= 0 ? '+' : ''}{x.amount} XP
                      </td>
                      <td style={{ ...TD, fontSize: '12px', color: 'var(--color-text-secondary)' }}>{formatDate(x.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      />
    </div>
  )
}
