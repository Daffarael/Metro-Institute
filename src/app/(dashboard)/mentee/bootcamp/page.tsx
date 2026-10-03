'use client'

import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Star, Users, Clock, BookOpen, ArrowRight, Calendar } from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, FIELD_LABELS, LEVEL_LABELS, formatRupiah, formatDuration } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

interface Bootcamp {
  id: string; title: string; shortDescription: string
  field: string; level: string; price: number
  thumbnailUrl?: string; totalDuration: number
  rating: number; reviewCount: number; enrollmentCount: number
  batchStatus: 'OPEN' | 'ONGOING' | 'CLOSED' | 'COMING_SOON'
  registrationDeadline?: string; batchStartDate?: string
  mentorName?: string; mentorPhotoUrl?: string; tags: string[]
}

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'OPEN', label: 'Pendaftaran Dibuka' },
  { value: 'ONGOING', label: 'Sedang Berjalan' },
  { value: 'CLOSED', label: 'Pendaftaran Ditutup' },
  { value: 'COMING_SOON', label: 'Segera Hadir' },
]

const FIELD_OPTIONS = [
  { value: '', label: 'Semua Bidang' },
  { value: 'UI_UX',    label: FIELD_LABELS['UI_UX'] },
  { value: 'FRONTEND', label: FIELD_LABELS['FRONTEND'] },
  { value: 'BACKEND',  label: FIELD_LABELS['BACKEND'] },
  { value: 'MOBILE',   label: FIELD_LABELS['MOBILE'] },
]

export default function BootcampListPage() {
  const [search, setSearch] = useState('')
  const [querySearch, setQuerySearch] = useState('')
  const [field, setField] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setQuerySearch(search || '')
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const { data: bootcamps = [], isLoading, isFetching } = useQuery<Bootcamp[]>({
    queryKey: ['bootcamps', { search: querySearch, field, status }],
    queryFn: () => api.get('/bootcamps', { params: { search: querySearch || undefined, field: field || undefined, status: status || undefined } }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const getEmptyMessage = () => {
    if (!querySearch && !field && !status) {
      return 'Belum ada Bootcamp yang tersedia saat ini. Coba kembali lagi nanti.'
    }
    const parts: string[] = []
    if (querySearch) parts.push(`kata kunci "${querySearch}"`)
    if (field)       parts.push(`bidang "${FIELD_LABELS[field]}"`)
    if (status)      parts.push(`status "${STATUS_OPTIONS.find(o => o.value === status)?.label}"`)
    return `Tidak ada bootcamp yang cocok dengan kriteria: ${parts.join(', ')}.`
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Bootcamp
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
          Program intensif bimbingan mentor untuk akselerasi kariermu.
        </p>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Cari bootcamp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            border: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            minWidth: 220,
            flex: 1,
            maxWidth: 320,
            boxSizing: 'border-box',
          }}
        />

        <CleanCombobox
          options={FIELD_OPTIONS}
          value={field}
          onChange={setField}
          placeholder="Semua Bidang"
          width={180}
        />

        <CleanCombobox
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          placeholder="Semua Status"
          width={180}
        />
      </div>


      {/* ── Grid ───────────────────────────────────────────── */}
      {isLoading && bootcamps.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 150, borderRadius: 0 }} />
              <div style={{ padding: 'var(--space-4)' }}>
                <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 8, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 6, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: '75%', marginBottom: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : bootcamps.length === 0 ? (
        <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
          <AdminEmptyState
            type={querySearch || field || status ? 'no-results' : 'empty'}
            message={getEmptyMessage()}
            action={
              (querySearch || field || status) ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                  onClick={() => { setSearch(''); setField(''); setStatus('') }}
                >
                  Reset Filter
                </motion.button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)', opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.25s ease' }}>
          {bootcamps.map((bootcamp) => (
            <BootcampCard key={bootcamp.id} bootcamp={bootcamp} />
          ))}
        </div>
      )}
    </div>
  )
}

function BootcampCard({ bootcamp }: { bootcamp: Bootcamp }) {

  return (
    <Link href={ROUTES.BOOTCAMP_DETAIL(bootcamp.id)} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--color-surface)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Status badge — top-left corner */}
        {bootcamp.batchStatus !== 'CLOSED' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            padding: '4px 10px',
            background: bootcamp.batchStatus === 'OPEN'
              ? 'var(--color-primary)'
              : 'rgba(0,0,0,0.45)',
            borderRadius: '11px 0 8px 0',
            fontSize: '11px',
            fontFamily: 'var(--font-reggae-one)',
            color: '#fff',
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            zIndex: 2,
            lineHeight: 1.4,
          }}>
            {bootcamp.batchStatus === 'OPEN' ? 'Pendaftaran Dibuka'
              : bootcamp.batchStatus === 'ONGOING' ? 'Sedang Berjalan'
              : 'Segera Hadir'}
          </div>
        )}

        {/* Thumbnail */}
        <div style={{
          height: 150, background: 'var(--color-bg)',
          borderRadius: '12px 12px 0 0',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {bootcamp.thumbnailUrl ? (
            <img
              src={bootcamp.thumbnailUrl}
              alt={bootcamp.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <BookOpen size={32} color="var(--color-border)" strokeWidth={1.5} />
          )}
        </div>

        {/* Content Area */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Meta: Field · Level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {FIELD_LABELS[bootcamp.field]}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--color-border)', lineHeight: 0 }}>•</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
              {LEVEL_LABELS[bootcamp.level]}
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: '15px',
            fontWeight: 700,
            lineHeight: 1.4,
            color: 'var(--color-text-primary)',
            margin: '0 0 8px 0',
            letterSpacing: '-0.01em',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {bootcamp.title}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
            lineHeight: 1.5,
            margin: '0 0 16px 0',
            flex: 1,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {bootcamp.shortDescription}
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={13} color="var(--color-text-tertiary)" />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {bootcamp.enrollmentCount} Peserta
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color="var(--color-text-tertiary)" />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {formatDuration(bootcamp.totalDuration)}
              </span>
            </div>
          </div>

          {/* Footer (Price & Action) */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid var(--color-border-subtle)',
          }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {bootcamp.price === 0 ? 'Gratis' : formatRupiah(bootcamp.price)}
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '12px', fontWeight: 600,
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              padding: '6px 12px',
              borderRadius: 20,
            }}>
              Lihat Detail <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>

        </div>
      </div>
    </Link>
  )
}
