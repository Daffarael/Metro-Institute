'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Award, ExternalLink, Download } from 'lucide-react'
import api from '@/lib/axios'
import { FIELD_LABELS, formatDate } from '@/lib/utils'

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

export default function CertificatesPage() {
  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ['certificates'],
    queryFn: () => api.get('/certificates').then((r) => r.data.data),
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Sertifikat Saya
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Semua sertifikat yang telah kamu peroleh dari Metro Institute.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="empty-state">
          <Award className="empty-state-icon" />
          <p className="empty-state-title">Belum ada sertifikat</p>
          <p className="empty-state-desc">
            Selesaikan bootcamp atau mini course untuk mendapatkan sertifikat.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link href="/bootcamp" className="btn btn-primary btn-sm">Lihat Bootcamp</Link>
            <Link href="/mini-course" className="btn btn-secondary btn-sm">Mini Course</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }} className="stagger-children">
          {certificates.map((cert) => {
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
                  <a
                    href={`${process.env.NEXT_PUBLIC_APP_URL}/verify/${cert.credentialId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, gap: 'var(--space-1)', justifyContent: 'center' }}
                  >
                    <ExternalLink size={13} /> Verifikasi
                  </a>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, gap: 'var(--space-1)' }}
                    onClick={() => window.print()}
                  >
                    <Download size={13} /> Unduh
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
