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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 border-4 border-white shadow-sm">
          <ShieldCheck className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Gagal</h1>
        <p className="text-gray-500 max-w-sm">
          Sertifikat dengan ID <strong className="text-gray-900">{credentialId}</strong> tidak ditemukan atau tidak valid.
        </p>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center font-sans">
      <div className="w-full max-w-[600px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
        
        {/* Header */}
        <div className="bg-[#059669] px-6 py-10 text-center relative overflow-hidden">
          <div className="absolute -top-6 -right-6 opacity-10">
            <ShieldCheck className="w-40 h-40 text-white" strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <ShieldCheck className="w-12 h-12 text-white mx-auto mb-4" strokeWidth={2} />
            <h1 className="text-2xl font-bold mb-2 text-white tracking-tight">Sertifikat Valid</h1>
            <p className="text-white/90 text-sm font-medium">Sertifikat ini resmi diterbitkan oleh Metro Institute.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-10">
          <div className="flex flex-col space-y-8">
            
            {/* ID Section */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ID Kredensial</div>
              <div className="font-mono text-base font-semibold text-gray-800 bg-gray-50 border border-gray-200 inline-flex px-3 py-1.5 rounded-md tracking-tight">
                {data.credentialId}
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* User Section */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-full bg-[#ecfdf5] flex items-center justify-center text-[#059669] mt-0.5 border border-[#10b981]/10">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Diberikan Kepada</div>
                <div className="text-xl font-bold text-gray-900 capitalize tracking-tight">{data.user?.name}</div>
              </div>
            </div>

            {/* Program Section */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-full bg-[#ecfdf5] flex items-center justify-center text-[#059669] mt-0.5 border border-[#10b981]/10">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Program ({typeLabel})</div>
                <div className="text-xl font-bold text-gray-900 leading-snug tracking-tight mb-1">{title}</div>
                {field && (
                  <div className="text-xs font-semibold text-[#059669] uppercase tracking-wider bg-[#ecfdf5] inline-block px-2.5 py-1 rounded-sm">
                    Bidang: {field.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            </div>

            {/* Date Section */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-full bg-[#ecfdf5] flex items-center justify-center text-[#059669] mt-0.5 border border-[#10b981]/10">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tanggal Penerbitan</div>
                <div className="text-lg font-bold text-gray-900 tracking-tight">
                  {format(new Date(data.issuedAt), 'dd MMMM yyyy', { locale: id })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 sm:p-8 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-2 text-[#059669] font-bold text-sm mb-2">
            <CheckCircle className="w-5 h-5" /> Verifikasi Berhasil
          </div>
          <p className="text-xs font-semibold text-gray-400">Halaman ini adalah bukti verifikasi sah dari sistem Metro Institute.</p>
        </div>
        
      </div>
    </div>
  )
}
