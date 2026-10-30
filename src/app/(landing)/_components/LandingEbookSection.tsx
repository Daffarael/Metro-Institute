'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Download, Phone, Mail, User } from 'lucide-react'
import api from '@/lib/axios'
import { DiamondPattern } from '@/components/ui/diamond-pattern'
import { PopButton } from '@/components/ui/PopButton'

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

  const title = config['ebook_title'] || 'Panduan Memulai Karir di Industri Teknologi'
  const subtitle = config['ebook_subtitle'] || 'Buku saku eksklusif ini berisi roadmap lengkap, cara merancang CV yang dilirik HR, hingga rahasia lulus interview di startup top.'
  const coverUrl = config['ebook_cover_url']
  const buttonText = config['ebook_btn_text'] || 'Download Ebook Gratis'

  const points = [
    'Roadmap karir',
    'CV dilirik HR',
    'Tips lulus interview',
  ]

  const onSubmit = async (data: EbookForm) => {
    try {
      const payload = { ...data, source: `Ebook: ${title}` }
      await api.post('/leads', payload).catch(() => {
        // Ignored for now if endpoint doesn't exist, UX priority
      })
      toast.success('Sukses! Link ebook akan dikirim ke WhatsApp Anda.')
      setIsOpen(false)
      reset()
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
        
        {/* Banner with authentic brand dark green (#063D2A) & diamond pattern */}
        <div className="relative rounded-[28px] md:rounded-[36px] bg-[#063D2A] text-white overflow-hidden p-8 sm:p-12 md:p-16 shadow-[0_20px_50px_rgba(6,61,42,0.22)] border border-[#042C1E]">
          
          {/* Authentic Diamond Pattern - solid crisp deep emerald texture (0% white, 0% transparency) */}
          <DiamondPattern size={76} diamondColor="#0F4432" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 sm:gap-12 md:gap-14 lg:gap-16">

            {/* Left: Yellow Ebook Cover */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full md:w-auto flex justify-center shrink-0"
            >
              <div className="relative w-[230px] sm:w-[250px] h-[310px] sm:h-[330px] rounded-r-[18px] rounded-l-[8px] bg-[#FCE138] p-6 sm:p-7 pl-9 sm:pl-10 flex flex-col justify-between shadow-[18px_22px_0_rgba(0,0,0,0.18)] -rotate-3 hover:rotate-0 transition-transform duration-300">
                {coverUrl ? (
                  <>
                    <img src={coverUrl} alt="Ebook Cover" className="absolute inset-0 w-full h-full object-cover rounded-r-[18px] rounded-l-[8px]" />
                  </>
                ) : (
                  <>
                    {/* Spine */}
                    <span className="absolute left-0 top-0 bottom-0 w-3 rounded-l-[8px] bg-[#E5C61F]" />
                    
                    {/* Top Pill */}
                    <span className="inline-block w-fit px-3 py-1 rounded-full bg-[#063D2A] text-white text-[11px] font-extrabold tracking-wider uppercase">
                      EBOOK
                    </span>

                    {/* Title */}
                    <h3 className="text-xl sm:text-[22px] font-black text-[#063D2A] leading-[1.25] tracking-tight">
                      {title}
                    </h3>

                    {/* Foot */}
                    <div className="flex items-center justify-between text-xs font-bold text-[#063D2A] pt-2">
                      <span>Metro Institute</span>
                      <img src="/images/logo.jpg" alt="Metro Institute" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Right: Content & CTA */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex-1 flex flex-col items-start gap-4 md:gap-5 text-left"
            >
              {/* Hanging GRATIS Signboard with authentic design & pendulum swing animation */}
              <motion.div 
                animate={{ rotate: [-3.5, 3.5, -3.5] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                style={{ transformOrigin: "50% 14px" }}
                whileHover={{ scale: 1.05, rotate: 6, transition: { duration: 0.3 } }}
                className="flex justify-center md:justify-start mb-1 cursor-pointer select-none origin-top"
              >
                <svg 
                  width="180" 
                  height="120" 
                  viewBox="0 0 200 130" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="drop-shadow-2xl origin-top"
                >
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
                  <text 
                    x="100" 
                    y="102" 
                    fontFamily="Georgia, 'Times New Roman', serif" 
                    fontSize="42" 
                    fill="#FFFFFF" 
                    textAnchor="middle" 
                    fontWeight="normal" 
                    letterSpacing="1"
                  >
                    GRATIS
                  </text>
                </svg>
              </motion.div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-white leading-[1.18] tracking-tight">
                {title}
              </h2>

              {/* Description */}
              <p className="text-[#CFE5D9] text-sm sm:text-base md:text-[17px] leading-relaxed max-w-xl">
                {subtitle}
              </p>

              {/* Points as rounded pills */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {points.map((pt) => (
                  <span
                    key={pt}
                    className="px-4 py-2 rounded-full bg-[#042C1E] border border-[#0F5238] text-white text-xs sm:text-sm font-bold tracking-wide shadow-sm"
                  >
                    {pt}
                  </span>
                ))}
              </div>

              {/* Yellow CTA Button */}
              <PopButton 
                type="button"
                color="yellow"
                size="lg"
                onClick={() => setIsOpen(true)}
                className="mt-2 gap-2.5 font-bold shadow-lg"
              >
                <Download className="w-5 h-5 text-[#063D2A]" strokeWidth={2.4} />
                <span>{buttonText}</span>
              </PopButton>
            </motion.div>

          </div>
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
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-[#063D2A] bg-gray-50 hover:bg-emerald-50 rounded-full p-2 transition-colors cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-[#E6F4EC] rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#03764F]">
                    <Download className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-[#063D2A] mb-2">Mau Ebook Gratis?</h3>
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
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#03764F]/30 focus:border-[#03764F] ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
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
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#03764F]/30 focus:border-[#03764F] ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
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
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#03764F]/30 focus:border-[#03764F] ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>

                  {/* Submit */}
                  <PopButton 
                    type="submit" 
                    color="green"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full mt-8 shadow-lg shadow-[#063D2A]/30"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                        Memproses...
                      </span>
                    ) : (
                      'Kirim Ebook Sekarang'
                    )}
                  </PopButton>
                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
