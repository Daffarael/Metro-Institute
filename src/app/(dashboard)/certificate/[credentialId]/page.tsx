'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { Loader2, ArrowLeft, Download, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useParams, useRouter } from 'next/navigation'
import { useRef } from 'react'

export default function DownloadCertificatePage() {
  const params = useParams()
  const router = useRouter()
  const credentialId = params.credentialId as string
  const certRef = useRef<HTMLDivElement>(null)

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
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <AlertTriangle size={40} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Sertifikat Tidak Ditemukan</h1>
        <p style={{ color: '#64748b', maxWidth: 400, marginBottom: 24 }}>Sertifikat dengan ID <strong>{credentialId}</strong> tidak ditemukan atau tidak valid.</p>
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0f172a', textDecoration: 'none', fontSize: '14px', fontWeight: 600, padding: '10px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const template = data.productType === 'MINI_COURSE' ? data.course?.certificateTemplate : data.bootcamp?.certificateTemplate

  const renderContent = (item: any) => {
    if (item.type === 'image') return null;
    switch(item.id) {
      case 'MenteeName': return data.user?.name;
      case 'CourseName': return title;
      case 'Date': return format(new Date(data.issuedAt), 'd MMMM yyyy', { locale: id });
      case 'CredentialId': return data.credentialId;
      default: return item.label;
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!template?.bgImage) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <AlertTriangle size={40} color="#f59e0b" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Sertifikat Belum Tersedia</h1>
        <p style={{ color: '#64748b', maxWidth: 400, marginBottom: 24 }}>Template sertifikat belum diatur oleh admin untuk produk ini. Harap hubungi admin.</p>
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0f172a', textDecoration: 'none', fontSize: '14px', fontWeight: 600, padding: '10px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="print-wrapper">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-wrapper { background: white !important; padding: 0 !important; margin: 0 !important; display: block !important; }
          #certificate-container, #certificate-container * { visibility: visible; }
          #certificate-container { 
            position: absolute !important; 
            left: 50% !important; 
            top: 50% !important; 
            transform: translate(-50%, -50%) scale(1) !important;
            width: 800px !important;
            height: 600px !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          @page { size: landscape; margin: 0; }
        }
      `}} />
      <div style={{ width: '100%', maxWidth: 800, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }} className="no-print">
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', fontSize: '14px', fontWeight: 600, padding: '8px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s', cursor: 'pointer' }}>
          <ArrowLeft size={16} />
          Kembali
        </button>
        <button onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600, padding: '8px 16px', background: 'var(--color-primary)', borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(1, 169, 107, 0.2)', transition: 'all 0.2s', cursor: 'pointer' }}>
          <Download size={16} />
          Simpan PDF (Print)
        </button>
      </div>
      
      <div style={{ width: '100%', maxWidth: 800, display: 'flex', justifyContent: 'center' }}>
        <div 
          id="certificate-container"
          ref={certRef}
          style={{ 
            width: 800, height: 600, 
            background: \`url(\${template.bgImage}) center/cover no-repeat\`, 
            position: 'relative', 
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#fff',
            transformOrigin: 'top center',
            // Simple responsive scaling for view
            transform: 'scale(min(1, calc((100vw - 48px) / 800)))',
            marginBottom: 'min(0px, calc(600px * (min(1, calc((100vw - 48px) / 800)) - 1)))'
          }}
        >
          {Array.isArray(template.config) && template.config.map((item: any) => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: item.x,
                top: item.y,
                transform: 'translate(-50%, -50%)',
                fontSize: \`\${item.fontSize}px\`,
                color: item.color,
                fontWeight: 700,
                width: item.width ? \`\${item.width}px\` : undefined,
                whiteSpace: item.width ? 'pre-wrap' : 'nowrap',
                wordBreak: 'break-word',
                textAlign: 'center',
                mixBlendMode: item.transparentBg ? 'multiply' : 'normal',
              }}
            >
              {item.type === 'image' && item.src ? (
                <img 
                  src={item.src} 
                  alt={item.label} 
                  style={{ width: item.width || 150, display: 'block', pointerEvents: 'none' }} 
                />
              ) : (
                renderContent(item)
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
