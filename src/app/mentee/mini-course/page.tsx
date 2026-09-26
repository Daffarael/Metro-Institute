'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Search, Filter, Star, Users, Clock, BookOpen, ChevronDown } from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, formatRupiah, formatDuration, FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'

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

const FIELDS = ['', 'UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE']
const LEVELS = ['', 'BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED']

const FIELD_ICONS: Record<string, string> = {
  UI_UX: '🎨', FRONTEND: '💻', BACKEND: '⚙️', MOBILE: '📱',
}

export default function MiniCourseCatalogPage() {
  const [search, setSearch] = useState('')
  const [field, setField] = useState('')
  const [level, setLevel] = useState('')
  const [sort, setSort] = useState('newest')

  const { data: courses = [], isLoading } = useQuery<MiniCourse[]>({
    queryKey: ['courses', { search, field, level, sort }],
    queryFn: () =>
      api.get('/courses', { params: { search, field, level, sort } }).then((r) => r.data.data),
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }} className="animate-fade-in">
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Mini Course
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
          Kuasai skill baru dengan kursus singkat yang terstruktur dan berbasis project.
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
            placeholder="Cari kursus..."
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
            {FIELDS.slice(1).map((f) => (
              <option key={f} value={f}>{FIELD_LABELS[f]}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
        </div>

        {/* Level filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="form-input"
            style={{ paddingRight: 'var(--space-8)', appearance: 'none', cursor: 'pointer', minWidth: 130 }}
          >
            <option value="">Semua Level</option>
            {LEVELS.slice(1).map((l) => (
              <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
        </div>

        {/* Sort */}
        <div style={{ position: 'relative' }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="form-input"
            style={{ paddingRight: 'var(--space-8)', appearance: 'none', cursor: 'pointer', minWidth: 140 }}
          >
            <option value="newest">Terbaru</option>
            <option value="popular">Terpopuler</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="price_asc">Harga Terendah</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Result count */}
      {!isLoading && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
          Menampilkan <strong>{courses.length}</strong> kursus
          {field && ` · ${FIELD_LABELS[field]}`}
          {level && ` · ${LEVEL_LABELS[level]}`}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 160, borderRadius: 0 }} />
              <div style={{ padding: 'var(--space-5)' }}>
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 18, width: '90%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 14, width: '75%', marginBottom: 20 }} />
                <div className="skeleton" style={{ height: 36, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <p className="empty-state-title">Kursus tidak ditemukan</p>
          <p className="empty-state-desc">Coba ubah filter atau kata kunci pencarianmu.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setField(''); setLevel('') }}>
            Reset Filter
          </button>
        </div>
      ) : (
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}
          className="stagger-children"
        >
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
    <Link href={ROUTES.COURSE_DETAIL(course.id)} style={{ textDecoration: 'none' }} className="animate-fade-in-up">
      <div className="card card-hover" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Thumbnail */}
        <div style={{
          height: 160, background: 'var(--color-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 40 }}>{FIELD_ICONS[course.field] || '📚'}</span>
            </div>
          )}
          {/* Level badge */}
          <span className="badge badge-neutral" style={{
            position: 'absolute', top: 'var(--space-3)', left: 'var(--space-3)',
            background: 'rgba(255,255,255,0.95)',
          }}>
            {LEVEL_LABELS[course.level]}
          </span>
          {/* Field badge */}
          <span className="badge badge-primary" style={{
            position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)',
            background: 'rgba(255,255,255,0.95)',
          }}>
            {FIELD_ICONS[course.field]} {FIELD_LABELS[course.field].split(' ')[0]}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', flex: 1, gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, lineHeight: 'var(--leading-snug)', color: 'var(--color-text-primary)' }} className="line-clamp-2">
            {course.title}
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', flex: 1 }} className="line-clamp-2">
            {course.shortDescription}
          </p>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{course.rating.toFixed(1)}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>({course.reviewCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-tertiary)' }}>
              <Clock size={11} />
              <span style={{ fontSize: 'var(--text-xs)' }}>{formatDuration(course.totalDuration)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-tertiary)' }}>
              <Users size={11} />
              <span style={{ fontSize: 'var(--text-xs)' }}>{course.enrollmentCount}</span>
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-1)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-primary)' }}>
              {formatRupiah(course.price)}
            </span>
            <span className="btn btn-primary btn-sm">Lihat Detail</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
