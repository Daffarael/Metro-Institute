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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-6 text-center font-sans">
        <div className="w-full max-w-[560px] bg-white rounded-2xl p-8 sm:p-10 flex flex-col items-center border border-gray-200 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sertifikat Tidak Valid</h1>
          <p className="text-gray-500 text-sm max-w-sm">
            Kredensial dengan ID <strong className="text-gray-700">{credentialId}</strong> tidak ditemukan atau tidak terdaftar di sistem kami.
          </p>
        </div>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-[560px] bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-600" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Sertifikat Valid</h1>
          <p className="text-gray-500 text-sm">
            Dokumen ini terdaftar resmi di sistem Metro Institute.
          </p>
        </div>

        {/* Certificate Details */}
        <div className="flex flex-col border-t border-gray-100">
          
          {/* Row: ID Kredensial */}
          <div className="py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div className="sm:w-1/3 text-[12px] font-medium text-gray-500 uppercase tracking-[0.04em]">
              ID Kredensial
            </div>
            <div className="sm:w-2/3">
              <span className="font-mono text-sm text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
                {data.credentialId}
              </span>
            </div>
          </div>

          {/* Row: Diberikan Kepada */}
          <div className="py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div className="sm:w-1/3 text-[12px] font-medium text-gray-500 uppercase tracking-[0.04em]">
              Diberikan Kepada
            </div>
            <div className="sm:w-2/3">
              <span className="text-xl font-semibold text-gray-900 capitalize tracking-tight">
                {data.user?.name}
              </span>
            </div>
          </div>

          {/* Row: Program Diselesaikan */}
          <div className="py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div className="sm:w-1/3 text-[12px] font-medium text-gray-500 uppercase tracking-[0.04em]">
              Program Diselesaikan
            </div>
            <div className="sm:w-2/3">
              <p className="text-base font-medium text-gray-900 leading-snug mb-1.5">{title}</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  {typeLabel}
                </span>
                {field && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    {field.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row: Tanggal Penerbitan */}
          <div className="py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div className="sm:w-1/3 text-[12px] font-medium text-gray-500 uppercase tracking-[0.04em]">
              Tanggal Penerbitan
            </div>
            <div className="sm:w-2/3">
              <span className="text-sm font-medium text-gray-900">
                {format(new Date(data.issuedAt), 'dd MMMM yyyy', { locale: id })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span className="text-[12px] font-medium">Terverifikasi secara digital oleh Metro Institute</span>
        </div>

      </div>
    </div>
  )
}
