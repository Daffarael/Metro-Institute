'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import Link from 'next/link'
import { BookOpen, Play, CheckCircle2, ChevronDown, Search } from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, FIELD_LABELS, FIELD_COLORS } from '@/lib/utils'

interface EnrolledCourse {
  id: string; title: string; type: 'bootcamp' | 'mini-course'
  progress: number; thumbnail?: string; field: string
  accessUntil?: string
}

const FIELD_OPTS = ['UI_UX', 'FRONTEND', 'BACKEND', 'MOBILE']
const TYPE_OPTS  = [
  { value: '',           label: 'Semua Tipe' },
  { value: 'bootcamp',   label: 'Bootcamp' },
  { value: 'mini-course',label: 'Mini Course' },
]
const STATUS_OPTS = [
  { value: '',            label: 'Semua Status' },
  { value: 'in-progress', label: 'Sedang Belajar' },
  { value: 'completed',   label: 'Selesai' },
]

export default function MyCoursesPage() {
  const [field,  setField]  = useState('')
  const [type,   setType]   = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const { data: courses = [], isLoading } = useQuery<EnrolledCourse[]>({
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
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase())
    const matchField  = !field  || c.field === field
    const matchType   = !type   || c.type  === type
    const matchStatus =
      status === 'in-progress' ? c.progress > 0 && c.progress < 100 :
      status === 'completed'   ? c.progress >= 100 : true
    return matchSearch && matchField && matchType && matchStatus
  })

  const stats = {
    total:      courses.length,
    inProgress: courses.filter((c) => c.progress > 0 && c.progress < 100).length,
    completed:  courses.filter((c) => c.progress >= 100).length,
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Kursus Saya
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
          Semua bootcamp dan mini course yang sedang kamu ikuti.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {[
          { label: 'Total Kursus',   value: stats.total,      icon: <BookOpen     size={18} color="var(--color-text-primary)" /> },
          { label: 'Sedang Belajar', value: stats.inProgress, icon: <Play         size={18} color="#3B82F6" /> },
          { label: 'Selesai',        value: stats.completed,  icon: <CheckCircle2 size={18} color="var(--color-primary)" /> },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter row — sama persis dengan Challenge Bank */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Field filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="form-input"
            style={{ paddingRight: 'var(--space-8)', appearance: 'none', cursor: 'pointer', minWidth: 160 }}
          >
            <option value="">Semua Bidang</option>
            {FIELD_OPTS.map((f) => (
              <option key={f} value={f}>{FIELD_LABELS[f]}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
        </div>

        {/* Type filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="form-input"
            style={{ paddingRight: 'var(--space-8)', appearance: 'none', cursor: 'pointer', minWidth: 160 }}
          >
            {TYPE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
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
            style={{ paddingRight: 'var(--space-8)', appearance: 'none', cursor: 'pointer', minWidth: 160 }}
          >
            {STATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Cari kursus..."
            className="form-input"
            style={{ paddingLeft: 36, minWidth: 200 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Result count */}
      {!isLoading && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
          Menampilkan <strong>{filtered.length}</strong> kursus
          {field  && ` · ${FIELD_LABELS[field]}`}
          {type   && ` · ${type === 'bootcamp' ? 'Bootcamp' : 'Mini Course'}`}
          {status && ` · ${status === 'in-progress' ? 'Sedang Belajar' : 'Selesai'}`}
        </p>
      )}

      {/* Course Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 310, borderRadius: 12 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <p className="empty-state-title">{courses.length === 0 ? 'Belum ada kursus' : 'Tidak ada kursus yang sesuai filter'}</p>
          {courses.length === 0 && (
            <p className="empty-state-desc">Mulai perjalananmu dengan mendaftar bootcamp atau mini course.</p>
          )}
          {courses.length === 0 && (
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Link href="/bootcamp"    className="btn btn-primary btn-sm">Lihat Bootcamp</Link>
              <Link href="/mini-course" className="btn btn-secondary btn-sm">Mini Course</Link>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((course) => {
            const href = course.type === 'bootcamp'
              ? ROUTES.BOOTCAMP_DETAIL(course.id)
              : ROUTES.COURSE_DETAIL(course.id)
            const learnHref = course.type === 'bootcamp'
              ? ROUTES.LEARN_BOOTCAMP(course.id)
              : ROUTES.LEARN_COURSE(course.id)

            return (
              <div
                key={`${course.type}-${course.id}`}
                className="card card-hover"
                style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}
              >
                {/* Progress indicator — mirip bottom accent di Challenge Bank */}
                {course.progress >= 100 && (
                  <div style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)' }}>
                    <CheckCircle2 size={20} color="var(--color-primary)" />
                  </div>
                )}

                {/* Type & Field — mirip Type & Field di Challenge Bank */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: 24 }}>
                    {{ UI_UX: '🎨', FRONTEND: '💻', BACKEND: '⚙️', MOBILE: '📱' }[course.field] || '📚'}
                  </span>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                      {FIELD_LABELS[course.field]}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: course.type === 'bootcamp' ? '#8B5CF6' : '#3B82F6' }}>
                      {course.type === 'bootcamp' ? 'Bootcamp' : 'Mini Course'}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, lineHeight: 'var(--leading-snug)', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }} className="line-clamp-2">
                  {course.title}
                </h3>

                {/* Progress */}
                <div style={{ marginTop: 'auto', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: '11px' }}>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Progress</span>
                    <span style={{ color: course.progress >= 100 ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {course.progress >= 100 ? 'Selesai' : `${course.progress}%`}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${course.progress}%` }} />
                  </div>
                  {course.accessUntil && course.progress < 100 && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                      Akses: {new Date(course.accessUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <Link href={href} className="btn btn-secondary btn-sm" style={{ fontSize: '12px', justifyContent: 'center' }}>
                    Detail
                  </Link>
                  <Link href={learnHref} className="btn btn-primary btn-sm" style={{ gap: 'var(--space-1)', fontSize: '12px', justifyContent: 'center' }}>
                    <Play size={13} /> {course.progress > 0 ? 'Lanjut' : 'Mulai'}
                  </Link>
                </div>

                {/* Bottom accent — persis Challenge Bank */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                  background: course.progress >= 100 ? 'var(--color-primary)' : (FIELD_COLORS[course.field] || '#ccc'),
                  opacity: 0.5,
                }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
