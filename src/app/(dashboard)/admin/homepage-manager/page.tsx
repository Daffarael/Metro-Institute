'use client'
// src/app/admin/homepage-manager/page.tsx
// Kelola konten halaman public (Hero, Stats, Testimonial)
// Sesuai concept doc Section 17 + architecture.md HomepageConfig model:
// key (string), value (string/JSON), type ('TEXT'|'JSON'|'BOOLEAN')

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'motion/react'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────
interface HomepageConfig {
  id: string; key: string; value: string; type: 'TEXT' | 'JSON' | 'BOOLEAN'
  label?: string
}

// ─── Definisi key yang dikelola ────────────────────────────
const MANAGED_KEYS = [
  // Navbar
  { key: 'navbar_items', type: 'JSON' as const, label: 'Menu Navigasi', hint: 'Tambah, edit, urutan, atau hapus item di navbar.' },
  // Hero
  { key: 'hero_title',            type: 'TEXT' as const,    label: 'Judul Utama',              hint: 'Teks besar di halaman depan' },
  { key: 'hero_subtitle',         type: 'TEXT' as const,    label: 'Subtitel',                  hint: 'Kalimat pendek di bawah judul' },
  { key: 'hero_cta_label',        type: 'TEXT' as const,    label: 'Tombol CTA',                hint: 'Teks tombol aksi utama, contoh: Mulai Sekarang' },
  { key: 'hero_image_url',        type: 'TEXT' as const,    label: 'URL Gambar Hero (Lama)',    hint: 'URL gambar latar utama hero section (legacy).' },
  { key: 'hero_background_url',   type: 'IMAGE' as const,   label: 'Gambar Background Hero',    hint: 'Foto yang tampil sebagai latar belakang gelap di hero section.' },
  { key: 'hero_mockup_url',       type: 'IMAGE' as const,   label: 'Gambar Mockup (Browser)',   hint: 'Foto yang tampil di dalam frame browser di bagian bawah hero.' },
  { key: 'hero_badge_text',       type: 'TEXT' as const,    label: 'Teks Badge Hero',           hint: 'Teks kecil di atas judul, contoh: #1 Platform Bootcamp Tech Indonesia' },
  { key: 'stats_mentees',         type: 'TEXT' as const,    label: 'Jumlah Mentee',             hint: 'Contoh: 1.000+' },
  { key: 'stats_bootcamps',       type: 'TEXT' as const,    label: 'Jumlah Bootcamp',           hint: 'Contoh: 12' },
  { key: 'stats_mentors',         type: 'TEXT' as const,    label: 'Jumlah Mentor',             hint: 'Contoh: 20+' },
  { key: 'stats_projects',        type: 'TEXT' as const,    label: 'Proyek Selesai',            hint: 'Contoh: 500+' },
  { key: 'ebook_title',           type: 'TEXT' as const,    label: 'Judul Ebook',               hint: 'Judul penawaran Ebook gratis, contoh: Roadmap UI/UX dari Nol' },
  { key: 'ebook_description',     type: 'TEXT' as const,    label: 'Deskripsi Ebook',           hint: 'Penjelasan singkat isi Ebook, tampil di bawah judul' },
  { key: 'ebook_url',             type: 'TEXT' as const,    label: 'URL Ebook',                 hint: 'Link download PDF, Google Drive, dll.' },
  { key: 'whatsapp_number',       type: 'TEXT' as const,    label: 'Nomor WhatsApp',            hint: 'Format internasional tanpa +, contoh: 6281234567890' },
  { key: 'instagram_url',         type: 'TEXT' as const,    label: 'URL Instagram',             hint: 'https://instagram.com/metroinstitute' },
  { key: 'linkedin_url',          type: 'TEXT' as const,    label: 'URL LinkedIn',              hint: 'https://linkedin.com/company/metro-institute' },
  { key: 'discord_link',          type: 'TEXT' as const,    label: 'Link Discord Komunitas',    hint: 'https://discord.gg/...' },
  { key: 'show_testimonials',     type: 'BOOLEAN' as const, label: 'Tampilkan Testimoni',       hint: '' },
  { key: 'programs_title',         type: 'TEXT' as const,    label: 'Judul Baris 1 (Program)',   hint: 'Baris pertama judul section program. Contoh: Pilihan Program' },
  { key: 'programs_title_line2',   type: 'TEXT' as const,    label: 'Judul Baris 2 (Program)',   hint: 'Baris kedua judul section program. Contoh: Unggulan' },
  { key: 'programs_subtitle',      type: 'TEXT' as const,    label: 'Subtitel Section Program',  hint: 'Deskripsi singkat di samping judul section program.' },
  { key: 'programs_tabs',          type: 'JSON' as const,    label: 'Tab Program (Kategori)',    hint: 'Tambah atau hapus tab kategori program. Urutan sesuai tampilan.' },
  // Portfolio / Karya Mentee
  { key: 'portfolio_title',        type: 'TEXT' as const,    label: 'Judul Section Karya Mentee',    hint: 'Contoh: Karya Mentee' },
  { key: 'portfolio_subtitle',     type: 'TEXT' as const,    label: 'Subtitel Section Karya Mentee', hint: 'Contoh: Melihat lebih dekat hasil portofolio nyata lulusan Metro Institute.' },
  { key: 'portfolio_items',        type: 'JSON' as const,    label: 'Daftar Karya Mentee',        hint: 'Tambah, edit, atau hapus kartu portofolio alumni.' },
  // Eksplorasi Layanan
  { key: 'services_title',         type: 'TEXT' as const,    label: 'Judul Section Layanan',      hint: 'Contoh: Eksplorasi Layanan' },
  { key: 'services_subtitle',      type: 'TEXT' as const,    label: 'Subtitel Section Layanan',   hint: 'Contoh: Pilih jalur akselerasi karir yang paling sesuai.' },
  { key: 'services_items',         type: 'JSON' as const,    label: 'Daftar Layanan',             hint: 'Tambah, edit, atau hapus item layanan (Bootcamp, Mini Course, dll).' },
  // Footer
  { key: 'footer_watermark_text',  type: 'TEXT' as const,    label: 'Teks Watermark Footer',      hint: 'Teks besar semi-transparan di bagian bawah footer. Contoh: Metro Institute' },
  { key: 'footer_brand_desc',      type: 'TEXT' as const,    label: 'Deskripsi Brand (Footer)',   hint: 'Kalimat pendek di bawah logo di footer.' },
  { key: 'footer_copyright',       type: 'TEXT' as const,    label: 'Teks Copyright',             hint: 'Contoh: © 2026 Metro Institute. All rights reserved.' },
]

