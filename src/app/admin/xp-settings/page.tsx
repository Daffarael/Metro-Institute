'use client'
// src/app/admin/xp-settings/page.tsx
// Konfigurasi nilai XP untuk setiap aksi mentee
// Sesuai concept doc Section 16 + system_flow.md XpReason enum:
// DAILY_LOGIN, PROFILE_COMPLETE, SKILL_TEST_COMPLETE,
// SESSION_COMPLETED, LIVE_ATTENDED, ASSIGNMENT_GRADED,
// REFERRAL_BONUS, BADGE_UPGRADE
// XP disimpan di tabel XpConfig { reason, amount, isActive }

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Save, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────
interface XpConfig {
  id: string; reason: string; amount: number; isActive: boolean
}

const XP_REASON_LABELS: Record<string, { label: string; desc: string }> = {
  DAILY_LOGIN:          { label: 'Login Harian', desc: 'XP diberikan sekali per hari saat mentee login.' },
  PROFILE_COMPLETE:     { label: 'Profil Lengkap', desc: 'XP diberikan satu kali saat profil mencapai 100%.' },
  SKILL_TEST_COMPLETE:  { label: 'Lulus Skill Test', desc: 'XP diberikan saat mentee lulus skill test (skor ≥ 70).' },
  SESSION_COMPLETED:    { label: 'Sesi Selesai', desc: 'XP diberikan setiap sesi Bootcamp/Mini Course diselesaikan.' },
  LIVE_ATTENDED:        { label: 'Hadir Live Class', desc: 'XP diberikan saat mentee absen di sesi live.' },
  ASSIGNMENT_GRADED:    { label: 'Tugas Dinilai', desc: 'XP diberikan proporsional berdasarkan skor (skor/maxScore × XP).' },
  REFERRAL_BONUS:       { label: 'Referral Berhasil', desc: 'XP diberikan saat orang yang direferral mendaftar bootcamp/course.' },
  BADGE_UPGRADE:        { label: 'Naik Badge', desc: 'XP bonus saat badge meningkat ke level berikutnya.' },
}

let _cachedConfigs: XpConfig[] = []
let _configsHasLoaded = false

