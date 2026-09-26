'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight, Zap } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES, FIELD_LABELS } from '@/lib/utils'
import { Field } from '@/stores/auth.store'

interface SkillResult {
  scores: Record<string, number>
  topField: Field
  recommendation: string
  xpEarned: number
  tiedFields: Field[] | null
}

const FIELD_ICONS: Record<string, string> = {
  UI_UX: '🎨',
  FRONTEND: '💻',
  BACKEND: '⚙️',
  MOBILE: '📱',
}

const FIELD_DESCRIPTIONS: Record<string, string> = {
  UI_UX: 'Kamu cocok menjadi UI/UX Designer! Karir yang banyak dicari: Product Designer, UX Researcher, UI Engineer.',
  FRONTEND: 'Kamu punya potensi sebagai Frontend Developer! Kuasai React, Next.js, dan buat tampilan web yang luar biasa.',
  BACKEND: 'Backend Developer adalah jalanmu! Bangun sistem yang kuat dengan Node.js, PostgreSQL, dan arsitektur scalable.',
  MOBILE: 'Mobile Developer ada di genggamanmu! Flutter membuka jalan ke Android dan iOS sekaligus.',
}

export default function SkillTestResultPage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()

  const { data: result, isLoading } = useQuery<SkillResult>({
    queryKey: ['skill-test-result'],
    queryFn: () => api.get('/skill-test/result').then((r) => r.data.data),
  })

  const selectFieldMutation = useMutation({
    mutationFn: (field: Field) =>
      api.patch('/users/me', { selectedField: field }).then((r) => r.data),
    onSuccess: (_, field) => {
      updateUser({ selectedField: field })
      router.push(ROUTES.BASECAMP)
    },
    onError: () => toast.error('Gagal menyimpan pilihan. Coba lagi.'),
  })

  if (isLoading || !result) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="spinner spinner-lg" />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Menganalisis hasil testmu...</p>
      </div>
    )
  }

  const fields = Object.entries(result.scores).sort(([, a], [, b]) => b - a) as [Field, number][]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', padding: 'var(--space-6)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Header */}
        <div className="text-center animate-fade-in-up" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ fontSize: 56, marginBottom: 'var(--space-4)' }}>🎉</div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
            Hasilmu Sudah Siap!
          </h1>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-xp-bg)', borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-xp)22',
          }}>
            <Zap size={14} color="var(--color-xp)" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-xp)' }}>
              +{result.xpEarned} XP diperoleh!
            </span>
          </div>
        </div>

        {/* Top recommendation or Tie-breaker */}
        {result.tiedFields ? (
          <div className="card animate-fade-in-up" style={{
            padding: 'var(--space-6)', marginBottom: 'var(--space-6)',
            border: '2px solid var(--color-accent-dark)',
            background: 'var(--color-surface)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
              <div style={{ fontSize: 36, marginBottom: 'var(--space-2)' }}>⚖️</div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Bakatmu Sangat Seimbang!
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                Skor tertinggimu seri di beberapa bidang ({result.scores[result.tiedFields[0]]}%). Dari pilihan di bawah, mana yang lebih bikin kamu penasaran untuk dipelajari duluan?
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
              {result.tiedFields.map((f) => (
                <button
                  key={f}
                  onClick={() => selectFieldMutation.mutate(f)}
                  disabled={selectFieldMutation.isPending}
                  className="btn btn-secondary"
                  style={{
                    padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-start',
                    gap: 'var(--space-4)', background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <span style={{ fontSize: 32 }}>{FIELD_ICONS[f]}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {FIELD_LABELS[f]}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                      Pilih bidang ini
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--color-text-tertiary)' }}>
                    <ChevronRight size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="card animate-fade-in-up" style={{
            padding: 'var(--space-6)', marginBottom: 'var(--space-6)',
            border: '2px solid var(--color-primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 36 }}>{FIELD_ICONS[result.topField]}</div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 2 }}>Bidang yang paling cocok untukmu</div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {FIELD_LABELS[result.topField]}
                </h2>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{
                  fontSize: 'var(--text-2xl)', fontWeight: 800,
                  color: 'var(--color-primary)',
                }}>{result.scores[result.topField]}%</span>
              </div>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-4)' }}>
              {FIELD_DESCRIPTIONS[result.topField]}
            </p>
            <button
              onClick={() => selectFieldMutation.mutate(result.topField)}
              disabled={selectFieldMutation.isPending}
              className={`btn btn-primary btn-full ${selectFieldMutation.isPending ? 'btn-loading' : ''}`}
            >
              {!selectFieldMutation.isPending && <>Pilih Bidang Ini & Mulai Belajar <ChevronRight size={16} /></>}
            </button>
          </div>
        )}

        {/* All scores */}
        <div className="card animate-fade-in-up" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Skor Semua Bidang</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {fields.map(([field, score], idx) => {
              const isTopScore = score === result.scores[result.tiedFields ? result.tiedFields[0] : result.topField]
              return (
                <div key={field}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontSize: 16 }}>{FIELD_ICONS[field]}</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{FIELD_LABELS[field]}</span>
                      {isTopScore && <span className="badge badge-primary" style={{ fontSize: '10px' }}>Terbaik</span>}
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: isTopScore ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{score}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${score}%`, background: isTopScore ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alternative choices (hide if tied, because they already have a choice above) */}
        {!result.tiedFields && (
          <>
            <p className="text-center text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              Atau pilih bidang lain yang kamu minati:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {fields.slice(1).map(([field]) => (
                <button
                  key={field}
                  onClick={() => selectFieldMutation.mutate(field)}
                  disabled={selectFieldMutation.isPending}
                  className="btn btn-secondary"
                  style={{ gap: 'var(--space-2)' }}
                >
                  <span>{FIELD_ICONS[field]}</span>
                  <span style={{ fontSize: 'var(--text-xs)' }}>{FIELD_LABELS[field]}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
