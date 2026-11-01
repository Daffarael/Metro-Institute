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

// Hanging Signboard Component - Compact, Mirip desain & animasi 'Gratis' di Landing Page Ebook
function HangingSignboard({ status }: { status: string }) {
  const isOpen = status === 'OPEN'
  const isOngoing = status === 'ONGOING'
  const isComingSoon = status === 'COMING_SOON'

  const bg = isOpen ? '#063D2A' : isOngoing ? '#1E293B' : isComingSoon ? '#1E1B4B' : '#450A0A'
  const stroke = isOpen ? '#018556' : isOngoing ? '#475467' : isComingSoon ? '#6366F1' : '#DC2626'
  const subText = isOpen ? 'PENDAFTARAN' : isOngoing ? 'BATCH' : isComingSoon ? 'BATCH' : 'PENDAFTARAN'
  const mainText = isOpen ? 'DIBUKA' : isOngoing ? 'BERJALAN' : isComingSoon ? 'SEGERA' : 'DITUTUP'
  const subColor = isOpen ? '#D1FAE5' : isOngoing ? '#94A3B8' : isComingSoon ? '#C7D2FE' : '#FCA5A5'

  return (
    <motion.div
      animate={{ rotate: [-3.5, 3.5, -3.5] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      style={{ transformOrigin: '50% 6px' }}
      whileHover={{ scale: 1.05, rotate: 6, transition: { duration: 0.3 } }}
      className="origin-top select-none cursor-pointer drop-shadow-sm flex-shrink-0"
    >
      <svg
        width="92"
        height="46"
        viewBox="0 0 140 70"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Top Peg */}
        <circle cx="70" cy="6" r="4.5" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.2" />
        <circle cx="70" cy="6" r="1.8" fill="#9CA3AF" />

        {/* Strings */}
        <line x1="70" y1="6" x2="24" y2="22" stroke="#9CA3AF" strokeWidth="1.8" />
        <line x1="70" y1="6" x2="116" y2="22" stroke="#9CA3AF" strokeWidth="1.8" />

        {/* Board Outer */}
        <rect x="6" y="16" width="128" height="50" rx="6" fill={bg} stroke={stroke} strokeWidth="1.2" />

        {/* Board Inner Details (Silver border) */}
        <rect x="10" y="20" width="120" height="42" rx="4" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />

        {/* Corner Accents */}
        <path d="M 13 25 A 2.5 2.5 0 0 1 15.5 22.5" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />
        <path d="M 127 25 A 2.5 2.5 0 0 0 124.5 22.5" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />
        <path d="M 13 57 A 2.5 2.5 0 0 0 15.5 59.5" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />
        <path d="M 127 57 A 2.5 2.5 0 0 1 124.5 59.5" fill="none" stroke="#F3F4F6" strokeWidth="0.8" strokeOpacity="0.9" />

        {/* Screws/Pegs */}
        <circle cx="24" cy="23" r="2.5" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="0.8" />
        <circle cx="24" cy="23" r="1" fill="#9CA3AF" />
        <circle cx="116" cy="23" r="2.5" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="0.8" />
        <circle cx="116" cy="23" r="1" fill="#9CA3AF" />

        {/* Subtitle */}
        <text
          x="70"
          y="34"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="7.5"
          fill={subColor}
          textAnchor="middle"
          fontWeight="bold"
          letterSpacing="1.2"
        >
          {subText}
        </text>

        {/* Main Text */}
        <text
          x="70"
          y="51"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="14"
          fill="#FFFFFF"
          textAnchor="middle"
          fontWeight="bold"
          letterSpacing="1.5"
        >
          {mainText}
        </text>
      </svg>
    </motion.div>
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
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Header Row: Field & Level (Left) · Hanging Signboard (Right) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 8,
            minHeight: 46,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {FIELD_LABELS[bootcamp.field]}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-border)', lineHeight: 0, flexShrink: 0 }}>•</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-text-tertiary)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {LEVEL_LABELS[bootcamp.level]}
              </span>
            </div>

            {/* Hanging Signboard - Compact right-aligned */}
            {bootcamp.batchStatus && (
              <HangingSignboard status={bootcamp.batchStatus} />
            )}
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
