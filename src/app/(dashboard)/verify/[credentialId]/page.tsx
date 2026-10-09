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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#059669]/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-[#059669]" />
        </div>
        <h1 className="text-2xl font-bold text-[#059669] mb-2">Verifikasi Gagal</h1>
        <p className="text-[#059669]/70 max-w-md">
          Sertifikat dengan ID <strong className="text-[#059669]">{credentialId}</strong> tidak valid atau tidak ditemukan di database kami.
        </p>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div className="min-h-screen bg-white py-16 px-4 flex flex-col items-center font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#10b981]/20 shadow-[0_8px_40px_rgb(16,185,129,0.06)] overflow-hidden">
        
        <div className="p-10 sm:p-14 pb-8 text-center">
          <div className="w-20 h-20 bg-[#059669]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-[#059669]" />
          </div>
          <h1 className="text-3xl font-bold text-[#059669] mb-3 tracking-tight">Sertifikat Valid</h1>
          <p className="text-[#059669]/70 text-base font-medium">Dokumen ini adalah bukti sah yang diterbitkan oleh Metro Institute.</p>
        </div>

        <div className="px-10 sm:px-14 pb-14">
          <div className="w-full h-px bg-[#10b981]/20 mb-10"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8">
            <div className="md:col-span-2">
              <p className="text-xs font-bold text-[#059669]/50 uppercase tracking-[0.2em] mb-2">Diberikan Kepada</p>
              <p className="text-2xl font-bold text-[#059669] capitalize">{data.user?.name}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-bold text-[#059669]/50 uppercase tracking-[0.2em] mb-2">Program ({typeLabel})</p>
              <p className="text-xl font-semibold text-[#059669] leading-snug">{title}</p>
              {field && <p className="text-sm font-medium text-[#059669]/70 mt-1.5">Bidang: {field.replace(/_/g, ' ')}</p>}
            </div>

            <div>
              <p className="text-xs font-bold text-[#059669]/50 uppercase tracking-[0.2em] mb-2">ID Kredensial</p>
              <p className="text-base font-mono font-semibold text-[#059669]">{data.credentialId}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-[#059669]/50 uppercase tracking-[0.2em] mb-2">Tanggal Terbit</p>
              <p className="text-base font-semibold text-[#059669]">
                {format(new Date(data.issuedAt), 'dd MMMM yyyy', { locale: id })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#059669]/5 p-6 border-t border-[#10b981]/10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-2 text-[#059669] font-semibold text-sm">
            <CheckCircle className="w-5 h-5" /> Verifikasi Berhasil
          </div>
        </div>

      </div>
      
      <div className="mt-8 text-center text-[#059669]/40 text-xs font-medium uppercase tracking-widest">
        © {new Date().getFullYear()} Metro Institute
      </div>
    </div>
  )
}
