'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { Loader2, CheckCircle, ShieldCheck, Calendar, User, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useParams } from 'next/navigation'

export default function VerifyCertificatePage() {
  const params = useParams()
  const credentialId = params.credentialId as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['verify-cert', credentialId],
    queryFn: async () => {
      try {
        const res = await api.get(`/certificates/verify/${credentialId}`)
        return res.data.data
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Sertifikat tidak ditemukan')
      }
    },
    retry: false,
  })

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 24, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <ShieldCheck size={40} color="var(--color-primary)" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>Verifikasi Gagal</h1>
        <p style={{ color: '#047857', maxWidth: 400 }}>Sertifikat dengan ID <strong>{credentialId}</strong> tidak ditemukan atau tidak valid di database kami.</p>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'var(--font-sans)' }}>
      <div style={{ width: '100%', maxWidth: 600, background: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 10px 40px rgba(16, 185, 129, 0.05)' }}>
        {/* Header */}
        <div style={{ background: '#fff', padding: '40px 24px', textAlign: 'center', position: 'relative', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <ShieldCheck size={56} color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 8, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>Sertifikat Valid</h1>
          <p style={{ color: '#047857', fontSize: '15px' }}>Sertifikat ini resmi diterbitkan oleh Metro Institute.</p>
        </div>

        {/* Content */}
        <div style={{ padding: '40px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>ID Kredensial</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace', background: 'rgba(16, 185, 129, 0.05)', padding: '12px 24px', borderRadius: 12, display: 'inline-block', border: '1px solid rgba(16, 185, 129, 0.1)' }}>{data.credentialId}</div>
            </div>

            <div style={{ height: 1, background: 'rgba(16, 185, 129, 0.15)' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                <User size={24} strokeWidth={2.5} />
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Diberikan Kepada</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>{data.user?.name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                <BookOpen size={24} strokeWidth={2.5} />
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Program ({typeLabel})</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>{title}</div>
                <div style={{ fontSize: '14px', color: '#047857', marginTop: 4, fontWeight: 500 }}>Bidang: {field}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                <Calendar size={24} strokeWidth={2.5} />
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Tanggal Penerbitan</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {format(new Date(data.issuedAt), 'd MMMM yyyy', { locale: id })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: 'rgba(16, 185, 129, 0.03)', padding: '24px', borderTop: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-primary)', fontWeight: 700, fontSize: '15px' }}>
            <CheckCircle size={20} strokeWidth={2.5} /> Verifikasi Berhasil
          </div>
          <p style={{ fontSize: '13px', color: '#047857', marginTop: 8, fontWeight: 500 }}>Halaman ini adalah bukti verifikasi sah dari sistem Metro Institute.</p>
        </div>
      </div>
    </div>
  )
}
