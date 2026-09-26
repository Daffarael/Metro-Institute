'use client'
// src/app/admin/homepage-manager/page.tsx
// Kelola konten halaman public (Hero, Stats, Testimonial)
// Sesuai concept doc Section 17 + architecture.md HomepageConfig model:
// key (string), value (string/JSON), type ('TEXT'|'JSON'|'BOOLEAN')

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Save, Plus, Trash2, Info } from 'lucide-react'
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
  { key: 'hero_title',        type: 'TEXT' as const, label: 'Hero — Judul Utama',         hint: 'Teks besar di halaman depan.' },
  { key: 'hero_subtitle',     type: 'TEXT' as const, label: 'Hero — Subtitel',             hint: 'Kalimat pendek di bawah judul.' },
  { key: 'hero_cta_label',    type: 'TEXT' as const, label: 'Hero — Tombol CTA',           hint: 'Teks tombol aksi utama.' },
  { key: 'stats_mentees',     type: 'TEXT' as const, label: 'Statistik — Jumlah Mentee',   hint: 'Format: "1.000+ Mentee"' },
  { key: 'stats_bootcamps',   type: 'TEXT' as const, label: 'Statistik — Jumlah Bootcamp', hint: 'Format: "12 Bootcamp"' },
  { key: 'stats_mentors',     type: 'TEXT' as const, label: 'Statistik — Jumlah Mentor',   hint: 'Format: "20+ Mentor"' },
  { key: 'stats_projects',    type: 'TEXT' as const, label: 'Statistik — Proyek Selesai',  hint: 'Format: "500+ Proyek"' },
  { key: 'whatsapp_number',   type: 'TEXT' as const, label: 'Nomor WhatsApp',              hint: 'Format: 628xxxx (tanpa + atau spasi)' },
  { key: 'instagram_url',     type: 'TEXT' as const, label: 'URL Instagram',               hint: 'https://instagram.com/...' },
  { key: 'linkedin_url',      type: 'TEXT' as const, label: 'URL LinkedIn',                hint: 'https://linkedin.com/...' },
  { key: 'show_testimonials', type: 'BOOLEAN' as const, label: 'Tampilkan Testimoni',      hint: 'true atau false' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)',
  background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none',
}

export default function AdminHomepageManagerPage() {
  const qc = useQueryClient()
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)

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
  const statsKeys     = MANAGED_KEYS.filter(k => k.key.startsWith('stats'))
  const contactKeys   = MANAGED_KEYS.filter(k => k.key.startsWith('whatsapp') || k.key.startsWith('instagram') || k.key.startsWith('linkedin'))
  const displayKeys   = MANAGED_KEYS.filter(k => k.key.startsWith('show'))

  const renderSection = (title: string, keys: typeof MANAGED_KEYS) => (
    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
      <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{title}</h3>
      </div>
      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {keys.map(k => (
          <div key={k.key}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 4 }}>{k.label}</label>
            {k.type === 'BOOLEAN' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => set(k.key, localValues[k.key] === 'true' ? 'false' : 'true')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 'var(--radius-md)', border: `1px solid ${localValues[k.key] === 'true' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: localValues[k.key] === 'true' ? 'var(--color-primary-light)' : 'var(--color-bg)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: localValues[k.key] === 'true' ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
                >
                  <div style={{ width: 28, height: 16, borderRadius: 'var(--radius-full)', background: localValues[k.key] === 'true' ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 2, left: localValues[k.key] === 'true' ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left var(--transition-fast)' }} />
                  </div>
                  {localValues[k.key] === 'true' ? 'Ditampilkan' : 'Disembunyikan'}
                </button>
              </div>
            ) : (
              <input
                value={localValues[k.key] ?? ''}
                onChange={e => set(k.key, e.target.value)}
                placeholder={k.hint}
                style={inputStyle}
              />
            )}
            {k.hint && k.type !== 'BOOLEAN' && <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 3 }}>{k.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  )

  if (isLoading) return (
    <div>
      <AdminPageHeader title="Homepage Manager" />
      <AdminTableSkeleton rows={6} cols={3} />
    </div>
  )

  return (
    <div>
      <AdminPageHeader
        title="Homepage Manager"
        description="Kelola konten teks dan konfigurasi halaman publik."
        action={
          <button
            onClick={() => saveAll.mutate()}
            disabled={!isDirty || saveAll.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--radius-md)', background: isDirty ? 'var(--color-primary)' : 'var(--color-bg)', color: isDirty ? '#fff' : 'var(--color-text-tertiary)', border: `1px solid ${isDirty ? 'var(--color-primary)' : 'var(--color-border)'}`, fontSize: 'var(--text-sm)', fontWeight: 700, cursor: isDirty ? 'pointer' : 'default', opacity: saveAll.isPending ? 0.7 : 1, transition: 'all var(--transition-fast)' }}
          >
            <Save size={15} /> {saveAll.isPending ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500, marginBottom: 'var(--space-5)', border: '1px solid var(--color-border)' }}>
        <Info size={13} color="var(--color-text-tertiary)" /> <span style={{ color: 'var(--color-text-secondary)' }}>Perubahan akan terlihat di halaman publik setelah disimpan dan refresh cache.</span>
      </div>

      <div style={{ maxWidth: 680 }}>
        {renderSection('Hero Section', heroKeys)}
        {renderSection('Statistik', statsKeys)}
        {renderSection('Kontak & Media Sosial', contactKeys)}
        {renderSection('Pengaturan Tampilan', displayKeys)}
      </div>

      {isDirty && (
        <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500, border: '1px solid var(--color-border)', maxWidth: 680 }}>
          Terdapat perubahan yang belum disimpan. Klik "Simpan Semua" di atas untuk menerapkan.
        </div>
      )}
    </div>
  )
}