export default function AdminXpSettingsPage() {
  const qc = useQueryClient()
  const [localValues, setLocalValues] = useState<Record<string, number>>({})
  const [localActive, setLocalActive] = useState<Record<string, boolean>>({})
  const [isDirty, setIsDirty] = useState(false)

  const { data: configs, isLoading } = useQuery<XpConfig[]>({
    queryKey: ['admin', 'xp-config'], placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/xp-config').then(r => r.data.data ?? []),
    onSuccess: (data) => {
      const vals: Record<string, number> = {}
      const actives: Record<string, boolean> = {}
      data.forEach(c => { vals[c.reason] = c.amount; actives[c.reason] = c.isActive })
      setLocalValues(vals)
      setLocalActive(actives)
    },
  } as any)

  if (configs !== undefined) {
    _cachedConfigs = configs
    _configsHasLoaded = true
  }

  const saveMutation = useMutation({
    mutationFn: () => api.put('/admin/xp-config', {
      configs: (_cachedConfigs ?? []).map(c => ({
        reason: c.reason,
        amount: localValues[c.reason] ?? c.amount,
        isActive: localActive[c.reason] ?? c.isActive,
      })),
    }),
    onSuccess: () => {
      toast.success('Konfigurasi XP berhasil disimpan.')
      qc.invalidateQueries({ queryKey: ['admin', 'xp-config'], placeholderData: keepPreviousData, })
      setIsDirty(false)
    },
    onError: () => toast.error('Gagal menyimpan konfigurasi.'),
  })

  const handleChange = (reason: string, val: number) => {
    setLocalValues(v => ({ ...v, [reason]: val }))
    setIsDirty(true)
  }
  const handleToggle = (reason: string, active: boolean) => {
    setLocalActive(v => ({ ...v, [reason]: active }))
    setIsDirty(true)
  }

  return (
    <div>
      <AdminPageHeader
        title="Konfigurasi XP"
        description="Atur nilai XP untuk setiap aksi mentee."
        action={
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending}
            className={`btn ${isDirty ? 'btn-primary' : 'btn-secondary'}`}
            style={{ transition: 'all 0.2s', opacity: saveMutation.isPending ? 0.7 : 1 }}
          >
            <Save size={16} /> {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        }
      />

      <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '24px' }}>
        <Info size={14} style={{ flexShrink: 0 }} />
        Penyesuaian konfigurasi XP hanya akan diterapkan pada aktivitas pengguna yang baru. Khusus untuk penilaian tugas, perolehan XP dihitung secara proporsional berdasarkan persentase skor akhir.
      </p>

      <div style={{ minHeight: 400, paddingBottom: 100 }}>
        {isLoading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <AdminTableSkeleton rows={8} cols={4} />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ width: '20%', padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>Aksi</th>
                  <th style={{ width: '50%', padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>Deskripsi</th>
                  <th style={{ width: '15%', padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>XP</th>
                  <th style={{ width: '15%', padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(XP_REASON_LABELS).map((reasonKey) => {
                  const meta = XP_REASON_LABELS[reasonKey]
                  const active = localActive[reasonKey] ?? false
                  const val = localValues[reasonKey] ?? 0

                  return (
                    <tr key={reasonKey}
                      style={{ borderBottom: '1px solid var(--color-border-subtle)', background: active ? '#ffffff' : '#fafafa', transition: 'all 0.2s ease' }}
                    >
                      <td style={{ padding: 'var(--space-4) var(--space-4)', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                        {meta.label}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '13px', maxWidth: 350, lineHeight: 1.5 }}>
                        {meta.desc}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: active ? 1 : 0.5 }}>
                          <input
                            type="number"
                            min={0}
                            max={9999}
                            value={val}
                            onChange={e => handleChange(reasonKey, Number(e.target.value))}
                            disabled={!active}
                            style={{ 
                              width: 70, padding: '8px 12px', borderRadius: '8px', 
                              border: '1px solid rgba(0,0,0,0.08)', fontSize: '14px', 
                              background: active ? '#fff' : '#f9fafb', fontWeight: 600, 
                              textAlign: 'center', outline: 'none', transition: 'all 0.2s',
                              color: 'var(--color-text-primary)'
                            }}
                            onFocus={e => { if (active) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(1,133,86,0.1)' } }}
                            onBlur={e => { if (active) { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.boxShadow = 'none' } }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleToggle(reasonKey, !active)}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: '100px', 
                              border: `1px solid ${active ? '#a7f3d0' : 'rgba(0,0,0,0.08)'}`, 
                              background: active ? '#ecfdf5' : '#f9fafb', cursor: 'pointer', 
                              fontSize: '12px', fontWeight: 600, color: active ? 'var(--color-primary)' : 'var(--color-text-tertiary)', 
                              transition: 'all 0.2s ease', width: 95, justifyContent: 'center'
                            }}
                          >
                            <div style={{ width: 28, height: 16, borderRadius: '8px', background: active ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)', position: 'relative', transition: 'all 0.2s ease', flexShrink: 0 }}>
                              <div style={{ position: 'absolute', top: 2, left: active ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
                            </div>
                            {active ? 'Aktif' : 'Mati'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isDirty && (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ 
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              padding: '12px 16px 12px 24px', borderRadius: '100px', 
              background: '#18181b', color: '#ffffff', 
              fontSize: '14px', fontWeight: 500, 
              boxShadow: '0 12px 32px rgba(0,0,0,0.15)', 
              display: 'flex', alignItems: 'center', gap: 16,
              zIndex: 100
            }}
          >
            <span>Ada perubahan yang belum disimpan.</span>
            <button 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending}
              style={{ 
                background: '#ffffff', color: '#18181b', padding: '6px 16px', 
                borderRadius: '100px', fontSize: '13px', fontWeight: 600, 
                border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
