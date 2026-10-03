'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Calendar, MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { FIELD_LABELS, BADGE_LABELS, formatDate, getInitials } from '@/lib/utils'
import Link from 'next/link'
import { ROUTES } from '@/lib/utils'

interface UserProfile {
  id: string; name: string; photoUrl?: string; bio?: string
  status?: string; institution?: string; totalXp: number
  badgeLevel: string; currentStreak: number; longestStreak: number
  selectedField?: string; createdAt: string
  certificates: Array<{ id: string; productType: string; credentialId: string; issuedAt: string }>
}



export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuthStore()
  const isOwn = currentUser?.id === id

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile', id],
    queryFn: () => api.get(`/users/profile/${id}`).then((r) => r.data.data),
  })

  if (isLoading) return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
      <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
    </div>
  )
  if (!profile) return <div className="empty-state"><p className="empty-state-title">Profil tidak ditemukan</p></div>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="animate-fade-in">
      {/* Profile card */}
      <div className="card card-body" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div className="avatar" style={{ width: 80, height: 80, fontSize: 28, flexShrink: 0 }}>
            {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(profile.name)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{profile.name}</h1>
              <span style={{ 
                color: 'var(--color-primary)', 
                fontSize: 'var(--text-sm)',
                fontWeight: 600 
              }}>
                {BADGE_LABELS[profile.badgeLevel]}
              </span>
            </div>

            {profile.status && <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 4 }}>{profile.status}</p>}

            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              {profile.institution && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {profile.institution}</span>}
              {profile.selectedField && <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{FIELD_LABELS[profile.selectedField]}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> Bergabung {formatDate(profile.createdAt)}</span>
            </div>

            {profile.bio && (
              <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                {profile.bio}
              </p>
            )}
          </div>

          {/* Edit button if own profile */}
          {isOwn && (
            <Link href={ROUTES.SETTINGS} passHref legacyBehavior>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ 
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 16px', background: '#fff', color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontWeight: 600, fontSize: '13px', textDecoration: 'none', cursor: 'pointer'
                }}
              >
                Edit Profil
              </motion.a>
            </Link>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {[
          { value: profile.totalXp.toLocaleString(), label: 'Total XP' },
          { value: profile.currentStreak, label: 'Streak Saat Ini' },
          { value: profile.certificates.length, label: 'Sertifikat' },
        ].map((s) => (
          <div key={s.label} className="card card-body-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Streak detail */}
      <div className="card card-body-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Streak Terpanjang</span>
        <span style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{profile.longestStreak} hari</span>
      </div>

      {/* Certificates */}
      {profile.certificates.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>
            Sertifikat ({profile.certificates.length})
          </div>
          {profile.certificates.map((cert, idx) => (
            <div key={cert.id} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-5)',
              borderBottom: idx < profile.certificates.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
            }}>
              <BookOpen size={15} color={cert.productType === 'BOOTCAMP' ? '#8B5CF6' : 'var(--color-primary)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                  {cert.productType === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                  {cert.credentialId}
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{formatDate(cert.issuedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
