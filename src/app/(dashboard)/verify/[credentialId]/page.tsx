'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { Loader2, CheckCircle, ShieldCheck, Calendar, User, BookOpen, AlertCircle, Award } from 'lucide-react'
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
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">Verifikasi Gagal</h1>
        <p className="text-primary/70 max-w-md">
          Sertifikat dengan ID kredensial <strong className="text-primary">{credentialId}</strong> tidak ditemukan atau tidak valid di database Metro Institute.
        </p>
      </div>
    )
  }

  const title = data.productType === 'MINI_COURSE' ? data.course?.title : data.bootcamp?.title
  const field = data.productType === 'MINI_COURSE' ? data.course?.field : data.bootcamp?.field
  const typeLabel = data.productType === 'MINI_COURSE' ? 'Mini Course' : 'Bootcamp'

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-3xl bg-white border border-primary/20 shadow-2xl shadow-primary/5 rounded-none">
        
        {/* Header - Formal & Solid */}
        <div className="bg-primary px-8 py-10 flex flex-col sm:flex-row items-center sm:items-start justify-between relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-10">
            <Award className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-16 h-16 bg-white flex items-center justify-center rounded-sm">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Sertifikat Valid</h1>
              <p className="text-white/80 text-sm font-medium tracking-wide">Sistem Verifikasi Metro Institute</p>
            </div>
          </div>
          <div className="relative z-10 text-center sm:text-right mt-4 sm:mt-0">
            <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Status</div>
            <div className="inline-flex items-center gap-2 bg-white text-primary px-3 py-1 text-sm font-bold uppercase tracking-wider rounded-sm">
              <CheckCircle className="w-4 h-4" /> Terverifikasi
            </div>
          </div>
        </div>

        {/* Content - Data Sheet Style */}
        <div className="p-8 sm:p-12">
          <div className="mb-10 text-center sm:text-left">
            <p className="text-primary/70 text-sm font-medium leading-relaxed max-w-2xl">
              Dokumen ini menyatakan bahwa sertifikat berikut adalah sah dan tercatat di dalam database resmi Metro Institute. Detail kredensial dapat dilihat pada informasi di bawah ini.
            </p>
          </div>

          <div className="border border-primary/20 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b border-primary/10 bg-primary/[0.02]">
                  <th className="py-4 px-6 w-1/3 text-xs font-bold text-primary/60 uppercase tracking-wider border-r border-primary/10">ID Kredensial</th>
                  <td className="py-4 px-6 font-mono text-base font-bold text-primary">{data.credentialId}</td>
                </tr>
                <tr className="border-b border-primary/10">
                  <th className="py-4 px-6 w-1/3 text-xs font-bold text-primary/60 uppercase tracking-wider border-r border-primary/10">Diberikan Kepada</th>
                  <td className="py-4 px-6 text-xl font-black text-primary capitalize">{data.user?.name}</td>
                </tr>
                <tr className="border-b border-primary/10 bg-primary/[0.02]">
                  <th className="py-4 px-6 w-1/3 text-xs font-bold text-primary/60 uppercase tracking-wider border-r border-primary/10">Program Selesai</th>
                  <td className="py-4 px-6">
                    <div className="font-bold text-lg text-primary">{title}</div>
                    <div className="text-sm font-medium text-primary/70 mt-1 flex items-center gap-2">
                      <span className="uppercase text-[10px] tracking-wider border border-primary/30 px-2 py-0.5 rounded-sm">{typeLabel}</span>
                      <span>Bidang: {field?.replace('_', ' ')}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th className="py-4 px-6 w-1/3 text-xs font-bold text-primary/60 uppercase tracking-wider border-r border-primary/10">Tanggal Terbit</th>
                  <td className="py-4 px-6 font-bold text-primary">
                    {format(new Date(data.issuedAt), 'dd MMMM yyyy', { locale: id })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center flex flex-col items-center">
            <div className="w-16 h-[1px] bg-primary/20 mb-6"></div>
            <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest">
              © {new Date().getFullYear()} Metro Institute. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
