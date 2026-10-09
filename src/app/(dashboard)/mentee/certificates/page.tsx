'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { Award, ExternalLink, Download } from 'lucide-react'
import api from '@/lib/axios'
import { FIELD_LABELS, formatDate } from '@/lib/utils'
import CleanCombobox from '@/components/admin/CleanCombobox'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

interface Certificate {
  id: string
  credentialId: string
  productType: 'MINI_COURSE' | 'BOOTCAMP'
  issuedAt: string
  course?: { title: string; field: string; thumbnailUrl?: string }
  bootcamp?: { title: string; field: string; thumbnailUrl?: string }
}

const FIELD_ICONS: Record<string, string> = {
  UI_UX: '🎨', FRONTEND: '💻', BACKEND: '⚙️', MOBILE: '📱',
}

const TYPE_OPTIONS = [
  { value: '', label: 'Semua Tipe' },
  { value: 'BOOTCAMP', label: 'Bootcamp' },
  { value: 'MINI_COURSE', label: 'Mini Course' },
]

export default function CertificatesPage() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')

  const [activeSearch, setActiveSearch] = useState('')
  const [activeType, setActiveType] = useState('')
  const [isFiltering, setIsFiltering] = useState(false)

  useEffect(() => {
    setIsFiltering(true)
    const t = setTimeout(() => {
      setActiveSearch(search)
      setActiveType(type)
      setIsFiltering(false)
    }, 300)
    return () => clearTimeout(t)
  }, [search, type])

  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ['certificates'],
    queryFn: () => api.get('/certificates').then((r) => r.data.data),
  })

  const filtered = certificates.filter(cert => {
    const product = cert.course || cert.bootcamp
    const title = product?.title || 'Metro Institute'
    const matchSearch = !activeSearch || title.toLowerCase().includes(activeSearch.toLowerCase()) || cert.credentialId.toLowerCase().includes(activeSearch.toLowerCase())
    const matchType = !activeType || cert.productType === activeType
    return matchSearch && matchType
  })

  const getEmptyMessage = () => {
    if (!activeSearch && !activeType) {
      return 'Selesaikan bootcamp atau mini course untuk mendapatkan sertifikat.'
    }
    const parts: string[] = []
    if (activeSearch) parts.push(`kata kunci "${activeSearch}"`)
    if (activeType) parts.push(`tipe "${activeType === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'}"`)
    return `Tidak ada sertifikat yang cocok dengan kriteria: ${parts.join(', ')}.`
  }

  const showSkeleton = isLoading
  const showEmpty = !isLoading && filtered.length === 0
  const showGrid = !isLoading && filtered.length > 0
  const isTransitioning = isFiltering

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Sertifikat Saya
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Semua sertifikat yang telah kamu peroleh dari Metro Institute.
        </p>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Cari sertifikat atau ID..."
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
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
          placeholder="Semua Tipe"
          width={180}
        />
      </div>

      <div style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait">
          {showSkeleton ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
                ))}
              </div>
            </motion.div>
          ) : showEmpty ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AdminEmptyState
                type={activeSearch || activeType ? 'no-results' : 'empty'}
                message={getEmptyMessage()}
                action={
                  (activeSearch || activeType) ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                      onClick={() => { setSearch(''); setType('') }}
                    >
                      Reset Filter
                    </motion.button>
                  ) : (
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      <Link href="/bootcamp" style={{ textDecoration: 'none' }}>
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
                      <Link href="/mini-course" style={{ textDecoration: 'none' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)', opacity: isTransitioning ? 0.5 : 1, transition: 'opacity 0.25s ease' }} className="stagger-children">
                {filtered.map((cert) => {
                  const product = cert.course || cert.bootcamp
            const field = product?.field || 'FRONTEND'
            const title = product?.title || 'Metro Institute'
            const typeLabel = cert.productType === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'

            return (
              <div key={cert.id} className="card animate-fade-in-up" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Certificate design header */}
                <div style={{
                  height: 120, position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #01a96b 50%, var(--color-accent) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
                  }} />
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 36 }}>{FIELD_ICONS[field]}</div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: 600, marginTop: 4 }}>
                      SERTIFIKAT {typeLabel.toUpperCase()}
                    </div>
                  </div>
                  {/* Metro watermark */}
                  <div style={{
                    position: 'absolute', bottom: 8, right: 12,
                    fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                  }}>METRO INSTITUTE</div>
                </div>

                {/* Body */}
                <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 600 }}>{typeLabel}</div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, lineHeight: 1.4, flex: 1 }} className="line-clamp-2">{title}</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    Diterbitkan: {formatDate(cert.issuedAt)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                    ID: {cert.credentialId}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-2)' }}>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`/verify/${cert.credentialId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)',
                      padding: '8px', background: '#fff', color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                      fontWeight: 600, fontSize: '12px', textDecoration: 'none'
                    }}
                  >
                    <ExternalLink size={13} /> Verifikasi
                  </motion.a>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.print()}
                    style={{ 
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)',
                      padding: '8px', background: 'var(--color-primary)', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-md)',
                      fontWeight: 600, fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    <Download size={13} /> Unduh
                  </motion.button>
                </div>
              </div>
            )
          })}
        </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
