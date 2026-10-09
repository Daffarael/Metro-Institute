'use client'

import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Star, Users, Clock, BookOpen, ArrowRight } from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, formatRupiah, formatDuration, FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

interface MiniCourse {
  id: string
  title: string
  shortDescription: string
  field: string
  level: string
  price: number
  thumbnailUrl?: string
  totalDuration: number
  rating: number
  reviewCount: number
  enrollmentCount: number
  tags: string[]
}

const FIELD_OPTIONS = [
  { value: '', label: 'Semua Bidang' },
  { value: 'UI_UX',    label: FIELD_LABELS['UI_UX'] },
  { value: 'FRONTEND', label: FIELD_LABELS['FRONTEND'] },
  { value: 'BACKEND',  label: FIELD_LABELS['BACKEND'] },
  { value: 'MOBILE',   label: FIELD_LABELS['MOBILE'] },
]

const LEVEL_OPTIONS = [
  { value: '', label: 'Semua Level' },
  { value: 'BEGINNER',     label: LEVEL_LABELS['BEGINNER'] },
  { value: 'ELEMENTARY',   label: LEVEL_LABELS['ELEMENTARY'] },
  { value: 'INTERMEDIATE', label: LEVEL_LABELS['INTERMEDIATE'] },
  { value: 'ADVANCED',     label: LEVEL_LABELS['ADVANCED'] },
]

const SORT_OPTIONS = [
  { value: '',          label: 'Urutkan' },
  { value: 'newest',    label: 'Terbaru' },
  { value: 'popular',   label: 'Terpopuler' },
  { value: 'rating',    label: 'Rating Tertinggi' },
  { value: 'price_asc', label: 'Harga Terendah' },
]

export default function MiniCourseCatalogPage() {
  // Satu state 'search' untuk value input (sama seperti admin)
  const [search, setSearch] = useState('')
  // State terpisah untuk query API — diupdate debounce 400ms setelah user berhenti mengetik
  const [querySearch, setQuerySearch] = useState('')
  const [field, setField]   = useState('')
  const [level, setLevel]   = useState('')
  const [sort, setSort]     = useState('')

  // Debounce: sama persis dengan admin (400ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setQuerySearch(search || '')
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const { data: courses = [], isLoading, isFetching } = useQuery<MiniCourse[]>({
    queryKey: ['courses', { search: querySearch, field, level, sort }],
    queryFn: () =>
      api.get('/courses', { params: { search: querySearch || undefined, field: field || undefined, level: level || undefined, sort } }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const getEmptyMessage = () => {
    if (!querySearch && !field && !level) {
      return 'Belum ada Mini Course yang tersedia saat ini. Coba kembali lagi nanti.'
    }
    const parts: string[] = []
    if (querySearch) parts.push(`kata kunci "${querySearch}"`)
    if (field)       parts.push(`bidang "${FIELD_LABELS[field]}"`)
    if (level)       parts.push(`level "${LEVEL_LABELS[level]}"`)
    return `Tidak ada kursus yang cocok dengan kriteria: ${parts.join(', ')}.`
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Mini Course
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
          Kuasai skill baru dengan kursus singkat yang terstruktur dan berbasis project.
        </p>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search — same style as admin filter bar */}
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Cari kursus..."
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
          options={LEVEL_OPTIONS}
          value={level}
          onChange={setLevel}
          placeholder="Semua Level"
          width={180}
        />

        <CleanCombobox
          options={SORT_OPTIONS}
          value={sort}
          onChange={setSort}
          placeholder="Urutkan"
          width={180}
        />
      </div>


      {/* ── Grid ───────────────────────────────────────────── */}
      {/* Skeleton hanya tampil di first load, setelah itu pakai opacity transition */}
      {isLoading && courses.length === 0 ? (
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
      ) : courses.length === 0 ? (
        <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
          <AdminEmptyState
            type={querySearch || field || level ? 'no-results' : 'empty'}
            message={getEmptyMessage()}
            action={
              (querySearch || field || level) ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                  onClick={() => { setSearch(''); setField(''); setLevel('') }}
                >
                  Reset Filter
                </motion.button>
              ) : undefined
            }
          />
        </div>
      ) : (
        /* Opacity turun halus saat fetching, naik kembali saat selesai */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)', opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.25s ease' }}>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

function CourseCard({ course }: { course: MiniCourse }) {
  return (
    <Link href={ROUTES.COURSE_DETAIL(course.id)} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
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
        {/* Thumbnail Area - CLEAN, NO GRADIENTS */}
        <div style={{
          aspectRatio: '16/9',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <BookOpen size={32} color="var(--color-border)" strokeWidth={1.5} />
          )}
        </div>

        {/* Content Area */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Metadata Row (Level & Field) - Above Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}>
              {FIELD_LABELS[course.field]}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--color-border)', lineHeight: 0 }}>•</span>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-text-tertiary)',
            }}>
              {LEVEL_LABELS[course.level]}
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
            {course.title}
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
            {course.shortDescription}
          </p>

          {/* Stats Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {course.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                ({course.reviewCount})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-tertiary)' }}>
              <Clock size={13} />
              <span style={{ fontSize: '12px' }}>{formatDuration(course.totalDuration)}</span>
            </div>
          </div>

          {/* Footer (Price & Action) */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid var(--color-border-subtle)',
          }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {course.price === 0 ? 'Gratis' : formatRupiah(course.price)}
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
