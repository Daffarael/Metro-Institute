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
        <div className="w-full max-w-md bg-white rounded-[2rem] p-10 flex flex-col items-center shadow-xl shadow-[#059669]/5">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#064e3b] mb-2">Verifikasi Gagal</h1>
          <p className="text-[#064e3b]/70">
            Sertifikat dengan ID <strong className="text-[#064e3b]">{credentialId}</strong> tidak ditemukan di sistem.
          </p>
        </div>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div className="min-h-screen bg-[#f0fdf4] py-12 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl shadow-[#059669]/5 p-8 sm:p-14">
        
        {/* Header Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-[#f0fdf4] flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-[#059669]" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#064e3b] tracking-tight mb-3">Sertifikat Valid</h1>
          <p className="text-[#064e3b]/70 text-sm sm:text-base font-medium max-w-md leading-relaxed">
            Dokumen ini sah dan terdaftar resmi di dalam database <br className="hidden sm:block"/> sistem Metro Institute.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#059669]/10 mb-10"></div>

        {/* Certificate Details */}
        <div className="space-y-8">
          <div>
            <p className="text-[11px] font-bold text-[#064e3b]/50 uppercase tracking-[0.15em] mb-1.5">ID Kredensial</p>
            <p className="text-base font-mono font-semibold text-[#064e3b] tracking-tight bg-[#f0fdf4] inline-block px-3 py-1 rounded-md">{data.credentialId}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#064e3b]/50 uppercase tracking-[0.15em] mb-1.5">Diberikan Kepada</p>
            <p className="text-2xl font-bold text-[#064e3b] capitalize tracking-tight">{data.user?.name}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#064e3b]/50 uppercase tracking-[0.15em] mb-1.5">Program Diselesaikan</p>
            <p className="text-lg font-semibold text-[#064e3b] leading-snug mb-1">{title}</p>
            {field && (
              <span className="inline-flex items-center text-xs font-semibold text-[#059669] bg-[#f0fdf4] px-2.5 py-1 rounded-full uppercase tracking-wider">
                {typeLabel} • {field.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#064e3b]/50 uppercase tracking-[0.15em] mb-1.5">Tanggal Penerbitan</p>
            <p className="text-base font-semibold text-[#064e3b]">
              {format(new Date(data.issuedAt), 'dd MMMM yyyy', { locale: id })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 bg-[#f0fdf4] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#059669]/10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#059669]" />
            <span className="text-sm font-bold text-[#064e3b]">Terverifikasi Secara Digital</span>
          </div>
          <span className="text-[10px] font-bold text-[#064e3b]/40 uppercase tracking-widest text-center sm:text-right">
            © {new Date().getFullYear()} Metro Institute
          </span>
        </div>

      </div>
    </div>
  )
}
