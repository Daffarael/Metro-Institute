'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { Loader2, CheckCircle, ShieldCheck, Calendar, User, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Image from 'next/image'

export default function VerifyCertificatePage({ params }: { params: { credentialId: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['verify-cert', params.credentialId],
    queryFn: async () => {
      try {
        const res = await api.get(`/certificates/verify/${params.credentialId}`)
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
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <ShieldCheck size={40} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Verifikasi Gagal</h1>
        <p style={{ color: '#64748b', maxWidth: 400 }}>Sertifikat dengan ID <strong>{params.credentialId}</strong> tidak ditemukan atau tidak valid di database kami.</p>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 600, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        {/* Header */}
        <div style={{ background: 'var(--color-primary)', padding: '32px 24px', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
            <ShieldCheck size={120} />
          </div>
          <ShieldCheck size={48} color="#fff" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 8 }}>Sertifikat Valid</h1>
          <p style={{ opacity: 0.9, fontSize: '14px' }}>Sertifikat ini resmi diterbitkan oleh Metro Institute.</p>
        </div>

        {/* Content */}
        <div style={{ padding: '32px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>ID Kredensial</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{data.credentialId}</div>
            </div>

            <div style={{ height: 1, background: '#e2e8f0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <User size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Diberikan Kepada</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{data.user?.name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Program ({typeLabel})</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{title}</div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: 2 }}>Bidang: {field}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <Calendar size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Tanggal Penerbitan</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                  {format(new Date(data.issuedAt), 'd MMMM yyyy', { locale: id })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#f8fafc', padding: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
            <CheckCircle size={18} /> Verifikasi Berhasil
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: 8 }}>Halaman ini adalah bukti verifikasi sah dari sistem Metro Institute.</p>
        </div>
      </div>
    </div>
  )
}
