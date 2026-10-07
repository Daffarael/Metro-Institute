'use client'
// src/app/(dashboard)/admin/homepage-manager/page.tsx

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { toast } from 'sonner'
import {
  Globe, Image, Type, BarChart2, BookOpen, Phone, Eye, Layout,
  Briefcase, Layers, AlignLeft, ChevronRight, GripVertical,
  Trash2, Plus, ArrowUp, ArrowDown, Save, Check
} from 'lucide-react'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface HomepageConfig {
  id: string; key: string; value: string
}

// â”€â”€â”€ Managed Keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MANAGED_KEYS = [
  { key: 'hero_title',         type: 'TEXT'    as const, label: 'Judul Utama',              section: 'hero',    hint: 'Teks besar di halaman depan. Bisa pakai <br/> untuk baris baru.' },
  { key: 'hero_subtitle',      type: 'TEXT'    as const, label: 'Subtitel',                 section: 'hero',    hint: 'Kalimat pendek di bawah judul' },
  { key: 'hero_background_url',type: 'IMAGE'   as const, label: 'Gambar Background',        section: 'hero',    hint: 'Foto latar belakang hero section.' },
  { key: 'hero_mockup_url',    type: 'IMAGE'   as const, label: 'Gambar Mockup (Browser)',  section: 'hero',    hint: 'Foto di dalam frame browser bawah hero.' },

  { key: 'programs_title',     type: 'TEXT'    as const, label: 'Judul Baris 1',            section: 'programs',hint: 'Contoh: Pilihan Program' },
  { key: 'programs_title_line2',type:'TEXT'    as const, label: 'Judul Baris 2',            section: 'programs',hint: 'Contoh: Unggulan' },
  { key: 'programs_subtitle',  type: 'TEXT'    as const, label: 'Subtitel',                 section: 'programs',hint: 'Deskripsi singkat di samping judul.' },
  { key: 'programs_items',     type: 'JSON'    as const, label: 'Daftar Program Unggulan',  section: 'programs' },
  { key: 'portfolio_title',    type: 'TEXT'    as const, label: 'Judul Section',            section: 'portfolio',hint: 'Contoh: Karya Mentee' },
  { key: 'portfolio_subtitle', type: 'TEXT'    as const, label: 'Subtitel',                 section: 'portfolio',hint: 'Melihat lebih dekat hasil portofolio...' },
  { key: 'portfolio_items',    type: 'JSON'    as const, label: 'Daftar Karya',             section: 'portfolio' },
  { key: 'services_title',     type: 'TEXT'    as const, label: 'Judul Section',            section: 'services', hint: 'Contoh: Eksplorasi Layanan' },
  { key: 'services_subtitle',  type: 'TEXT'    as const, label: 'Subtitel',                 section: 'services', hint: 'Contoh: Pilih jalur akselerasi karir yang paling sesuai.' },
  { key: 'services_items',     type: 'JSON'    as const, label: 'Daftar Layanan',           section: 'services' },
  { key: 'stats_mentees',      type: 'TEXT'    as const, label: 'Jumlah Mentee',            section: 'stats',   hint: 'Contoh: 1.000+' },
  { key: 'stats_bootcamps',    type: 'TEXT'    as const, label: 'Jumlah Bootcamp',          section: 'stats',   hint: 'Contoh: 12' },
  { key: 'stats_mentors',      type: 'TEXT'    as const, label: 'Jumlah Mentor',            section: 'stats',   hint: 'Contoh: 20+' },
  { key: 'stats_projects',     type: 'TEXT'    as const, label: 'Proyek Selesai',           section: 'stats',   hint: 'Contoh: 500+' },
  { key: 'ebook_title',        type: 'TEXT'    as const, label: 'Judul Ebook',              section: 'ebook',   hint: 'Contoh: Roadmap UI/UX dari Nol' },
  { key: 'ebook_subtitle',     type: 'TEXT'    as const, label: 'Deskripsi Ebook',          section: 'ebook',   hint: 'Penjelasan singkat isi Ebook' },
  { key: 'ebook_cover_url',    type: 'IMAGE'   as const, label: 'Cover Ebook',              section: 'ebook',   hint: 'Gambar sampul ebook.' },
  { key: 'ebook_url',          type: 'TEXT'    as const, label: 'URL / Link Ebook',         section: 'ebook',   hint: 'Link download PDF, Google Drive, dll.' },
  { key: 'footer_brand_desc',  type: 'TEXT'    as const, label: 'Deskripsi Brand',          section: 'footer',  hint: 'Kalimat pendek di bawah logo.' },
  { key: 'whatsapp_number',    type: 'TEXT'    as const, label: 'Nomor WhatsApp',           section: 'contact', hint: 'Format internasional tanpa +, contoh: 6281234567890' },

  { key: 'facebook_url',       type: 'TEXT'    as const, label: 'URL Facebook',             section: 'contact', hint: 'https://facebook.com/metroinstitute' },
  { key: 'instagram_url',      type: 'TEXT'    as const, label: 'URL Instagram',            section: 'contact', hint: 'https://instagram.com/metroinstitute' },
  { key: 'linkedin_url',       type: 'TEXT'    as const, label: 'URL LinkedIn',             section: 'contact', hint: 'https://linkedin.com/company/metro-institute' },
]

