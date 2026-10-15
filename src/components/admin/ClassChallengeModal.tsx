'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { X, Check, Search } from 'lucide-react'
import Link from 'next/link'
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
        next[id] = 0
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
        next[id] = Math.min(100, Math.round((idx * step) / 5) * 5)
      }
    })
    setSelectedMap(next)
    toast.success('Persentase buka challenge berhasil dibagi rata.')
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
      toast.success('Pengaturan Challenge Bank berhasil disimpan.')
      qc.invalidateQueries({ queryKey: ['admin', classType] })
      qc.invalidateQueries({ queryKey: ['challenges'] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pengaturan challenge.')
    },
  })

  const selectedCount = Object.keys(selectedMap).length
  const fieldName = FIELD_LABELS[field] || field
  const levelName = LEVEL_LABELS[level] || level

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
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
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.18 }}
        style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: 16,
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: 680,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--color-border-subtle, #e2e8f0)',
        }}
      >
        {/* Header - Ultra Clean */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--color-border-subtle, #f1f5f9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--color-text-primary, #0f172a)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Challenge Bank Kelas
            </h2>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary, #64748b)',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #1e293b)' }}>
                {classTitle}
              </span>
              <span style={{ color: 'var(--color-border, #cbd5e1)' }}>·</span>
              <span>{fieldName}</span>
              <span style={{ color: 'var(--color-border, #cbd5e1)' }}>·</span>
              <span>Level {levelName}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-tertiary, #94a3b8)',
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg, #f1f5f9)'
              e.currentTarget.style.color = 'var(--color-text-primary, #0f172a)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-tertiary, #94a3b8)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Search & Actions Bar - Ultra Clean */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search
                size={14}
                color="#94a3b8"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari challenge..."
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border, #e2e8f0)',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'var(--color-bg, #f8fafc)',
                  color: 'var(--color-text-primary, #0f172a)',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {selectedCount > 1 && (
                <button
                  type="button"
                  onClick={autoDistributePercentages}
                  style={{
                    padding: '6px 11px',
                    borderRadius: 7,
                    border: '1px solid var(--color-border, #e2e8f0)',
                    background: 'var(--color-surface, #ffffff)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-primary, #018556)',
                    cursor: 'pointer',
                  }}
                >
                  Bagi Rata
                </button>
              )}
              <button
                type="button"
                onClick={selectAll}
                style={{
                  padding: '6px 11px',
                  borderRadius: 7,
                  border: '1px solid var(--color-border, #e2e8f0)',
                  background: 'var(--color-surface, #ffffff)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary, #475569)',
                  cursor: 'pointer',
                }}
              >
                Pilih Semua
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={unselectAll}
                  style={{
                    padding: '6px 11px',
                    borderRadius: 7,
                    border: '1px solid var(--color-border, #e2e8f0)',
                    background: 'var(--color-surface, #ffffff)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-text-tertiary, #64748b)',
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Challenge List */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 68, borderRadius: 10 }} />
              ))}
            </div>
          ) : availableChallenges.length === 0 ? (
            /* Clean Empty State - No giant icons, no loud banners */
            <div
              style={{
                textAlign: 'center',
                padding: '44px 20px',
                background: 'var(--color-surface, #ffffff)',
                borderRadius: 12,
                border: '1px solid var(--color-border-subtle, #f1f5f9)',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary, #1e293b)', margin: '0 0 6px 0' }}>
                Belum ada challenge untuk {fieldName} ({levelName})
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary, #64748b)', maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.5 }}>
                Tantangan yang dibuat di menu Challenge Bank dengan bidang dan level yang sama akan muncul otomatis di sini.
              </p>
              <Link
                href="/admin/challenges"
                target="_blank"
                style={{
                  display: 'inline-block',
                  padding: '7px 14px',
                  borderRadius: 7,
                  border: '1px solid var(--color-primary, #018556)',
                  color: 'var(--color-primary, #018556)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: 'transparent',
                }}
              >
                Buka Challenge Bank
              </Link>
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-tertiary, #64748b)', fontSize: '13px' }}>
              Tidak ada challenge yang cocok dengan pencarian "{search}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredChallenges.map((ch) => {
                const isSelected = selectedMap[ch.id] !== undefined
                const unlockPct = selectedMap[ch.id] ?? 0

                return (
                  <div
                    key={ch.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: isSelected
                        ? '1px solid var(--color-primary, #018556)'
                        : '1px solid var(--color-border-subtle, #e2e8f0)',
                      background: isSelected
                        ? 'rgba(1, 133, 86, 0.02)'
                        : 'var(--color-surface, #ffffff)',
                      transition: 'border-color 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            border: isSelected ? 'none' : '1.5px solid var(--color-border, #cbd5e1)',
                            background: isSelected ? 'var(--color-primary, #018556)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 2,
                            flexShrink: 0,
                            transition: 'all 0.12s',
                          }}
                          onClick={() => toggleSelect(ch.id)}
                        >
                          {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} />}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--color-text-tertiary, #64748b)',
                              }}
                            >
                              {ch.type === 'QUIZ' ? 'Kuis' : 'Proyek'} · {ch.xpReward} XP
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #0f172a)', lineHeight: 1.35 }}>
                            {ch.title}
                          </div>

                          {ch.description && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: 'var(--color-text-secondary, #64748b)',
                                marginTop: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
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

                    {/* Unlock Percentage Setting (Only if selected) - Clean minimalist row */}
                    {isSelected && (
                      <div
                        style={{
                          padding: '8px 10px',
                          background: 'var(--color-bg, #f8fafc)',
                          borderRadius: 7,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8,
                          marginLeft: 28,
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary, #475569)' }}>
                          Buka di progres:
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {PRESET_PERCENTAGES.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setProgress(ch.id, preset)}
                              style={{
                                padding: '2px 8px',
                                borderRadius: 5,
                                border: unlockPct === preset
                                  ? '1px solid var(--color-primary, #018556)'
                                  : '1px solid var(--color-border, #e2e8f0)',
                                background: unlockPct === preset
                                  ? 'var(--color-primary, #018556)'
                                  : '#ffffff',
                                color: unlockPct === preset ? '#ffffff' : 'var(--color-text-secondary, #475569)',
                                fontSize: '11px',
                                fontWeight: 600,
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

        {/* Footer - Ultra Clean */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--color-border-subtle, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #64748b)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>{selectedCount}</span> dipilih
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 14px',
                borderRadius: 7,
                border: '1px solid var(--color-border, #e2e8f0)',
                background: 'transparent',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-text-secondary, #475569)',
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
                padding: '7px 16px',
                borderRadius: 7,
                border: 'none',
                background: 'var(--color-primary, #018556)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: saveMutation.isPending ? 0.7 : 1,
              }}
            >
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
