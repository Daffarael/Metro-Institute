'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { BookOpen, Play, CheckCircle2, Lock } from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

interface EnrolledCourse {
  id: string; title: string; type: 'bootcamp' | 'mini-course'
  progress: number; thumbnailUrl?: string; thumbnail?: string; field: string
  accessUntil?: string; level?: string; startDate?: string
}

const FIELD_OPTIONS = [
  { value: '', label: 'Semua Bidang' },
  { value: 'UI_UX',    label: FIELD_LABELS['UI_UX'] },
  { value: 'FRONTEND', label: FIELD_LABELS['FRONTEND'] },
  { value: 'BACKEND',  label: FIELD_LABELS['BACKEND'] },
  { value: 'MOBILE',   label: FIELD_LABELS['MOBILE'] },
]

const TYPE_OPTIONS = [
  { value: '', label: 'Semua Tipe' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'mini-course', label: 'Mini Course' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'in-progress', label: 'Sedang Belajar' },
  { value: 'completed', label: 'Selesai' },
]

export default function MyCoursesPage() {
  const [search, setSearch] = useState('')
  const [field, setField] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')

  // Debounce search input
  const [querySearch, setQuerySearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQuerySearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Mimic network delay for smooth filter transitions
  const [activeFilters, setActiveFilters] = useState({ field: '', type: '', status: '' })
  const [isFiltering, setIsFiltering] = useState(false)

  useEffect(() => {
    setIsFiltering(true)
    const t = setTimeout(() => {
      setActiveFilters({ field, type, status })
      setIsFiltering(false)
    }, 300)
    return () => clearTimeout(t)
  }, [querySearch, field, type, status])

  const { data: courses = [], isLoading, isFetching } = useQuery<EnrolledCourse[]>({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const [bootcamps, miniCourses] = await Promise.all([
        api.get('/bootcamps/enrolled').then((r) => r.data.data).catch(() => []),
        api.get('/courses/enrolled').then((r) => r.data.data).catch(() => []),
      ])
      return [
        ...bootcamps.map((b: EnrolledCourse)   => ({ ...b, type: 'bootcamp'    as const })),
        ...miniCourses.map((c: EnrolledCourse) => ({ ...c, type: 'mini-course' as const })),
      ]
    },
  })

  const filtered = courses.filter((c) => {
    const matchSearch = !querySearch || c.title.toLowerCase().includes(querySearch.toLowerCase())
    const matchField  = !activeFilters.field  || c.field === activeFilters.field
    const matchType   = !activeFilters.type   || c.type  === activeFilters.type
    const matchStatus =
      activeFilters.status === 'in-progress' ? c.progress > 0 && c.progress < 100 :
      activeFilters.status === 'completed'   ? c.progress >= 100 : true
    return matchSearch && matchField && matchType && matchStatus
  })

  const getEmptyMessage = () => {
    if (!querySearch && !activeFilters.field && !activeFilters.type && !activeFilters.status) {
      return 'Belum ada kursus yang kamu ikuti. Mulai perjalanan belajarmu sekarang!'
    }
    const parts: string[] = []
    if (querySearch) parts.push(`kata kunci "${querySearch}"`)
    if (activeFilters.field)  parts.push(`bidang "${FIELD_LABELS[activeFilters.field as keyof typeof FIELD_LABELS]}"`)
    if (activeFilters.type)   parts.push(`tipe "${activeFilters.type === 'bootcamp' ? 'Bootcamp' : 'Mini Course'}"`)
    if (activeFilters.status) parts.push(`status "${STATUS_OPTIONS.find(o => o.value === activeFilters.status)?.label}"`)
    return `Tidak ada kursus yang cocok dengan kriteria: ${parts.join(', ')}.`
  }

  const showSkeleton = isLoading && courses.length === 0
  const showEmpty = filtered.length === 0 && !showSkeleton
  const showGrid = filtered.length > 0 && !showSkeleton
  const isTransitioning = isFetching || isFiltering

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Kursus Saya
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
          Semua bootcamp dan mini course yang sedang kamu ikuti.
        </p>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Cari kursus saya..."
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
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
          placeholder="Semua Tipe"
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
      <div style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait">
          {showSkeleton ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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
            </motion.div>
          ) : showEmpty ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AdminEmptyState
                type={querySearch || activeFilters.field || activeFilters.type || activeFilters.status ? 'no-results' : 'empty'}
                message={getEmptyMessage()}
                action={
                  (querySearch || activeFilters.field || activeFilters.type || activeFilters.status) ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                      onClick={() => { setSearch(''); setField(''); setType(''); setStatus('') }}
                    >
                      Reset Filter
                    </motion.button>
                  ) : (
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      <Link href={ROUTES.BOOTCAMP_LIST} style={{ textDecoration: 'none' }}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '10px 20px',
                            background: 'var(--color-primary)', color: '#fff',
                            borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px',
                          }}
                        >
                          Cari Bootcamp
                        </motion.div>
                      </Link>
                      <Link href={ROUTES.COURSE_LIST} style={{ textDecoration: 'none' }}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '10px 20px',
                            background: '#fff', color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px',
                          }}
                        >
                          Cari Mini Course
                        </motion.div>
                      </Link>
                    </div>
                  )
                }
              />
            </motion.div>
          ) : showGrid ? (
            <motion.div key="grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)', opacity: isTransitioning ? 0.5 : 1, transition: 'opacity 0.25s ease' }}>
                {filtered.map((course) => (
                  <CourseCard key={`${course.type}-${course.id}`} course={course} />
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

function CourseCard({ course }: { course: EnrolledCourse }) {
  const href = course.type === 'bootcamp'
    ? ROUTES.BOOTCAMP_DETAIL(course.id)
    : ROUTES.COURSE_DETAIL(course.id)
  const learnHref = course.type === 'bootcamp'
    ? ROUTES.LEARN_BOOTCAMP(course.id)
    : ROUTES.LEARN_COURSE(course.id)

  return (
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
      {/* Type badge — top-left corner */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        padding: '4px 10px',
        background: course.type === 'bootcamp' ? 'var(--color-primary)' : '#3B82F6',
        borderRadius: '11px 0 8px 0',
        fontSize: '10px',
        fontWeight: 600,
        color: '#fff',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        zIndex: 2,
        lineHeight: 1.4,
      }}>
        {course.type === 'bootcamp' ? 'BOOTCAMP' : 'MINI COURSE'}
      </div>

      {/* Thumbnail */}
      <div style={{
        aspectRatio: '16/9', background: 'var(--color-bg)',
        borderRadius: '12px 12px 0 0',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
        position: 'relative',
      }}>
        {course.thumbnailUrl || course.thumbnail ? (
          <img
            src={course.thumbnailUrl || course.thumbnail}
            alt={course.title}
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
            {FIELD_LABELS[course.field as keyof typeof FIELD_LABELS] || course.field}
          </span>
          {course.level && (
            <>
              <span style={{ fontSize: '14px', color: 'var(--color-border)', lineHeight: 0 }}>•</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                {LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS] || course.level}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '15px',
          fontWeight: 700,
          lineHeight: 1.4,
          color: 'var(--color-text-primary)',
          margin: '0 0 16px 0',
          letterSpacing: '-0.01em',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {course.title}
        </h3>

        {/* Progress */}
        <div style={{ marginTop: 'auto', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '12px' }}>
            <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Progress</span>
            <span style={{ color: course.progress >= 100 ? 'var(--color-primary)' : 'var(--color-text-primary)', fontWeight: 600 }}>
              {course.progress >= 100 ? 'Selesai' : `${course.progress}%`}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--color-border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: course.progress >= 100 ? 'var(--color-primary)' : '#3B82F6', 
              width: `${course.progress}%`,
              borderRadius: 3 
            }} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Link href={href} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px 12px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap'
          }}>
            Detail
          </Link>
          {course.type === 'bootcamp' && course.startDate && new Date(course.startDate) > new Date() ? (
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-tertiary)', fontSize: '13px', fontWeight: 600,
              cursor: 'not-allowed', whiteSpace: 'nowrap'
            }}>
              <Lock size={14} /> Belum Mulai
            </div>
          ) : (
            <Link href={learnHref} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)', border: '1px solid var(--color-primary)',
              color: '#fff', fontSize: '13px', fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap'
            }}>
              <Play size={14} fill="currentColor" /> {course.progress > 0 ? 'Lanjut' : 'Mulai'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
