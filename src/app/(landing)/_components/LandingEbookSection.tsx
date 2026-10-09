'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, BookOpen, Download, Phone, Mail, User } from 'lucide-react'
import api from '@/lib/axios'

interface LandingEbookSectionProps {
  config: Record<string, string>
}

const ebookFormSchema = z.object({
  name: z.string().min(2, 'Nama terlalu pendek'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string()
    .min(9, 'Minimal 9 digit')
    .max(15, 'Maksimal 15 digit')
    .regex(/^[0-9+]+$/, 'Hanya boleh angka dan tanda +'),
})
type EbookForm = z.infer<typeof ebookFormSchema>

export default function LandingEbookSection({ config }: LandingEbookSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EbookForm>({ resolver: zodResolver(ebookFormSchema) })

  const title = config['ebook_title'] || 'Roadmap UI/UX Design dari Nol'
  const subtitle = config['ebook_subtitle'] || 'Pelajari langkah demi langkah menjadi UI/UX Designer profesional. Download gratis panduannya sekarang!'
  const coverUrl = config['ebook_cover_url']
  const buttonText = config['ebook_btn_text'] || 'Download Ebook Gratis'

  const onSubmit = async (data: EbookForm) => {
    try {
      const payload = { ...data, source: `Ebook: ${title}` }
      await api.post('/leads', payload).catch(() => {
        // Ignored for now if endpoint doesn't exist, UX priority
      })
      toast.success('Sukses! Link ebook akan dikirim ke WhatsApp Anda.')
      setIsOpen(false)
      reset()
    } catch (err: any) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        <div className="bg-gray-50 border border-gray-200 rounded-[32px] p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-[#22222E]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-80 h-80 bg-[#6B7EFF]/5 rounded-full blur-[80px] pointer-events-none" />

          {/* Left: Image */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-5/12 flex justify-center relative z-10"
          >
            <div className="relative w-48 md:w-64 aspect-[3/4] rounded-lg shadow-2xl overflow-hidden rotate-[-2deg] border-4 border-white group hover:rotate-0 transition-transform duration-500 bg-white">
              {coverUrl ? (
                <>
                  <img src={coverUrl} alt="Ebook Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <BookOpen className="text-white/80 w-8 h-8" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 m-2" style={{ width: 'calc(100% - 16px)', height: 'calc(100% - 16px)' }}>
                  <div className="w-12 h-16 border-2 border-gray-300 rounded flex items-center justify-center mb-3 bg-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                  <span className="text-gray-400 text-xs text-center font-medium">Cover<br/>Belum Diatur</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Text & CTA */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full md:w-7/12 text-center md:text-left relative z-10 flex flex-col items-center md:items-start"
          >
            <div className="flex justify-center md:justify-start mb-6">
              <svg width="180" height="120" viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl hover:rotate-2 transition-transform duration-300 origin-top">
                {/* Top Peg */}
                <circle cx="100" cy="15" r="10" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2"/>
                <circle cx="100" cy="15" r="4" fill="#9CA3AF"/>
                
                {/* Strings */}
                <line x1="100" y1="15" x2="45" y2="65" stroke="#9CA3AF" strokeWidth="3" />
                <line x1="100" y1="15" x2="155" y2="65" stroke="#9CA3AF" strokeWidth="3" />
                
                {/* Board Outer */}
                <rect x="5" y="50" width="190" height="75" rx="12" fill="#22222E" />
                
                {/* Board Inner Details (Silver border) */}
                <rect x="12" y="57" width="176" height="61" rx="8" fill="none" stroke="#F3F4F6" strokeWidth="1.5" />
                
                {/* Corner Accents */}
                <path d="M 17 62 A 5 5 0 0 1 22 57" fill="none" stroke="#F3F4F6" strokeWidth="1.5" />
                <path d="M 183 62 A 5 5 0 0 0 178 57" fill="none" stroke="#F3F4F6" strokeWidth="1.5" />
                <path d="M 17 113 A 5 5 0 0 0 22 118" fill="none" stroke="#F3F4F6" strokeWidth="1.5" />
                <path d="M 183 113 A 5 5 0 0 1 178 118" fill="none" stroke="#F3F4F6" strokeWidth="1.5" />
                
                {/* Board Screws/Pegs */}
                <circle cx="45" cy="65" r="6" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.5"/>
                <circle cx="45" cy="65" r="2" fill="#9CA3AF"/>
                
                <circle cx="155" cy="65" r="6" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.5"/>
                <circle cx="155" cy="65" r="2" fill="#9CA3AF"/>
                
                {/* Text */}
                <text x="100" y="102" fontFamily="Georgia, serif" fontSize="42" fill="#FFFFFF" textAnchor="middle" fontWeight="normal" letterSpacing="1">GRATIS</text>
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-[#22222E] leading-[1.2] tracking-tight mb-5 mt-2">
              {title}
            </h2>
            <p className="text-gray-500 text-[14px] md:text-[15px] leading-relaxed mb-8 max-w-md mx-auto md:mx-0">
              {subtitle}
            </p>
            <button 
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#22222E] text-white rounded-full text-[14px] font-bold hover:bg-[#16161F] transition-all cursor-pointer shadow-lg shadow-[#22222E]/20 hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              {buttonText}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Modal / Dialog for Lead Form */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-[#22222E] bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-[#22222E]/10 rounded-full flex items-center justify-center mx-auto mb-5 text-[#22222E]">
                    <Download className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#22222E] mb-2">Mau Ebook Gratis?</h3>
                  <p className="text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                    Masukkan data Anda di bawah ini, link ebook akan dikirim otomatis ke WhatsApp.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input 
                        {...register('name')}
                        type="text" 
                        placeholder="Budi Santoso"
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#22222E]/50 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Alamat Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input 
                        {...register('email')}
                        type="email" 
                        placeholder="budi@example.com"
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#22222E]/50 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Nomor WhatsApp Aktif</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input 
                        {...register('phone')}
                        type="text" 
                        placeholder="081234567890"
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#22222E]/50 ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full mt-8 flex justify-center items-center py-3.5 px-4 rounded-xl bg-[#22222E] hover:bg-[#16161F] text-white text-[14px] font-bold transition-all disabled:opacity-70 cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                        Memproses...
                      </span>
                    ) : (
                      'Kirim Ebook Sekarang'
                    )}
                  </button>
                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
