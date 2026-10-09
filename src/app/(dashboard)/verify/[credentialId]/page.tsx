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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#ecfdf5] p-6 text-center">
        <div className="w-full max-w-sm bg-white rounded-3xl p-10 flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[#064e3b] mb-2">Verifikasi Gagal</h1>
          <p className="text-[#064e3b]/70 text-sm">
            Sertifikat tidak valid atau tidak ditemukan.
          </p>
        </div>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div className="min-h-screen bg-[#ecfdf5] py-12 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-[400px] bg-white rounded-3xl relative shadow-[0_10px_40px_rgb(5,150,105,0.05)] overflow-hidden">
        
        {/* Top Section */}
        <div className="px-8 pt-10 pb-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#ecfdf5] flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-[#059669]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-[#064e3b] mb-2">Sertifikat Valid!</h1>
          <p className="text-[#064e3b]/60 text-sm font-medium">Dokumen ini resmi diterbitkan oleh Metro Institute</p>
        </div>

        {/* Separator 1 with Cutouts */}
        <div className="relative w-full h-8 flex items-center">
          {/* Left Cutout */}
          <div className="absolute -left-4 w-8 h-8 bg-[#ecfdf5] rounded-full z-10"></div>
          {/* Dashed Line */}
          <div className="w-full border-t-[1.5px] border-dashed border-[#a7f3d0] mx-6 relative z-0"></div>
          {/* Right Cutout */}
          <div className="absolute -right-4 w-8 h-8 bg-[#ecfdf5] rounded-full z-10"></div>
        </div>

        {/* Middle Section */}
        <div className="px-8 pt-6 pb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] font-bold text-[#064e3b]/50 uppercase tracking-widest mb-1">ID Kredensial</p>
              <p className="text-sm font-bold text-[#064e3b] font-mono tracking-tight">{data.credentialId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#064e3b]/50 uppercase tracking-widest mb-1">Tanggal Terbit</p>
              <p className="text-sm font-bold text-[#064e3b]">{format(new Date(data.issuedAt), 'dd MMM yyyy', { locale: id })}</p>
            </div>
          </div>

          {/* Embedded Card */}
          <div className="bg-[#ecfdf5]/60 rounded-2xl p-5">
            <div className="mb-4">
              <p className="text-[10px] font-bold text-[#064e3b]/50 uppercase tracking-widest mb-1">Diberikan Kepada</p>
              <p className="text-lg font-bold text-[#064e3b] capitalize">{data.user?.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#064e3b]/50 uppercase tracking-widest mb-1">Program Selesai ({typeLabel})</p>
              <p className="text-sm font-bold text-[#064e3b] leading-snug">{title}</p>
              {field && <p className="text-xs font-medium text-[#064e3b]/70 mt-1 uppercase tracking-wider">{field.replace(/_/g, ' ')}</p>}
            </div>
          </div>
        </div>

        {/* Separator 2 */}
        <div className="w-full px-8 mt-2 relative">
          <div className="w-full border-t-[1.5px] border-dashed border-[#a7f3d0]"></div>
        </div>

        {/* Bottom Section (Barcode) */}
        <div className="px-8 pt-8 pb-10 flex flex-col items-center">
          <div className="flex items-center justify-center h-14 w-full max-w-[260px] mb-3 opacity-90">
            {/* Generating an exact barcode-like pattern using specific widths */}
            {[2, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 2, 1, 4, 2, 2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 1, 2, 3, 1].map((w, i) => (
              <div key={i} className="bg-[#064e3b] h-full" style={{ width: `${w}px`, marginRight: `${(i % 3 === 0) ? 2 : 1}px` }}></div>
            ))}
          </div>
          <p className="text-[#064e3b]/60 font-mono text-[10px] tracking-[0.4em] uppercase">{data.credentialId.replace(/-/g, '')}</p>
        </div>

      </div>
    </div>
  )
}