// Keys that are PORTFOLIO type — JSON {media,title,description}[]
const PORTFOLIO_KEY  = 'portfolio_items'
// Keys that are SERVICES type — JSON {heading,subheading,imgSrc,href}[]
const SERVICES_KEY   = 'services_items'
// Keys that are NAVBAR type — JSON {name,href,isHighlighted}[]
const NAVBAR_KEY     = 'navbar_items'
// Keys that are IMAGE type — needs URL input + preview
const IMAGE_KEYS     = MANAGED_KEYS.filter(k => k.type === 'IMAGE').map(k => k.key)
// Keys that are TAG ARRAY type — JSON string[] (exclude complex JSON editors)
const TAGS_KEYS      = MANAGED_KEYS.filter(k => k.type === 'JSON' && k.key !== PORTFOLIO_KEY && k.key !== SERVICES_KEY && k.key !== NAVBAR_KEY).map(k => k.key)

export default function AdminHomepageManagerPage() {
  const qc = useQueryClient()
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty]         = useState(false)
  const [tagInputs, setTagInputs]     = useState<Record<string, string>>({})

  // Helper: parse JSON tags for a key
  const getTags = (key: string): string[] => {
    try { return JSON.parse(localValues[key] || '[]') } catch { return [] }
  }

  // Helper: update tags list
  const setTags = (key: string, tags: string[]) => {
    set(key, JSON.stringify(tags))
  }

  // Helper: add tag
  const addTag = (key: string) => {
    const val = (tagInputs[key] || '').trim().toUpperCase()
    if (!val) return
    const existing = getTags(key)
    if (existing.includes(val)) return
    setTags(key, [...existing, val])
    setTagInputs(v => ({ ...v, [key]: '' }))
  }

  // Helper: remove tag
  const removeTag = (key: string, tag: string) => {
    setTags(key, getTags(key).filter(t => t !== tag))
  }

  const { data: configs, isLoading } = useQuery<HomepageConfig[]>({
    queryKey: ['admin', 'homepage-config'], placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/homepage-config').then(r => r.data.data ?? []),
    onSuccess: (data) => {
      const vals: Record<string, string> = {}
      data.forEach(c => { vals[c.key] = c.value })
      // Fill defaults if key missing
      MANAGED_KEYS.forEach(k => { if (!(k.key in vals)) vals[k.key] = '' })
      setLocalValues(vals)
    },
  } as any)

  const saveAll = useMutation({
    mutationFn: () => api.put('/admin/homepage-config', {
      configs: MANAGED_KEYS.map(k => ({
        key: k.key,
        value: localValues[k.key] ?? '',
        type: k.type,
      })),
    }),
    onSuccess: () => {
      toast.success('Konten homepage berhasil disimpan.')
      qc.invalidateQueries({ queryKey: ['admin', 'homepage-config'], placeholderData: keepPreviousData, })
      setIsDirty(false)
    },
    onError: () => toast.error('Gagal menyimpan.'),
  })

  const set = (key: string, val: string) => {
    setLocalValues(v => ({ ...v, [key]: val }))
    setIsDirty(true)
  }

  // Group by category
  const heroKeys      = MANAGED_KEYS.filter(k => k.key.startsWith('hero'))
  const programsKeys  = MANAGED_KEYS.filter(k => k.key.startsWith('programs'))
  const statsKeys     = MANAGED_KEYS.filter(k => k.key.startsWith('stats'))
  const ebookKeys     = MANAGED_KEYS.filter(k => k.key.startsWith('ebook'))
  const contactKeys   = MANAGED_KEYS.filter(k => ['whatsapp_number', 'instagram_url', 'linkedin_url', 'discord_link'].includes(k.key))
  const displayKeys   = MANAGED_KEYS.filter(k => k.key.startsWith('show'))
  const portfolioTextKeys = MANAGED_KEYS.filter(k => k.key === 'portfolio_title' || k.key === 'portfolio_subtitle')
  const servicesTextKeys  = MANAGED_KEYS.filter(k => k.key === 'services_title' || k.key === 'services_subtitle')
  const footerKeys        = MANAGED_KEYS.filter(k => k.key.startsWith('footer'))

  // ── Navbar items helpers ─────────────────────────────────
  type NavbarItem = { name: string; href: string; isHighlighted?: boolean }

  const getNavbarItems = (): NavbarItem[] => {
    try { return JSON.parse(localValues[NAVBAR_KEY] || '[]') } catch { return [] }
  }
  const setNavbarItems = (items: NavbarItem[]) => set(NAVBAR_KEY, JSON.stringify(items))

  const addNavbarItem = () => {
    setNavbarItems([...getNavbarItems(), { name: '', href: '#', isHighlighted: false }])
  }
  const removeNavbarItem = (idx: number) => {
    setNavbarItems(getNavbarItems().filter((_, i) => i !== idx))
  }
  const updateNavbarItem = (idx: number, field: keyof NavbarItem, val: string | boolean) => {
    const items = [...getNavbarItems()]
    items[idx] = { ...items[idx], [field]: val }
    setNavbarItems(items)
  }
  const moveNavbarItem = (idx: number, dir: -1 | 1) => {
    const items = [...getNavbarItems()]
    const to = idx + dir
    if (to < 0 || to >= items.length) return
    ;[items[idx], items[to]] = [items[to], items[idx]]
    setNavbarItems(items)
  }

  const renderNavbarSection = () => {
    const items = getNavbarItems()
    return (
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)', marginBottom: 4 }}>Menu Navigasi</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
          Atur urutan, label, dan link item di navbar publik. Aktifkan "Highlight" untuk tampilan warna hijau (biasanya tombol Masuk/Daftar).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {items.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
              Belum ada item. Klik tombol di bawah untuk menambahkan.
            </p>
          )}

          {items.map((item, idx) => (
            <div key={idx} style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              background: 'var(--color-bg)',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)' }}>
                  ITEM #{idx + 1}{item.isHighlighted ? ' · HIGHLIGHT' : ''}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => moveNavbarItem(idx, -1)} disabled={idx === 0}
                    style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: 14, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                  <button onClick={() => moveNavbarItem(idx, 1)} disabled={idx === items.length - 1}
                    style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer', fontSize: 14, opacity: idx === items.length - 1 ? 0.3 : 1 }}>↓</button>
                  <button onClick={() => removeNavbarItem(idx)}
                    style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Hapus</button>
                </div>
              </div>

              {/* Fields: 2-col grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Label</label>
                  <input type="text" className="form-input" placeholder="Contoh: Program" value={item.name}
                    onChange={e => updateNavbarItem(idx, 'name', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Link (href)</label>
                  <select
                    className="form-input"
                    value={item.href}
                    onChange={e => updateNavbarItem(idx, 'href', e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <optgroup label="Anchor (halaman ini)">
                      <option value="#"># (atas halaman)</option>
                      <option value="#programs">#programs — Section Program</option>
                      <option value="#features">#features — Keunggulan</option>
                      <option value="#how-it-works">#how-it-works — Cara Kerja</option>
                      <option value="#testimonials">#testimonials — Testimoni</option>
                      <option value="#contact">#contact — Kontak</option>
                    </optgroup>
                    <optgroup label="Halaman Autentikasi">
                      <option value="/login">/login — Masuk</option>
                      <option value="/register">/register — Daftar</option>
                      <option value="/forgot-password">/forgot-password — Lupa Password</option>
                    </optgroup>
                    <optgroup label="Katalog">
                      <option value="/mentee/bootcamp">/mentee/bootcamp — Daftar Bootcamp</option>
                      <option value="/mentee/mini-course">/mentee/mini-course — Daftar Mini Course</option>
                    </optgroup>
                    <optgroup label="Lainnya">
                      <option value="/skill-test">/skill-test — Tes Skill</option>
                      <option value="/mentee/leaderboard">/mentee/leaderboard — Leaderboard</option>
                    </optgroup>
                  </select>
                  {/* Custom URL hint */}
                  <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    Tidak ada? Pilih yang paling dekat, lalu edit langsung di kode.
                  </p>
                </div>
              </div>

              {/* Highlight toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => updateNavbarItem(idx, 'isHighlighted', !item.isHighlighted)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 12px', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${item.isHighlighted ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: item.isHighlighted ? 'var(--color-primary-light)' : 'var(--color-bg)',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    color: item.isHighlighted ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ width: 28, height: 16, borderRadius: 9999, background: item.isHighlighted ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 2, left: item.isHighlighted ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left var(--transition-fast)' }} />
                  </div>
                  {item.isHighlighted ? 'Highlight aktif (hijau)' : 'Normal'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addNavbarItem} className="btn btn-secondary"
          style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600 }}>
          + Tambah Item Menu
        </button>
      </div>
    )
  }

  // ── Portfolio items helpers ──────────────────────────────
  type PortfolioItem = { media: string; title: string; description: string }

  const getPortfolioItems = (): PortfolioItem[] => {
    try { return JSON.parse(localValues[PORTFOLIO_KEY] || '[]') } catch { return [] }
  }
  const setPortfolioItems = (items: PortfolioItem[]) => set(PORTFOLIO_KEY, JSON.stringify(items))

  const addPortfolioItem = () => {
    setPortfolioItems([...getPortfolioItems(), { media: '', title: '', description: '' }])
  }
  const removePortfolioItem = (idx: number) => {
    setPortfolioItems(getPortfolioItems().filter((_, i) => i !== idx))
  }
  const updatePortfolioItem = (idx: number, field: keyof PortfolioItem, val: string) => {
    const items = [...getPortfolioItems()]
    items[idx] = { ...items[idx], [field]: val }
    setPortfolioItems(items)
  }
  const movePortfolioItem = (idx: number, dir: -1 | 1) => {
    const items = [...getPortfolioItems()]
    const to = idx + dir
    if (to < 0 || to >= items.length) return
    ;[items[idx], items[to]] = [items[to], items[idx]]
    setPortfolioItems(items)
  }

  // ── Services items helpers ───────────────────────────────
  type ServiceItem = { heading: string; subheading: string; imgSrc: string; href: string }

  const getServiceItems = (): ServiceItem[] => {
    try { return JSON.parse(localValues[SERVICES_KEY] || '[]') } catch { return [] }
  }
  const setServiceItems = (items: ServiceItem[]) => set(SERVICES_KEY, JSON.stringify(items))

  const addServiceItem = () => {
    setServiceItems([...getServiceItems(), { heading: '', subheading: '', imgSrc: '', href: '#' }])
  }
  const removeServiceItem = (idx: number) => {
    setServiceItems(getServiceItems().filter((_, i) => i !== idx))
  }
  const updateServiceItem = (idx: number, field: keyof ServiceItem, val: string) => {
    const items = [...getServiceItems()]
    items[idx] = { ...items[idx], [field]: val }
    setServiceItems(items)
  }
  const moveServiceItem = (idx: number, dir: -1 | 1) => {
    const items = [...getServiceItems()]
    const to = idx + dir
    if (to < 0 || to >= items.length) return
    ;[items[idx], items[to]] = [items[to], items[idx]]
    setServiceItems(items)
  }

  const renderServicesSection = () => {
    const items = getServiceItems()
    return (
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-5)' }}>Eksplorasi Layanan</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          {servicesTextKeys.map(k => (
            <div key={k.key} className="form-group">
              <label className="form-label" style={{ marginBottom: 'var(--space-2)' }}>{k.label}</label>
              <input type="text" className="form-input" placeholder={k.hint} value={localValues[k.key] ?? ''} onChange={e => set(k.key, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label" style={{ marginBottom: 'var(--space-3)' }}>Daftar Layanan ({items.length} item)</label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            {items.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                Belum ada layanan. Klik tombol di bawah untuk menambahkan.
              </p>
            )}

            {items.map((item, idx) => (
              <div key={idx} style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                background: 'var(--color-bg)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)' }}>LAYANAN #{idx + 1}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => moveServiceItem(idx, -1)} disabled={idx === 0}
                      style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: 14, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => moveServiceItem(idx, 1)} disabled={idx === items.length - 1}
                      style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer', fontSize: 14, opacity: idx === items.length - 1 ? 0.3 : 1 }}>↓</button>
                    <button onClick={() => removeServiceItem(idx)}
                      style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Hapus</button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Nama Layanan</label>
                  <input type="text" className="form-input" placeholder="Contoh: Bootcamp" value={item.heading}
                    onChange={e => updateServiceItem(idx, 'heading', e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Deskripsi Singkat</label>
                  <input type="text" className="form-input" placeholder="Contoh: Program intensif siap kerja." value={item.subheading}
                    onChange={e => updateServiceItem(idx, 'subheading', e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>URL Gambar (hover preview)</label>
                  <input type="text" className="form-input" placeholder="https://..." value={item.imgSrc}
                    onChange={e => updateServiceItem(idx, 'imgSrc', e.target.value)} />
                  {item.imgSrc && (
                    <div style={{ marginTop: 8, height: 100, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <img src={item.imgSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Link (href)</label>
                  <input type="text" className="form-input" placeholder="Contoh: /bootcamp atau #" value={item.href}
                    onChange={e => updateServiceItem(idx, 'href', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <button onClick={addServiceItem} className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600 }}>
            + Tambah Layanan
          </button>
        </div>
      </div>
    )
  }

  const renderSection = (title: string, keys: typeof MANAGED_KEYS) => (
    <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
      <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-5)' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {keys.map(k => (
          <div key={k.key} className="form-group">
            <label className="form-label" style={{ marginBottom: 'var(--space-2)' }}>{k.label}</label>
            {k.type === 'BOOLEAN' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => set(k.key, localValues[k.key] === 'true' ? 'false' : 'true')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 'var(--radius-md)', border: `1px solid ${localValues[k.key] === 'true' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: localValues[k.key] === 'true' ? 'var(--color-primary-light)' : 'var(--color-bg)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: localValues[k.key] === 'true' ? 'var(--color-primary)' : 'var(--color-text-tertiary)', transition: 'all var(--transition-fast)' }}
                >
                  <div style={{ width: 28, height: 16, borderRadius: 'var(--radius-full)', background: localValues[k.key] === 'true' ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 2, left: localValues[k.key] === 'true' ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left var(--transition-fast)' }} />
                  </div>
                  {localValues[k.key] === 'true' ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
            ) : IMAGE_KEYS.includes(k.key) ? (
              /* ── IMAGE field: URL input + live preview ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Paste URL gambar di sini..."
                  value={localValues[k.key] ?? ''}
                  onChange={e => set(k.key, e.target.value)}
                />
                {localValues[k.key] && (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: 200,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    background: '#111',
                  }}>
                    <img
                      src={localValues[k.key]}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Preview</span>
                    </div>
                  </div>
                )}
              </div>
            ) : TAGS_KEYS.includes(k.key) ? (
              /* ── TAG ARRAY field: chip list + add input ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* Existing Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 36 }}>
                  {getTags(k.key).length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Belum ada tab. Tambahkan di bawah.</span>
                  )}
                  {getTags(k.key).map((tag, i) => (
                    <span key={tag} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                      borderRadius: 'var(--radius-full)', padding: '4px 12px',
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                    }}>
                      {i > 0 && (
                        <button
                          title="Geser ke kiri"
                          onClick={() => {
                            const t = getTags(k.key); const arr = [...t];
                            [arr[i-1], arr[i]] = [arr[i], arr[i-1]];
                            setTags(k.key, arr)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 0, fontSize: 14, lineHeight: 1 }}
                        >‹</button>
                      )}
                      {tag}
                      {i < getTags(k.key).length - 1 && (
                        <button
                          title="Geser ke kanan"
                          onClick={() => {
                            const t = getTags(k.key); const arr = [...t];
                            [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
                            setTags(k.key, arr)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 0, fontSize: 14, lineHeight: 1 }}
                        >›</button>
                      )}
                      <button
                        onClick={() => removeTag(k.key, tag)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 0, fontSize: 16, lineHeight: 1, opacity: 0.7 }}
                        title="Hapus"
                      >×</button>
                    </span>
                  ))}
                </div>

                {/* Add new tag input */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama tab baru, contoh: MENTORING"
                    value={tagInputs[k.key] || ''}
                    onChange={e => setTagInputs(v => ({ ...v, [k.key]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(k.key) } }}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => addTag(k.key)}
                    className="btn btn-primary"
                    style={{ flexShrink: 0, padding: '8px 16px', fontSize: 13 }}
                  >+ Tambah</button>
                </div>
              </div>
            ) : (
              <input
                type="text"
                className="form-input"
                value={localValues[k.key] ?? ''}
                onChange={e => set(k.key, e.target.value)}
              />
            )}
            {k.hint && k.type !== 'BOOLEAN' && <span className="form-hint" style={{ marginTop: 'var(--space-2)' }}>{k.hint}</span>}
          </div>
        ))}
      </div>
    </div>
  )

  // \u2500\u2500 Portfolio Section Renderer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const renderPortfolioSection = () => {
    const items = getPortfolioItems()
    return (
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-5)' }}>
          Karya Mentee
        </h3>

        {/* Title & subtitle text fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          {portfolioTextKeys.map(k => (
            <div key={k.key} className="form-group">
              <label className="form-label" style={{ marginBottom: 'var(--space-2)' }}>{k.label}</label>
              <input type="text" className="form-input" value={localValues[k.key] ?? ''} onChange={e => set(k.key, e.target.value)} />
              {k.hint && <span className="form-hint" style={{ marginTop: 'var(--space-2)' }}>{k.hint}</span>}
            </div>
          ))}
        </div>

        {/* Portfolio Items */}
        <div className="form-group">
          <label className="form-label" style={{ marginBottom: 'var(--space-3)' }}>Daftar Karya ({items.length} item)</label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            {items.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                Belum ada karya. Klik tombol di bawah untuk menambahkan.
              </p>
            )}

            {items.map((item, idx) => (
              <div key={idx} style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                background: 'var(--color-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}>
                {/* Card Header: index + reorder + delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)' }}>
                    KARYA #{idx + 1}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => movePortfolioItem(idx, -1)} disabled={idx === 0}
                      style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: 14, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => movePortfolioItem(idx, 1)} disabled={idx === items.length - 1}
                      style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer', fontSize: 14, opacity: idx === items.length - 1 ? 0.3 : 1 }}>↓</button>
                    <button onClick={() => removePortfolioItem(idx)}
                      style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Hapus</button>
                  </div>
                </div>

                {/* Image URL + preview */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>URL Gambar</label>
                  <input type="text" className="form-input" placeholder="https://..." value={item.media}
                    onChange={e => updatePortfolioItem(idx, 'media', e.target.value)} />
                  {item.media && (
                    <div style={{ marginTop: 8, height: 120, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <img src={item.media} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Judul Karya</label>
                  <input type="text" className="form-input" placeholder="Contoh: E-Commerce Platform" value={item.title}
                    onChange={e => updatePortfolioItem(idx, 'title', e.target.value)} />
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Keterangan / Nama Alumni</label>
                  <input type="text" className="form-input" placeholder="Contoh: Oleh Budi (Alumni Bootcamp Batch 4)" value={item.description}
                    onChange={e => updatePortfolioItem(idx, 'description', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          {/* Add item button */}
          <button
            onClick={addPortfolioItem}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600 }}
          >
            + Tambah Karya
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) return (
    <div>
      <AdminPageHeader title="Homepage Manager" />
      <AdminTableSkeleton rows={6} cols={3} />
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-12)' }}>
      <AdminPageHeader
        title="Homepage Manager"
        description="Kelola teks dan visibilitas komponen di halaman publik."
        action={
          <motion.button
            whileHover={isDirty ? { scale: 1.02 } : undefined}
            whileTap={isDirty ? { scale: 0.98 } : undefined}
            onClick={() => saveAll.mutate()}
            disabled={!isDirty || saveAll.isPending}
            className={`btn ${isDirty ? 'btn-primary' : 'btn-secondary'} ${saveAll.isPending ? 'btn-loading' : ''}`}
            style={{ fontWeight: 600, padding: '10px 24px' }}
          >
            {saveAll.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </motion.button>
        }
      />

      <div style={{ maxWidth: 720 }}>
        {renderNavbarSection()}
        {renderSection('Hero Section', heroKeys)}
        {renderSection('Section Program', programsKeys)}
        {renderPortfolioSection()}
        {renderServicesSection()}
        {renderSection('Footer', footerKeys)}
        {renderSection('Statistik', statsKeys)}
        {renderSection('Ebook Lead Magnet', ebookKeys)}
        {renderSection('Kontak & Media Sosial', contactKeys)}
        {renderSection('Pengaturan Tampilan', displayKeys)}
      </div>
    </div>
  )
}
