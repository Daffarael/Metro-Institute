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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0fdf4] p-6 text-center">
        <div className="w-full max-w-md bg-white rounded-3xl p-10 flex flex-col items-center shadow-lg shadow-[#059669]/5">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#059669] mb-2">Verifikasi Gagal</h1>
          <p className="text-[#059669]/70">
            Sertifikat dengan ID <strong className="text-[#059669]">{credentialId}</strong> tidak ditemukan di sistem.
          </p>
        </div>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div className="min-h-screen bg-[#f0fdf4] py-16 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-xl shadow-[#059669]/10 p-10 md:p-16">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="w-24 h-24 rounded-full bg-[#f0fdf4] flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-[#059669]" strokeWidth={2} />
          </div>
          <h1 className="text-4xl font-black text-[#059669] tracking-tight mb-4">Sertifikat Valid</h1>
          <p className="text-[#059669]/80 text-lg font-medium max-w-md leading-relaxed">
            Dokumen ini sah dan terdaftar resmi di dalam sistem Metro Institute.
          </p>
        </div>

        {/* Certificate Details (2-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-y-8 gap-x-8 items-start mb-16">
          
          <div className="md:text-right text-[#059669]/60 font-bold text-xs uppercase tracking-[0.2em] pt-1">
            ID Kredensial
          </div>
          <div className="font-mono font-bold text-[#059669] text-xl">
            {data.credentialId}
          </div>

          <div className="md:text-right text-[#059669]/60 font-bold text-xs uppercase tracking-[0.2em] pt-2">
            Diberikan Kepada
          </div>
          <div className="font-black text-[#059669] text-3xl capitalize tracking-tight">
            {data.user?.name}
          </div>

          <div className="md:text-right text-[#059669]/60 font-bold text-xs uppercase tracking-[0.2em] pt-1">
            Program Diselesaikan
          </div>
          <div>
            <div className="font-bold text-[#059669] text-2xl leading-snug mb-3">{title}</div>
            {field && (
              <div className="inline-flex items-center px-4 py-1.5 bg-[#f0fdf4] text-[#059669] text-xs font-bold rounded-md uppercase tracking-widest border border-[#059669]/20">
                {typeLabel} • {field.replace(/_/g, ' ')}
              </div>
            )}
          </div>

          <div className="md:text-right text-[#059669]/60 font-bold text-xs uppercase tracking-[0.2em] pt-1">
            Tanggal Penerbitan
          </div>
          <div className="font-bold text-[#059669] text-xl">
            {format(new Date(data.issuedAt), 'dd MMMM yyyy', { locale: id })}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#f0fdf4] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#059669]/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#059669]" />
            <span className="text-base font-bold text-[#059669]">Terverifikasi Secara Digital</span>
          </div>
          <span className="text-xs font-bold text-[#059669]/50 uppercase tracking-widest text-center md:text-right">
            © {new Date().getFullYear()} Metro Institute
          </span>
        </div>

      </div>
    </div>
  )
}
