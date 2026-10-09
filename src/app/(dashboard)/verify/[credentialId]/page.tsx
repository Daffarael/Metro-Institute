'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { Loader2, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#059669]" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#059669] p-6 text-center">
        <div className="w-full max-w-md bg-white rounded-3xl p-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#059669] flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-[#059669]" />
          </div>
          <h1 className="text-2xl font-bold text-[#059669] mb-2">Verifikasi Gagal</h1>
          <p className="text-[#059669]/80">
            Sertifikat dengan ID <strong className="text-[#059669]">{credentialId}</strong> tidak valid atau tidak ditemukan.
          </p>
        </div>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div className="min-h-screen bg-[#059669] py-12 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[32px] relative shadow-2xl overflow-hidden">
        
        {/* Ticket Cutouts */}
        <div className="absolute top-[280px] -left-5 w-10 h-10 bg-[#059669] rounded-full z-10"></div>
        <div className="absolute top-[280px] -right-5 w-10 h-10 bg-[#059669] rounded-full z-10"></div>

        {/* Top Section */}
        <div className="px-8 pt-12 pb-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-2 border-[#10b981]/30 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-[#059669]" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-[#059669] mb-2 tracking-tight">Sertifikat Valid!</h1>
          <p className="text-[#059669]/70 text-sm font-medium">Sertifikat ini resmi diterbitkan oleh<br/>Metro Institute</p>
        </div>

        {/* Dashed Separator */}
        <div className="w-full px-8 relative">
          <div className="w-full border-t-2 border-dashed border-[#10b981]/20"></div>
        </div>

        {/* Middle Section */}
        <div className="px-8 pt-10 pb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[11px] font-bold text-[#059669]/50 uppercase tracking-widest mb-1">ID Kredensial</p>
              <p className="text-sm font-bold text-[#059669] font-mono">{data.credentialId}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-[#059669]/50 uppercase tracking-widest mb-1">Tanggal Terbit</p>
              <p className="text-sm font-bold text-[#059669]">{format(new Date(data.issuedAt), 'dd MMM yyyy', { locale: id })}</p>
            </div>
          </div>

          {/* Embedded Card (Program & User info) */}
          <div className="bg-[#10b981]/5 border border-[#10b981]/10 rounded-2xl p-6">
            <div className="mb-5">
              <p className="text-[11px] font-bold text-[#059669]/50 uppercase tracking-widest mb-1">Diberikan Kepada</p>
              <p className="text-xl font-bold text-[#059669] capitalize">{data.user?.name}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#059669]/50 uppercase tracking-widest mb-1">Program Selesai ({typeLabel})</p>
              <p className="text-base font-bold text-[#059669] leading-snug">{title}</p>
              {field && <p className="text-xs font-medium text-[#059669]/70 mt-1 uppercase tracking-wider">{field.replace(/_/g, ' ')}</p>}
            </div>
          </div>
        </div>

        {/* Dashed Separator 2 */}
        <div className="w-full px-8 mt-2 relative">
          <div className="w-full border-t-2 border-dashed border-[#10b981]/20"></div>
        </div>

        {/* Bottom Section (Barcode) */}
        <div className="px-8 pt-8 pb-10 flex flex-col items-center">
          {/* Fake Barcode using CSS lines */}
          <div className="flex items-center justify-center gap-[2px] h-12 w-full max-w-[280px] mb-3 opacity-80">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="bg-[#059669] h-full" style={{ width: `${Math.max(1, Math.random() * 4)}px`, opacity: Math.random() > 0.2 ? 1 : 0 }}></div>
            ))}
          </div>
          <p className="text-[#059669]/60 font-mono text-xs tracking-[0.3em] uppercase">{data.credentialId}</p>
        </div>

      </div>
    </div>
  )
}
