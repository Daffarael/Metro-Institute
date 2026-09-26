'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Search, Filter, Star, Users, Clock, Heart, BookOpen, ChevronRight, ChevronDown } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, FIELD_LABELS, LEVEL_LABELS, FIELD_COLORS, formatRupiah, formatDuration } from '@/lib/utils'
import { toast } from 'sonner'

interface Bootcamp {
  id: string; title: string; shortDescription: string
  field: string; level: string; price: number
  thumbnailUrl?: string; totalDuration: number
  rating: number; reviewCount: number; enrollmentCount: number
  batchStatus: 'OPEN' | 'ONGOING' | 'CLOSED' | 'COMING_SOON'
  registrationDeadline?: string; batchStartDate?: string
  mentorName?: string; mentorPhotoUrl?: string; tags: string[]
}

const BATCH_STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Pendaftaran Dibuka', color: '#018556', bg: '#D1FAE5' },
  ONGOING: { label: 'Sedang Berjalan', color: '#3B82F6', bg: '#DBEAFE' },
  CLOSED: { label: 'Pendaftaran Ditutup', color: '#EF4444', bg: '#FEE2E2' },
  COMING_SOON: { label: 'Segera Hadir', color: '#8B5CF6', bg: '#EDE9FE' },
}

const LEVEL_ORDER = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED']
const ALL_FIELDS = ['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE']

export default function BootcampListPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [field, setField] = useState('')
  const [level, setLevel] = useState('')
  const [status, setStatus] = useState('')

  const { data: bootcamps = [], isLoading } = useQuery<Bootcamp[]>({
    queryKey: ['bootcamps', { search, field, level, status }],
    queryFn: () => api.get('/bootcamps', { params: { search: search || undefined, field: field || undefined, level: level || undefined, status: status || undefined } }).then((r) => r.data.data),
  })

  const { data: wishlistIds = [] } = useQuery<string[]>({
    queryKey: ['wishlist-ids'],
    queryFn: () => api.get('/wishlist').then((r) => (r.data.data as { bootcamp?: { id: string } }[]).filter((w) => w.bootcamp).map((w) => w.bootcamp!.id)),
  })

  const wishlistMutation = useMutation({
    mutationFn: ({ id, wishlisted }: { id: string; wishlisted: boolean }) =>
      wishlisted ? api.delete(`/wishlist/bootcamp/${id}`) : api.post('/wishlist', { productType: 'BOOTCAMP', bootcampId: id }),
    onSuccess: (_, { wishlisted }) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-ids'] })
      toast.success(wishlisted ? 'Dihapus dari wishlist' : 'Ditambahkan ke wishlist ❤️')
    },
  })

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Bootcamp</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Program intensif bimbingan mentor untuk akselerasi kariermu.
        </p>
      </div>

      {/* Search & Filter */}
      <div style={{
        display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div className="input-wrapper" style={{ flex: '1 1 280px', minWidth: 0 }}>
          <Search size={15} className="input-icon-left" />
          <input
            type="search"
            placeholder="Cari bootcamp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input has-icon-left"
            style={{ background: 'var(--color-surface)' }}
          />
        </div>

        {/* Field filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="form-input"
            style={{ paddingRight: 'var(--space-8)', appearance: 'none', cursor: 'pointer', minWidth: 140 }}
          >
            <option value="">Semua Bidang</option>
            {ALL_FIELDS.map((f) => (
              <option key={f} value={f}>{FIELD_LABELS[f]}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-input"
            style={{ paddingRight: 'var(--space-8)', appearance: 'none', cursor: 'pointer', minWidth: 140 }}
          >
            <option value="">Semua Status</option>
            <option value="OPEN">Open</option>
            <option value="COMING_SOON">Segera</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Result count */}
      {!isLoading && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
          Menampilkan <strong>{bootcamps.length}</strong> bootcamp
          {field && ` · ${FIELD_LABELS[field]}`}
          {status && ` · ${BATCH_STATUS_STYLES[status]?.label}`}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 320, borderRadius: 16 }} />)}
        </div>
      ) : bootcamps.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <p className="empty-state-title">Belum ada bootcamp ditemukan</p>
          <p className="empty-state-desc">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }} className="stagger-children">
          {bootcamps.map((bootcamp) => {
            const statusStyle = BATCH_STATUS_STYLES[bootcamp.batchStatus] || BATCH_STATUS_STYLES.COMING_SOON
            const isWishlisted = wishlistIds.includes(bootcamp.id)

            return (
              <div key={bootcamp.id} className="card card-hover animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Thumbnail */}
                <div style={{ position: 'relative', height: 160, background: `linear-gradient(135deg, ${FIELD_COLORS[bootcamp.field]}22, ${FIELD_COLORS[bootcamp.field]}44)`, flexShrink: 0 }}>
                  {bootcamp.thumbnailUrl ? (
                    <img src={bootcamp.thumbnailUrl} alt={bootcamp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <span style={{ fontSize: 48 }}>
                        {{ UI_UX: '🎨', FRONTEND: '💻', BACKEND: '⚙️', MOBILE: '📱' }[bootcamp.field] || '📚'}
                      </span>
                    </div>
                  )}
                  {/* Status badge */}
                  <div style={{ position: 'absolute', top: 'var(--space-3)', left: 'var(--space-3)', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: statusStyle.bg, color: statusStyle.color, fontSize: '11px', fontWeight: 700 }}>
                    {statusStyle.label}
                  </div>
                  {/* Wishlist */}
                  <button
                    onClick={(e) => { e.preventDefault(); wishlistMutation.mutate({ id: bootcamp.id, wishlisted: isWishlisted }) }}
                    style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Heart size={15} fill={isWishlisted ? '#EF4444' : 'none'} color={isWishlisted ? '#EF4444' : 'var(--color-text-secondary)'} />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <span className="badge" style={{ background: `${FIELD_COLORS[bootcamp.field]}18`, color: FIELD_COLORS[bootcamp.field], borderColor: `${FIELD_COLORS[bootcamp.field]}40` }}>
                      {FIELD_LABELS[bootcamp.field]?.split(' ')[0]}
                    </span>
                    <span className="badge badge-neutral">{LEVEL_LABELS[bootcamp.level]}</span>
                  </div>

                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, lineHeight: 1.4, flex: 1 }} className="line-clamp-2">
                    {bootcamp.title}
                  </h3>

                  {bootcamp.mentorName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      <div className="avatar" style={{ width: 20, height: 20, fontSize: 9 }}>
                        {bootcamp.mentorPhotoUrl ? <img src={bootcamp.mentorPhotoUrl} alt={bootcamp.mentorName} /> : bootcamp.mentorName[0]}
                      </div>
                      {bootcamp.mentorName}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {bootcamp.rating > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Star size={11} fill="#F59E0B" color="#F59E0B" />{bootcamp.rating.toFixed(1)}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Users size={11} />{bootcamp.enrollmentCount} peserta
                    </span>
                    {bootcamp.totalDuration > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} />{formatDuration(bootcamp.totalDuration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {formatRupiah(bootcamp.price)}
                  </span>
                  <Link href={ROUTES.BOOTCAMP_DETAIL(bootcamp.id)} className="btn btn-primary btn-sm" style={{ gap: 'var(--space-1)' }}>
                    Detail <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
