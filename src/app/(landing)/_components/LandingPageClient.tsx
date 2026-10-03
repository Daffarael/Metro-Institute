'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  MotionNavigationMenu,
  MotionNavigationMenuContent,
  MotionNavigationMenuItem,
  MotionNavigationMenuLink,
  MotionNavigationMenuList,
  MotionNavigationMenuTrigger,
} from "@/components/ui/motion-navigation-menu";
import { InteractiveHoverLinks } from "@/components/ui/interactive-hover-links";
import { Scroll01 } from "@/components/ui/scroll-01";
import { AnimatedNavFramer } from "@/components/ui/animated-nav-framer";
import { motion, useScroll, useTransform } from "framer-motion";

import type { FeaturedBootcamp, FeaturedCourse } from '../page'

interface LandingPageProps {
  config?: Record<string, string>
  featuredBootcamps?: FeaturedBootcamp[]
  featuredCourses?: FeaturedCourse[]
  stats?: { totalMentees: number; totalCertificates: number; totalCourses: number }
}

const DEFAULT_BG   = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000"
const DEFAULT_MOCK = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000"
const DEFAULT_TABS = ['BOOTCAMP', 'MINI COURSE', 'WEBINAR']

// ── Helpers ────────────────────────────────────────────────
function formatPrice(p: number) {
  if (p === 0) return 'Gratis'
  return 'Rp ' + p.toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

const FIELD_LABEL: Record<string, string> = {
  UI_UX: 'UI/UX Design', FRONTEND: 'Frontend Dev',
  BACKEND: 'Backend Dev', MOBILE: 'Mobile Dev',
}

const BATCH_BADGE: Record<string, { label: string; color: string }> = {
  OPEN:        { label: 'Buka Pendaftaran', color: '#018556' },
  ONGOING:     { label: 'Sedang Berjalan',  color: '#F59E0B' },
  CLOSED:      { label: 'Tutup',            color: '#6B7280' },
  COMING_SOON: { label: 'Coming Soon',      color: '#8B5CF6' },
}

export default function LandingPageClient({
  config = {},
  featuredBootcamps = [],
  featuredCourses   = [],
  stats,
}: LandingPageProps = {}) {
  const heroBackgroundImage = config['hero_background_url'] || DEFAULT_BG
  const heroMockupImage     = config['hero_mockup_url']     || DEFAULT_MOCK

  // Parse tabs from JSON config, fallback to default
  const programTabs: string[] = (() => {
    try {
      const parsed = JSON.parse(config['programs_tabs'] || '[]')
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TABS
    } catch {
      return DEFAULT_TABS
    }
  })()

  const [mobileNav, setMobileNav]         = useState(false)
  const [scrolled, setScrolled]           = useState(false)
  const [activeTab, setActiveTab]         = useState(programTabs[0] ?? 'BOOTCAMP')
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Products for active tab — derived from props (computed after state declarations)
  const activeProducts = (() => {
    const tab = activeTab.toUpperCase()
    if (tab.includes('BOOTCAMP'))                       return featuredBootcamps
    if (tab.includes('MINI') || tab.includes('COURSE')) return featuredCourses
    return [] // WEBINAR / custom tabs
  })()

  // Reset carousel when tab changes
  useEffect(() => { setCarouselIndex(0) }, [activeTab])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Parallax Scroll Effects
  const { scrollY } = useScroll()
  const heroTextOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const heroTextY       = useTransform(scrollY, [0, 300], [0, -80])
  const heroImageY      = useTransform(scrollY, [0, 600], [0, 150])
  const wavePath        = useTransform(scrollY, [0, 400], [
    "M0 100 V 50 C 360 50, 600 0, 720 0 C 840 0, 1080 50, 1440 50 V 100 H 0 Z",
    "M0 100 V 50 C 360 50, 600 50, 720 50 C 840 50, 1080 50, 1440 50 V 100 H 0 Z",
  ])
  const buttonOpacity   = useTransform(scrollY, [0, 150], [1, 0])
  const buttonY         = useTransform(scrollY, [0, 150], [0, 20])

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#111] selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          NAVBAR — Animated Framer Nav
      ══════════════════════════════════════════════════════════════ */}
      <AnimatedNavFramer
        items={(() => {
          try {
            const parsed = JSON.parse(config['navbar_items'] || '[]')
            return parsed.length > 0 ? parsed : undefined
          } catch { return undefined }
        })()}
      />

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION — Brand Green Vibe
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[700px] md:min-h-[900px] w-full bg-[#050505] overflow-hidden flex flex-col pt-24 md:pt-32">
        {/* Dynamic Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBackgroundImage} 
            alt="Hero Background" 
            className="w-full h-full object-cover object-center opacity-60"
          />
        </div>

        {/* Subtle Lighting Background Gradient & Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-[#050505] pointer-events-none z-0" />
        
        {/* Hero Content */}
        <motion.div style={{ opacity: heroTextOpacity, y: heroTextY }} className="relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center px-4 flex flex-col items-center mt-8 md:mt-12"
          >
            <h1 className="text-[40px] md:text-[70px] lg:text-[88px] font-bold text-white tracking-[-0.02em] leading-[1.05] mb-6">
              AKSELERASI<br />KARIR DIGITALMU
            </h1>
            <p className="text-white/80 text-[13px] md:text-[15px] max-w-2xl mx-auto font-normal tracking-wide leading-relaxed px-4">
              Metro Institute membantu kamu masuk industri tech lebih cepat melalui<br className="hidden md:block" />
              Bootcamp intensif bersama praktisi nyata.
            </p>
          </motion.div>
        </motion.div>

        {/* Hero Product Image (Sleek Dashboard Mockup) */}
        <motion.div style={{ y: heroImageY }} className="relative z-10 mt-auto w-full max-w-5xl mx-auto px-6 md:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="translate-y-8 md:translate-y-16 animate-float"
          >
            <div className="w-full relative rounded-t-[24px] md:rounded-t-[32px] overflow-hidden shadow-[0_-20px_80px_rgba(0,0,0,0.5)] border-t border-x border-gray-700/50 bg-[#1a1a1a]">
              {/* Sleek Browser Chrome */}
              <div className="absolute top-0 inset-x-0 h-10 md:h-12 bg-white/5 backdrop-blur-xl border-b border-gray-700/50 flex items-center px-4 md:px-6 z-20">
                <div className="flex gap-2 w-16">
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-600" />
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-600" />
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-600" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="h-6 md:h-7 bg-black/40 rounded-md border border-gray-700/50 w-full max-w-[200px] md:max-w-sm flex items-center justify-center">
                    <span className="text-[10px] md:text-[11px] font-medium text-gray-400">app.metroinstitute.id</span>
                  </div>
                </div>
                <div className="w-16" />
              </div>
              {/* Image Content */}
              <div className="relative w-full aspect-[16/10] md:aspect-[16/9] pt-10 md:pt-12">
                 <img src={heroMockupImage} alt="Metro Institute Dashboard" className="w-full h-full object-cover object-top opacity-80" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Concave Transition & Scroll Indicator */}
        <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
          {/* SVG White Curve Mountain (Concave for the green section) */}
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[60px] md:h-[120px]">
            <motion.path d={wavePath} fill="white" />
          </svg>
          
          {/* Scroll Button */}
          <motion.div style={{ opacity: buttonOpacity, y: buttonY }} className="absolute bottom-[35px] md:bottom-[70px] left-1/2 -translate-x-1/2 flex justify-center items-center w-12 h-12 md:w-16 md:h-16 bg-[#FAE653] rounded-full text-[#018556] pointer-events-auto hover:bg-[#f3dc3e] hover:scale-105 transition-all cursor-pointer shadow-[0_10px_30px_rgba(250,230,83,0.3)] animate-bounce">
             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
             </svg>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SHOWCASE SECTION (PROGRAMS)
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24 md:py-32 relative" id="programs">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-20 gap-8"
          >
            <div className="max-w-3xl flex flex-col md:flex-row gap-6 md:gap-24 items-start">
              <h2 className="text-3xl md:text-[44px] font-semibold text-gray-900 tracking-tight leading-[1.15] shrink-0">
                {config['programs_title'] || 'Pilihan Program'}
                <br />
                {config['programs_title_line2'] || 'Unggulan'}
              </h2>
              <p className="text-gray-500 text-sm md:text-[15px] font-medium leading-relaxed max-w-[320px] pt-2">
                {config['programs_subtitle'] || 'Kurikulum standar industri, dibimbing langsung oleh mentor expert, dan fokus pada praktik nyata.'}
              </p>
            </div>
            
            {/* Pill CTA Button */}
            <Link href="/register" className="h-10 md:h-12 px-6 md:px-8 rounded-full bg-[#018556] text-white text-[11px] md:text-[13px] font-semibold hover:bg-[#016B45] transition-colors flex items-center gap-3 shrink-0 shadow-lg shadow-[#018556]/20">
              Daftar Sekarang
              <span className="w-5 h-5 md:w-6 md:h-6 bg-[#FAE653] text-[#018556] rounded-full flex justify-center items-center">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </span>
            </Link>
          </motion.div>

          {/* Navigation Tabs — sliding pill style */}
          <ProgramTabs tabs={programTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Product Carousel Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative w-full rounded-[30px] md:rounded-[40px] bg-[#f7f7f9] overflow-hidden min-h-[500px] md:min-h-[640px]"
          >
            {activeProducts.length === 0 ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-3 text-center px-6 py-24">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <svg width="26" height="26" fill="none" stroke="#D1D5DB" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-semibold">Program segera hadir</p>
                <p className="text-gray-400 text-xs max-w-xs">Kami sedang menyiapkan program terbaik untuk kamu. Pantau terus ya!</p>
              </div>
            ) : (
              <>
                {/* Navigation Arrows */}
                {activeProducts.length > 1 && (
                  <>
                    <button
                      onClick={() => setCarouselIndex(i => (i - 1 + activeProducts.length) % activeProducts.length)}
                      className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm hover:shadow-md transition-all z-20 text-gray-400 hover:text-[#018556]"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                    <button
                      onClick={() => setCarouselIndex(i => (i + 1) % activeProducts.length)}
                      className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm hover:shadow-md transition-all z-20 text-gray-400 hover:text-[#018556]"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                  </>
                )}

                {/* Active Card */}
                {(() => {
                  const product = activeProducts[carouselIndex]
                  const isBootcamp = 'batchStatus' in product
                  const badge = isBootcamp ? BATCH_BADGE[(product as any).batchStatus] : null
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="flex flex-col items-center justify-center w-full h-full py-16 md:py-24 px-6 md:px-12"
                    >
                      {/* Product Card */}
                      <div className="w-full max-w-2xl">
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 bg-gray-200 shadow-xl">
                          {product.thumbnailUrl ? (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            /* fallback gradient if no thumbnail */
                            <div className="w-full h-full bg-gradient-to-br from-[#018556] to-[#014d34] flex items-center justify-center">
                              <span className="text-white/30 text-6xl font-black tracking-tight">
                                {product.field?.charAt(0) ?? 'M'}
                              </span>
                            </div>
                          )}
                          {/* Overlay badges */}
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                              {FIELD_LABEL[product.field] ?? product.field}
                            </span>
                            {badge && (
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm" style={{ background: badge.color + '22', color: badge.color, border: `1px solid ${badge.color}55` }}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          {/* Price badge */}
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#FAE653] text-[#111]">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        </div>

                        {/* Title & Meta */}
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">{product.title}</h3>
                        {isBootcamp && (product as any).mentorName && (
                          <p className="text-center text-gray-500 text-sm mb-6">Mentor: {(product as any).mentorName}</p>
                        )}
                        {!isBootcamp && (
                          <p className="text-center text-gray-500 text-sm mb-6">{(product as any).enrollmentCount?.toLocaleString('id-ID') ?? 0} peserta</p>
                        )}

                        {/* Specs row */}
                        <div className="flex justify-center items-center gap-8 md:gap-16 text-center mt-2">
                          <div>
                            <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Rating</p>
                            <p className="text-sm md:text-base font-bold text-gray-900">⭐ {product.rating > 0 ? product.rating.toFixed(1) : '–'}</p>
                          </div>
                          <div className="w-px h-8 bg-gray-300" />
                          <div>
                            <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Tipe</p>
                            <p className="text-sm md:text-base font-bold text-gray-900">{isBootcamp ? 'BOOTCAMP' : 'MINI COURSE'}</p>
                          </div>
                          <div className="w-px h-8 bg-gray-300" />
                          <div>
                            <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Field</p>
                            <p className="text-sm md:text-base font-bold text-gray-900">{FIELD_LABEL[product.field] ?? product.field}</p>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex justify-center mt-8">
                          <Link
                            href={isBootcamp ? `/bootcamp/${product.id}` : `/course/${product.id}`}
                            className="px-8 py-3 rounded-full bg-[#018556] text-white text-sm font-semibold hover:bg-[#016B45] transition-colors shadow-lg shadow-[#018556]/20 flex items-center gap-2"
                          >
                            Lihat Detail
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )
                })()}

                {/* Dot indicators */}
                {activeProducts.length > 1 && (
                  <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2 z-20">
                    {activeProducts.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className={`rounded-full transition-all ${i === carouselIndex ? 'w-6 h-2 bg-[#018556]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>


        </div>

        {/* Curved Boundary */}
        <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none transform translate-y-[1px]">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[40px] md:h-[80px]">
            <path d="M0 100 V 50 C 360 50, 600 0, 720 0 C 840 0, 1080 50, 1440 50 V 100 H 0 Z" fill="#f7f7f9" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          KARYA MENTEE
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#f7f7f9] relative">

        <div className="relative pt-[96px] bg-[#f7f7f9]">

          {(() => {
            const DEFAULT_PORTFOLIO = [
              { media: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200", title: "E-Commerce Platform",       description: "Oleh Budi (Alumni Bootcamp Batch 4)" },
              { media: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200", title: "SaaS Analytics Dashboard",   description: "Oleh Siti (Alumni Bootcamp Batch 5)" },
              { media: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200", title: "Travel Booking System",       description: "Oleh Andi (Alumni Bootcamp Batch 3)" },
              { media: "https://images.unsplash.com/photo-1526040652367-600053e045cb?auto=format&fit=crop&q=80&w=1200", title: "AI Support Agent UI",       description: "Oleh Rina (Alumni Bootcamp Batch 6)" },
              { media: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200", title: "Fintech CRM Tool",          description: "Oleh Dimas (Alumni Bootcamp Batch 4)" },
            ]
            let portfolioItems = DEFAULT_PORTFOLIO
            try {
              const parsed = JSON.parse(config['portfolio_items'] || '[]')
              if (Array.isArray(parsed) && parsed.length > 0) portfolioItems = parsed
            } catch { /* keep defaults */ }

            return (
              <div className="max-w-6xl w-full mx-auto px-6 md:px-12" style={{ position: 'relative', zIndex: 10 }}>
                <Scroll01 
                  items={portfolioItems}
                  title={config['portfolio_title'] || 'Karya Mentee'}
                  subtitle={config['portfolio_subtitle'] || 'Melihat lebih dekat hasil portofolio nyata lulusan Metro Institute dari berbagai Batch.'}
                />
              </div>
            )
          })()}

        </div>{/* END BOUNDARY */}

        {/* ── BOTTOM ZONE — outside sticky boundary ──────────────────────
            Header is NOT sticky here. Curved SVG lives here.
        ─────────────────────────────────────────────────────────────── */}
        <div className="relative pb-20 md:pb-32">
          <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none transform translate-y-[1px]">
            <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[40px] md:h-[80px]">
              <path d="M0 100 V 50 C 360 50, 600 0, 720 0 C 840 0, 1080 50, 1440 50 V 100 H 0 Z" fill="white" />
            </svg>
          </div>
        </div>

      </section>

      <InteractiveHoverLinks
        title={config['services_title'] || undefined}
        subtitle={config['services_subtitle'] || undefined}
        links={(() => {
          try {
            const parsed = JSON.parse(config['services_items'] || '[]')
            return parsed.length > 0 ? parsed : undefined
          } catch { return undefined }
        })()}
      />

      {/* ══════════════════════════════════════════════════════════════
          FOOTER (METRO INSTITUTE STYLE)
      ══════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#018556] text-white pt-20 overflow-hidden relative z-10 flex flex-col">
        <div className="w-full px-5 lg:px-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16"
          >
            {/* Brand Column (Left) */}
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <img src="/logo-metro-clean.png" alt="Metro Institute" className="h-8 md:h-10 w-auto" />
              </Link>
              <p className="text-[13px] leading-relaxed text-[#b4e6d4] max-w-[250px] font-medium">
                {config['footer_brand_desc'] || 'Platform edukasi teknologi yang berfokus pada pengembangan talenta digital melalui kurikulum industri.'}
              </p>
            </div>

            {/* Links Columns (Middle) */}
            <div>
              <h3 className="font-bold text-white mb-5 text-[14px]">Layanan</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[13px] font-medium text-[#b4e6d4] hover:text-white transition-colors">Bootcamp</a></li>
                <li><a href="#" className="text-[13px] font-medium text-[#b4e6d4] hover:text-white transition-colors">Mini Course</a></li>
                <li><a href="#" className="text-[13px] font-medium text-[#b4e6d4] hover:text-white transition-colors">Harga</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-5 text-[14px]">Perusahaan</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[13px] font-medium text-[#b4e6d4] hover:text-white transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="text-[13px] font-medium text-[#b4e6d4] hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-5 text-[14px]">Bantuan</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[13px] font-medium text-[#b4e6d4] hover:text-white transition-colors">Karir</a></li>
                <li><a href="#" className="text-[13px] font-medium text-[#b4e6d4] hover:text-white transition-colors">Kontak</a></li>
              </ul>
            </div>

            {/* Socials Column (Right) */}
            <div>
              <h3 className="font-bold text-white mb-5 text-[14px]">Ikuti Kami:</h3>
              <div className="flex items-center gap-4">
                <a href="#" className="text-[#b4e6d4] hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                </a>
                <a href="#" className="text-[#b4e6d4] hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="#" className="text-[#b4e6d4] hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* GIANT WATERMARK TEXT (Like "AI Business") */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 1 }}
          className="w-full flex justify-center mt-10 md:mt-16 px-4 select-none pointer-events-none overflow-hidden"
        >
          <h2 className="text-[16vw] md:text-[14vw] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent whitespace-nowrap leading-[0.75]">
            {config['footer_watermark_text'] || 'Metro Institute'}
          </h2>
        </motion.div>

        {/* Bottom Legal & Copyright (Left Aligned Stack) */}
        <div className="w-full text-white pt-8 md:pt-10 pb-6 md:pb-8 px-5 lg:px-10 relative z-10">
          <div className="w-full flex flex-col gap-4">
            <p className="text-[13px] text-[#b4e6d4] font-medium">
              {config['footer_copyright'] || '© 2026 Metro Institute. All rights reserved.'}
            </p>
            <div className="flex flex-wrap gap-6 text-[13px] text-[#b4e6d4] font-medium">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


// ── ProgramTabs — sliding pill, same pattern as Riwayat Transaksi ──────────
function ProgramTabs({
  tabs, activeTab, setActiveTab,
}: {
  tabs: string[]
  activeTab: string
  setActiveTab: (t: string) => void
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pill, setPill] = useState({ left: 0, width: 0 })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const idx = tabs.findIndex(t => t === activeTab)
    const el = btnRefs.current[idx === -1 ? 0 : idx]
    if (el) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth })
      setReady(true)
    }
  }, [activeTab, tabs])

  return (
    <div className="flex justify-center mb-16 md:mb-20">
      <div style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        background: '#f3f4f6',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 9999,
        padding: 4,
      }}>
        {ready && (
          <motion.div
            animate={{ left: pill.left, width: pill.width }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
            style={{
              position: 'absolute',
              top: 4, bottom: 4,
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              borderRadius: 9999,
              border: '1px solid rgba(0,0,0,0.06)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        )}
        {tabs.map((tab, i) => (
          <button
            key={tab}
            ref={el => { btnRefs.current[i] = el }}
            onClick={() => setActiveTab(tab)}
            style={{
              position: 'relative', zIndex: 1,
              padding: '10px 24px',
              border: 'none', background: 'transparent',
              borderRadius: 9999, cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? '#018556' : '#9CA3AF',
              letterSpacing: '0.04em',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  )
}