// â”€â”€â”€ Section Definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SECTIONS = [
  { id: 'hero',      label: 'Hero Section',     icon: Layout },
  { id: 'stats',     label: 'Statistik',        icon: BarChart2 },
  { id: 'programs',  label: 'Section Program',  icon: Layers },
  { id: 'portfolio', label: 'Karya Mentee',     icon: Briefcase },
  { id: 'services',  label: 'Layanan',          icon: AlignLeft },
  { id: 'ebook',     label: 'Ebook',            icon: BookOpen },
  { id: 'footer',    label: 'Footer',           icon: AlignLeft },
  { id: 'contact',   label: 'Kontak & Sosmed',  icon: Phone },
]


const PORTFOLIO_KEY = 'portfolio_items'
const SERVICES_KEY  = 'services_items'
const PROGRAMS_KEY  = 'programs_items'
const IMAGE_KEYS    = MANAGED_KEYS.filter(k => k.type === 'IMAGE').map(k => k.key)

// â”€â”€â”€ Tiny helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</span>
      {hint && <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2, lineHeight: 1.4 }}>{hint}</p>}
    </div>
  )
}

function SectionCard({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div id={id} style={{
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: 16,
      marginBottom: 20,
    }}>
      {children}
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{
      padding: '20px 24px 16px',
      borderBottom: '1px solid var(--color-border)',
      background: '#fafafa',
      borderRadius: '16px 16px 0 0',
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 3, marginBottom: 0 }}>{subtitle}</p>}
    </div>
  )
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      className="form-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', fontSize: 13 }}
    />
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '8px 14px',
        borderRadius: 8,
        border: `1.5px solid ${value ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: value ? 'var(--color-primary-light)' : '#fff',
        cursor: 'pointer', fontSize: 13, fontWeight: 600,
        color: value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 34, height: 18, borderRadius: 9999,
        background: value ? 'var(--color-primary)' : '#D1D5DB',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </div>
      {label ?? (value ? 'Aktif' : 'Nonaktif')}
    </button>
  )
}

function MiniIconBtn({ icon: Icon, onClick, title, disabled, variant = 'default' }: {
  icon: React.ElementType; onClick: () => void; title?: string; disabled?: boolean; variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 7, border: '1px solid',
        borderColor: variant === 'danger' ? '#FECACA' : 'var(--color-border)',
        background: variant === 'danger' ? '#FEF2F2' : '#fff',
        color: variant === 'danger' ? '#EF4444' : 'var(--color-text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.1s',
        flexShrink: 0,
      }}
    >
      <Icon size={14} />
    </button>
  )
}

// â”€â”€â”€ Image Upload Field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ImageField({ fieldKey, value, onChange }: { fieldKey: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await api.post('/admin/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange(res.data.url)
      toast.success('Gambar berhasil diupload!')
    } catch { toast.error('Upload gagal.') }
    setUploading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Drop zone */}
      <label
        htmlFor={`img-${fieldKey}`}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '18px 12px',
          border: '1.5px dashed var(--color-border)',
          borderRadius: 10, background: '#fafafa',
          cursor: uploading ? 'wait' : 'pointer',
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={async e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) upload(f) }}
      >
        <input id={`img-${fieldKey}`} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={async e => { const f = e.target.files?.[0]; if (f) { await upload(f); e.target.value = '' } }} />
        {uploading
          ? <div style={{ width: 22, height: 22, border: '2.5px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          : <svg width="22" height="22" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
        }
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {uploading ? 'Mengupload...' : 'Klik atau drag & drop gambar'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>PNG, JPG, WEBP â€” maks. 5MB</span>
      </label>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 500 }}>atau paste URL</span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      </div>

      <TextInput value={value} onChange={onChange} placeholder="https://..." />

      {/* Preview */}
      {value && (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--color-border)', background: '#111' }}>
          <img src={value} alt="Preview" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <button type="button" onClick={() => onChange('')} style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, cursor: 'pointer', color: '#fff', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>Ã—</button>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '20px 12px 8px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
            fontSize: 11, color: 'rgba(255,255,255,0.75)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{value}</div>
        </div>
      )}
    </div>
  )
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdminHomepageManagerPage() {
  const qc = useQueryClient()
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty]         = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({})

  const { data: configs, isLoading } = useQuery<HomepageConfig[]>({
    queryKey: ['admin', 'homepage-config'],
    placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/homepage-config').then(r => r.data.data ?? []),
  })

  useEffect(() => {
    if (!configs) return
    const vals: Record<string, string> = {}
    configs.forEach(c => { vals[c.key] = c.value })
    MANAGED_KEYS.forEach(k => { if (!(k.key in vals)) vals[k.key] = '' })
    setLocalValues(vals)
    setIsDirty(false)
  }, [configs])

  const saveAll = useMutation({
    mutationFn: () => api.patch('/admin/homepage-config', {
      configs: MANAGED_KEYS.map(k => ({ key: k.key, value: localValues[k.key] ?? '' })),
    }),
    onSuccess: () => {
      toast.success('Konten homepage berhasil disimpan.')
      qc.invalidateQueries({ queryKey: ['admin', 'homepage-config'] })
      setIsDirty(false)
    },
    onError: () => toast.error('Gagal menyimpan.'),
  })

  const set = (key: string, val: string) => {
    setLocalValues(v => ({ ...v, [key]: val }))
    setIsDirty(true)
  }

  // â”€â”€ Scroll to section on sidebar click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const scrollTo = (id: string) => {
    setActiveSection(id)
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // â”€â”€ Portfolio helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  type PortfolioItem = { media: string; title: string; description: string }
  const getPortfolioItems = (): PortfolioItem[] => { try { return JSON.parse(localValues[PORTFOLIO_KEY] || '[]') } catch { return [] } }
  const setPortfolioItems = (items: PortfolioItem[]) => set(PORTFOLIO_KEY, JSON.stringify(items))
  const addPortfolioItem = () => setPortfolioItems([...getPortfolioItems(), { media: '', title: '', description: '' }])
  const removePortfolioItem = (idx: number) => setPortfolioItems(getPortfolioItems().filter((_, i) => i !== idx))
  const updatePortfolioItem = (idx: number, field: keyof PortfolioItem, val: string) => {
    const items = [...getPortfolioItems()]; items[idx] = { ...items[idx], [field]: val }; setPortfolioItems(items)
  }
  const movePortfolioItem = (idx: number, dir: -1 | 1) => {
    const items = [...getPortfolioItems()]; const to = idx + dir
    if (to < 0 || to >= items.length) return
    ;[items[idx], items[to]] = [items[to], items[idx]]; setPortfolioItems(items)
  }

  // â”€â”€ Service helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  type ServiceItem = { heading: string; subheading: string; imgSrc: string; href: string }
  const getServiceItems = (): ServiceItem[] => { try { return JSON.parse(localValues[SERVICES_KEY] || '[]') } catch { return [] } }
  const setServiceItems = (items: ServiceItem[]) => set(SERVICES_KEY, JSON.stringify(items))
  const addServiceItem = () => setServiceItems([...getServiceItems(), { heading: '', subheading: '', imgSrc: '', href: '#' }])
  const removeServiceItem = (idx: number) => setServiceItems(getServiceItems().filter((_, i) => i !== idx))
  const updateServiceItem = (idx: number, field: keyof ServiceItem, val: string) => {
    const items = [...getServiceItems()]; items[idx] = { ...items[idx], [field]: val }; setServiceItems(items)
  }
  const moveServiceItem = (idx: number, dir: -1 | 1) => {
    const items = [...getServiceItems()]; const to = idx + dir
    if (to < 0 || to >= items.length) return
    ;[items[idx], items[to]] = [items[to], items[idx]]; setServiceItems(items)
  }

  // â”€â”€ Program helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  type ProgramItem = { type: string; thumbnailUrl: string; title: string; description: string }
  const getProgramItems = (): ProgramItem[] => { try { return JSON.parse(localValues[PROGRAMS_KEY] || '[]') } catch { return [] } }
  const setProgramItems = (items: ProgramItem[]) => set(PROGRAMS_KEY, JSON.stringify(items))
  const defaultProgramItem = (): ProgramItem => ({ type: 'BOOTCAMP', thumbnailUrl: '', title: '', description: '' })
  const addProgramItem = () => setProgramItems([...getProgramItems(), defaultProgramItem()])
  const removeProgramItem = (idx: number) => setProgramItems(getProgramItems().filter((_, i) => i !== idx))
  const updateProgramItem = (idx: number, field: keyof ProgramItem, val: string) => {
    const items = [...getProgramItems()]; items[idx] = { ...items[idx], [field]: val }; setProgramItems(items)
  }
  const moveProgramItem = (idx: number, dir: -1 | 1) => {
    const items = [...getProgramItems()]; const to = idx + dir
    if (to < 0 || to >= items.length) return
    ;[items[idx], items[to]] = [items[to], items[idx]]; setProgramItems(items)
  }

  // â”€â”€ Render a standard text/image/boolean field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderField = (k: typeof MANAGED_KEYS[number]) => {
    const val = localValues[k.key] ?? ''
    if ((k.type as string) === 'BOOLEAN') {
      return <Toggle value={val === 'true'} onChange={v => set(k.key, v ? 'true' : 'false')} />
    }
    if (k.type === 'IMAGE' || IMAGE_KEYS.includes(k.key)) {
      return <ImageField fieldKey={k.key} value={val} onChange={v => set(k.key, v)} />
    }
    return <TextInput value={val} onChange={v => set(k.key, v)} placeholder={k.hint} />
  }

  // â”€â”€ Render a group of simple fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderSimpleSection = (sectionId: string, title: string, subtitle?: string) => {
    const keys = MANAGED_KEYS.filter(k => k.section === sectionId)
    return (
      <SectionCard id={`sec-${sectionId}`}>
        <SectionHeader title={title} subtitle={subtitle} />
        <SectionBody>
          {keys.map(k => (
            <div key={k.key}>
              <FieldLabel label={k.label} hint={k.hint} />
              {renderField(k)}
            </div>
          ))}
        </SectionBody>
      </SectionCard>
    )
  }

  if (isLoading) return (
    <div>
      <AdminPageHeader title="Homepage Manager" description="Kelola teks dan visibilitas komponen di halaman publik." />
      <AdminTableSkeleton rows={6} cols={3} />
    </div>
  )


  const portfolioItems = getPortfolioItems()
  const serviceItems   = getServiceItems()
  const programItems   = getProgramItems()

  return (
    <div style={{ paddingBottom: 80 }}>
      <AdminPageHeader
        title="Homepage Manager"
        description="Kelola konten, teks, dan gambar yang tampil di halaman publik."
        action={
          <button
            onClick={() => saveAll.mutate()}
            disabled={!isDirty || saveAll.isPending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', borderRadius: 10,
              background: isDirty ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
              color: isDirty ? '#fff' : 'var(--color-text-tertiary)',
              border: 'none', cursor: isDirty ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
              opacity: saveAll.isPending ? 0.7 : 1,
            }}
          >
            {saveAll.isPending
              ? <><div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Menyimpan...</>
              : <><Save size={14} />Simpan Perubahan</>
            }
          </button>
        }
      />



      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
        {/* â”€â”€ Left column (nav + save card) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Nav card */}
          <div style={{
            background: '#fff', border: '1px solid var(--color-border)',
            borderRadius: 14, padding: 8, display: 'flex', flexDirection: 'column', gap: 2,
          }}>
          {SECTIONS.map(s => {
            const Icon = s.icon
            const isActive = activeSection === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none',
                  background: isActive ? 'var(--color-primary-light)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer', fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                  textAlign: 'left', transition: 'all 0.12s',
                }}
              >
                <Icon size={14} style={{ flexShrink: 0 }} />
                {s.label}
              </button>
            )
          })}
          </div>

          {/* Save card â€” separate card below nav */}
          {isDirty && (
            <div style={{
              background: '#fff', border: '1px solid var(--color-border)',
              borderRadius: 14, padding: 12,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', margin: 0 }}>
                Perubahan belum disimpan
              </p>
              <button
                onClick={() => saveAll.mutate()}
                disabled={saveAll.isPending}
                style={{
                  width: '100%', padding: '7px 0', borderRadius: 8, border: 'none',
                  background: 'var(--color-primary)', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: saveAll.isPending ? 'wait' : 'pointer',
                  opacity: saveAll.isPending ? 0.7 : 1,
                }}
              >
                {saveAll.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          )}
        </div>

        {/* â”€â”€ Right content area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div>


          {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {renderSimpleSection('hero', 'Hero Section', 'Konten utama yang dilihat pertama kali oleh pengunjung.')}

          {/* â”€â”€ STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {renderSimpleSection('stats',   'Statistik',           'Angka-angka pencapaian yang ditampilkan di landing page.')}

          {/* â”€â”€ PROGRAMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <SectionCard id="sec-programs">
            <SectionHeader title="Section Program" subtitle="Judul, subtitel, dan daftar program unggulan di landing page." />
            <SectionBody>
              {/* Title fields */}
              {MANAGED_KEYS.filter(k => k.section === 'programs' && k.type !== 'JSON').map(k => (
                <div key={k.key}>
                  <FieldLabel label={k.label} hint={k.hint} />
                  <TextInput value={localValues[k.key] ?? ''} onChange={v => set(k.key, v)} placeholder={k.hint} />
                </div>
              ))}

              {/* Programs list */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}>
                  DAFTAR PROGRAM UNGGULAN ({programItems.length} item)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {programItems.map((item, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: 12, background: '#fafafa', position: 'relative', zIndex: 100 - idx }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--color-border)', background: '#fff', borderTopLeftRadius: 11, borderTopRightRadius: 11 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>PROGRAM #{idx + 1}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <MiniIconBtn icon={ArrowUp}  onClick={() => moveProgramItem(idx, -1)} disabled={idx === 0} />
                        <MiniIconBtn icon={ArrowDown} onClick={() => moveProgramItem(idx, 1)}  disabled={idx === programItems.length - 1} />
                        <MiniIconBtn icon={Trash2}    onClick={() => removeProgramItem(idx)}   variant="danger" />
                      </div>
                    </div>
                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Thumbnail */}
                      <div>
                        <FieldLabel label="Thumbnail Program" />
                        <ImageField
                          fieldKey={`prog-thumb-${idx}`}
                          value={item.thumbnailUrl}
                          onChange={v => updateProgramItem(idx, 'thumbnailUrl', v)}
                        />
                      </div>
                      {/* Title & Description */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                        <div>
                          <FieldLabel label="Tipe Program" />
                          <CleanCombobox width={240} allowClear={false} value={serviceItems.length === 0 ? "" : (item.type || (serviceItems[0]?.heading?.toUpperCase() ?? "BOOTCAMP"))}
                            onChange={v => updateProgramItem(idx, "type", v)}
                            options={serviceItems.length > 0 ? serviceItems.map(s => ({ value: (s.heading || "").toUpperCase(), label: s.heading || "Untitled" })) : [{ value: "", label: "⚠️ Isi data layanan dulu!" }]}
                            placeholder={serviceItems.length > 0 ? "Pilih Tipe Program..." : "⚠️ Isi Layanan terlebih dahulu"}
                          />
                        </div>
                        <div>
                          <FieldLabel label="Judul Program" />
                          <TextInput value={item.title} onChange={v => updateProgramItem(idx, 'title', v)} placeholder="Contoh: Bootcamp Frontend React" />
                        </div>
                        <div>
                          <FieldLabel label="Deskripsi Singkat" />
                          <TextInput value={item.description} onChange={v => updateProgramItem(idx, 'description', v)} placeholder="Contoh: Belajar membuat website responsif dengan React." />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addProgramItem}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px', border: '1.5px dashed var(--color-border)', borderRadius: 10, background: '#fafafa', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Plus size={15} />Tambah Program
              </button>
            </SectionBody>
          </SectionCard>

          {/* â”€â”€ PORTFOLIO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <SectionCard id="sec-portfolio">
            <SectionHeader title="Karya Mentee" subtitle="Portofolio nyata alumni yang ditampilkan di landing page." />
            <SectionBody>
              {/* Title & Subtitle */}
              {MANAGED_KEYS.filter(k => k.section === 'portfolio' && k.type !== 'JSON').map(k => (
                <div key={k.key}>
                  <FieldLabel label={k.label} hint={k.hint} />
                  <TextInput value={localValues[k.key] ?? ''} onChange={v => set(k.key, v)} />
                </div>
              ))}

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}>
                  DAFTAR KARYA ({portfolioItems.length} item)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {portfolioItems.map((item, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: 12, background: '#fafafa', position: 'relative', zIndex: 100 - idx }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--color-border)', background: '#fff', borderTopLeftRadius: 11, borderTopRightRadius: 11 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>KARYA #{idx + 1}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <MiniIconBtn icon={ArrowUp}  onClick={() => movePortfolioItem(idx, -1)} disabled={idx === 0} />
                        <MiniIconBtn icon={ArrowDown} onClick={() => movePortfolioItem(idx, 1)}  disabled={idx === portfolioItems.length - 1} />
                        <MiniIconBtn icon={Trash2}    onClick={() => removePortfolioItem(idx)}   variant="danger" />
                      </div>
                    </div>
                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <FieldLabel label="Gambar Karya" />
                        <ImageField
                          fieldKey={`portfolio-media-${idx}`}
                          value={item.media}
                          onChange={v => updatePortfolioItem(idx, 'media', v)}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <FieldLabel label="Judul Karya" />
                          <TextInput value={item.title} onChange={v => updatePortfolioItem(idx, 'title', v)} placeholder="Contoh: E-Commerce Platform" />
                        </div>
                        <div>
                          <FieldLabel label="Nama Alumni" />
                          <TextInput value={item.description} onChange={v => updatePortfolioItem(idx, 'description', v)} placeholder="Contoh: Oleh Budi (Alumni Batch 4)" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addPortfolioItem}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px', border: '1.5px dashed var(--color-border)', borderRadius: 10, background: '#fafafa', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Plus size={15} />Tambah Karya
              </button>
            </SectionBody>
          </SectionCard>

          {/* â”€â”€ SERVICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <SectionCard id="sec-services">
            <SectionHeader title="Eksplorasi Layanan" subtitle="Daftar layanan yang tampil di landing page." />
            <SectionBody>
              {MANAGED_KEYS.filter(k => k.section === 'services' && k.type !== 'JSON').map(k => (
                <div key={k.key}>
                  <FieldLabel label={k.label} hint={k.hint} />
                  <TextInput value={localValues[k.key] ?? ''} onChange={v => set(k.key, v)} />
                </div>
              ))}

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}>
                  DAFTAR LAYANAN ({serviceItems.length} item)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {serviceItems.map((item, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: 12, background: '#fafafa', position: 'relative', zIndex: 100 - idx }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--color-border)', background: '#fff', borderTopLeftRadius: 11, borderTopRightRadius: 11 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>LAYANAN #{idx + 1}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <MiniIconBtn icon={ArrowUp}  onClick={() => moveServiceItem(idx, -1)} disabled={idx === 0} />
                        <MiniIconBtn icon={ArrowDown} onClick={() => moveServiceItem(idx, 1)}  disabled={idx === serviceItems.length - 1} />
                        <MiniIconBtn icon={Trash2}    onClick={() => removeServiceItem(idx)}   variant="danger" />
                      </div>
                    </div>
                    <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                      <div>
                        <FieldLabel label="Nama Layanan" />
                        <TextInput value={item.heading} onChange={v => updateServiceItem(idx, 'heading', v)} placeholder="Contoh: Bootcamp" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel label="Deskripsi Singkat" />
                        <TextInput value={item.subheading} onChange={v => updateServiceItem(idx, 'subheading', v)} placeholder="Contoh: Program intensif siap kerja." />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel label="Gambar Layanan (hover preview)" />
                        <ImageField
                          fieldKey={`service-img-${idx}`}
                          value={item.imgSrc}
                          onChange={v => updateServiceItem(idx, 'imgSrc', v)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addServiceItem}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px', border: '1.5px dashed var(--color-border)', borderRadius: 10, background: '#fafafa', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Plus size={15} />Tambah Layanan
              </button>
            </SectionBody>
          </SectionCard>

          {/* â”€â”€ Remaining simple sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {renderSimpleSection('ebook',   'Ebook Lead Magnet',   'Penawaran ebook gratis untuk lead generation.')}
          {renderSimpleSection('footer',  'Footer',              'Logo, deskripsi brand, dan copyright.')}
          {renderSimpleSection('contact', 'Kontak & Media Sosial','Nomor WhatsApp dan link media sosial.')}
        </div>
      </div>
    </div>
  )
}














