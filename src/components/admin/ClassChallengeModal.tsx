'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { X, Check, Zap, HelpCircle, FileText, Search, Sparkles, AlertCircle } from 'lucide-react'
import api from '@/lib/axios'
import { FIELD_LABELS, LEVEL_LABELS } from '@/lib/utils'
import { toast } from 'sonner'

interface ChallengeItem {
  id: string
  title: string
  description?: string
  type: 'QUIZ' | 'PROJECT'
  field: string
  level: string
  xpReward: number
  tags: string[]
}

interface AssignedItem {
  challengeId: string
  unlockAtProgress: number
}

interface Props {
  classId: string
  classTitle: string
  classType: 'MINI_COURSE' | 'BOOTCAMP'
  field: string
  level: string
  onClose: () => void
}

const PRESET_PERCENTAGES = [0, 25, 50, 75, 100]

export default function ClassChallengeModal({
  classId,
  classTitle,
  classType,
  field,
  level,
  onClose,
}: Props) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({})

  const apiEndpoint = classType === 'MINI_COURSE'
    ? `/admin/courses/${classId}/challenges`
    : `/admin/bootcamps/${classId}/challenges`

  const { data, isLoading } = useQuery({
    queryKey: ['admin', classType, classId, 'challenges'],
    queryFn: () => api.get(apiEndpoint).then((r) => r.data.data),
  })

  const availableChallenges: ChallengeItem[] = data?.availableChallenges || []
  const initialAssigned: AssignedItem[] = data?.assignedConfig || []

  // Initialize selected map when data loads
  useEffect(() => {
    if (initialAssigned.length > 0) {
      const map: Record<string, number> = {}
      initialAssigned.forEach((item) => {
        map[item.challengeId] = item.unlockAtProgress ?? 0
      })
      setSelectedMap(map)
    }
  }, [data])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const filteredChallenges = useMemo(() => {
    if (!search.trim()) return availableChallenges
    const q = search.toLowerCase()
    return availableChallenges.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    )
  }, [availableChallenges, search])

  const toggleSelect = (id: string) => {
    setSelectedMap((prev) => {
      const next = { ...prev }
      if (next[id] !== undefined) {
        delete next[id]
      } else {
        next[id] = 0 // Default to 0% (unlocked at start)
      }
      return next
    })
  }

  const setProgress = (id: string, pct: number) => {
    setSelectedMap((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(100, pct)),
    }))
  }

  // Auto-distribute unlock percentages evenly (e.g. 4 items -> 0%, 25%, 50%, 75%)
  const autoDistributePercentages = () => {
    const selectedIds = Object.keys(selectedMap)
    if (selectedIds.length === 0) {
      toast.info('Pilih setidaknya 1 challenge terlebih dahulu.')
      return
    }

    const next: Record<string, number> = {}
    selectedIds.forEach((id, idx) => {
      if (selectedIds.length === 1) {
        next[id] = 0
      } else {
        const step = 100 / (selectedIds.length || 1)
        next[id] = Math.min(100, Math.round((idx * step) / 5) * 5) // round to nearest 5%
      }
    })
    setSelectedMap(next)
    toast.success('Persentase buka challenge berhasil dibagi rata otomatis!')
  }

  const selectAll = () => {
    const next: Record<string, number> = {}
    availableChallenges.forEach((c, idx) => {
      const step = 100 / (availableChallenges.length || 1)
      next[c.id] = availableChallenges.length === 1 ? 0 : Math.min(100, Math.round((idx * step) / 5) * 5)
    })
    setSelectedMap(next)
  }

  const unselectAll = () => {
    setSelectedMap({})
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = Object.entries(selectedMap).map(([challengeId, unlockAtProgress], orderIndex) => ({
        challengeId,
        unlockAtProgress,
        orderIndex,
      }))
      return api.put(apiEndpoint, { challenges: payload })
    },
    onSuccess: () => {
      toast.success('Pengaturan Challenge Bank kelas berhasil disimpan!')
      qc.invalidateQueries({ queryKey: ['admin', classType] })
      qc.invalidateQueries({ queryKey: ['challenges'] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pengaturan challenge.')
    },
  })

  const selectedCount = Object.keys(selectedMap).length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 18px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: '#fef3c7',
                  color: '#b45309',
                }}
              >
                <Zap size={12} fill="#f59e0b" color="#f59e0b" /> CHALLENGE BANK KELAS
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'var(--color-primary-light, #e0f2fe)',
                  color: 'var(--color-primary, #0284c7)',
                }}
              >
                {FIELD_LABELS[field] || field}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                }}
              >
                Level: {LEVEL_LABELS[level] || level}
              </span>
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {classTitle}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              color: '#64748b',
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.color = '#0f172a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info Banner */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#16a34a" />
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: 500 }}>
                Menampilkan soal yang cocok untuk bidang <strong>{FIELD_LABELS[field] || field}</strong> dan level <strong>{LEVEL_LABELS[level] || level}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={autoDistributePercentages}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #86efac',
                color: '#15803d',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <Zap size={12} fill="#16a34a" /> Bagi Rata Progres Otomatis
            </button>
          </div>

          {/* Search & Actions Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search
                size={14}
                color="#94a3b8"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul challenge..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#f8fafc',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={selectAll}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={unselectAll}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Challenge List */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
              ))}
            </div>
          ) : availableChallenges.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#f8fafc',
                borderRadius: 16,
                border: '1px dashed #cbd5e1',
              }}
            >
              <AlertCircle size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Belum Ada Challenge untuk Level Ini
              </h4>
              <p style={{ fontSize: '12px', color: '#64748b', maxWidth: 360, margin: '0 auto 16px', lineHeight: 1.5 }}>
                Sistem tidak menemukan Challenge Bank di bidang <strong>{FIELD_LABELS[field] || field}</strong> dengan level <strong>{LEVEL_LABELS[level] || level}</strong>.
              </p>
              <a
                href="/admin/challenges"
                target="_blank"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'var(--color-primary, #0284c7)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Buat Challenge di Menu Challenge Bank ↗
              </a>
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '13px' }}>
              Tidak ada challenge yang cocok dengan pencarian "{search}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredChallenges.map((ch) => {
                const isSelected = selectedMap[ch.id] !== undefined
                const unlockPct = selectedMap[ch.id] ?? 0

                return (
                  <div
                    key={ch.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: isSelected ? '1.5px solid var(--color-primary, #0284c7)' : '1px solid #e2e8f0',
                      background: isSelected ? 'rgba(2, 132, 199, 0.02)' : '#ffffff',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                            background: isSelected ? 'var(--color-primary, #0284c7)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 2,
                            flexShrink: 0,
                            transition: 'all 0.15s',
                          }}
                          onClick={() => toggleSelect(ch.id)}
                        >
                          {isSelected && <Check size={13} color="#ffffff" strokeWidth={3} />}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: ch.type === 'QUIZ' ? '#eff6ff' : '#faf5ff',
                                color: ch.type === 'QUIZ' ? '#2563eb' : '#9333ea',
                              }}
                            >
                              {ch.type === 'QUIZ' ? 'KUIS' : 'PROYEK'}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: '#fef3c7',
                                color: '#b45309',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <Zap size={10} fill="#f59e0b" /> +{ch.xpReward} XP
                            </span>
                          </div>

                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                            {ch.title}
                          </div>

                          {ch.description && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#64748b',
                                marginTop: 3,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {ch.description}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Unlock Percentage Setting (Only if selected) */}
                    {isSelected && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: '#f8fafc',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            Terbuka di Progres Belajar:
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              color: 'var(--color-primary, #0284c7)',
                              background: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            {unlockPct}%
                          </span>
                        </div>

                        {/* Quick Presets */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {PRESET_PERCENTAGES.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setProgress(ch.id, preset)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                border: unlockPct === preset ? '1px solid var(--color-primary, #0284c7)' : '1px solid #cbd5e1',
                                background: unlockPct === preset ? 'var(--color-primary, #0284c7)' : '#ffffff',
                                color: unlockPct === preset ? '#ffffff' : '#475569',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.1s',
                              }}
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid #f1f5f9',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            <strong style={{ color: '#0f172a' }}>{selectedCount}</strong> challenge dipilih untuk kelas ini
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--color-primary, #0284c7)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: saveMutation.isPending ? 0.7 : 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
              }}
            >
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Challenge Kelas'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
