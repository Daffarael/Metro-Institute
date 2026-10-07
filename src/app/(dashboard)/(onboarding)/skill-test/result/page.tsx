'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ChevronRight, Zap, Palette, Terminal, Server, Smartphone } from 'lucide-react'
import { motion } from 'motion/react'
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

const FIELD_ICONS: Record<string, any> = {
  UI_UX: <Palette size={24} strokeWidth={2.5} />,
  FRONTEND: <Terminal size={24} strokeWidth={2.5} />,
  BACKEND: <Server size={24} strokeWidth={2.5} />,
  MOBILE: <Smartphone size={24} strokeWidth={2.5} />,
}

const FIELD_DESCRIPTIONS: Record<string, string> = {
  UI_UX: 'Kamu cocok menjadi UI/UX Designer. Karir yang banyak dicari: Product Designer, UX Researcher, UI Engineer.',
  FRONTEND: 'Kamu punya potensi sebagai Frontend Developer. Kuasai React, Next.js, dan buat tampilan web yang luar biasa.',
  BACKEND: 'Backend Developer adalah jalanmu. Bangun sistem yang kuat dengan Node.js, PostgreSQL, dan arsitektur scalable.',
  MOBILE: 'Mobile Developer ada di genggamanmu. Flutter membuka jalan ke Android dan iOS sekaligus.',
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
  const maxScore = fields[0]?.[1] ?? 0

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#f9f9f9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '48px 20px 64px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: 8, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-primary-light)',
            border: '1px solid var(--border-color)'
          }}>
            <img src="/images/logo.jpg" alt="Metro Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: '#111' }}>Metro Institute</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>
            Hasil Skill Test
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#111', lineHeight: 1.2, margin: 0 }}>
            {result.tiedFields ? 'Bakatmu Seimbang!' : 'Bidang Terbaikmu'}
          </h1>
          <p style={{ fontSize: 14, color: '#777', marginTop: 8, lineHeight: 1.6 }}>
            {result.tiedFields
              ? 'Skor tertinggimu seri di beberapa bidang. Pilih yang paling menarik untukmu.'
              : 'Berdasarkan jawabanmu, ini jalur yang paling sesuai dengan potensimu.'}
          </p>
        </div>

        {/* XP Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--color-primary-xlight)', border: '1px solid var(--color-primary-light)',
            borderRadius: 99, padding: '8px 16px',
          }}>
            <Zap size={16} color="var(--color-primary)" fill="var(--color-primary)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>+{result.xpEarned} XP diperoleh</span>
          </div>
        </div>

        {/* Top Recommendation */}
        {!result.tiedFields ? (
          <div style={{
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: 20,
            padding: '24px 20px',
            marginBottom: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#bbb', marginBottom: 8 }}>
                  Rekomendasi Utama
                </p>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--color-primary)' }}>{FIELD_ICONS[result.topField]}</span>
                  {FIELD_LABELS[result.topField]}
                </h2>
              </div>
              <div style={{
                background: 'var(--color-primary)', color: '#fff',
                borderRadius: 12, padding: '8px 14px',
                fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em',
                flexShrink: 0,
              }}>
                {result.scores[result.topField]}%
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.65, margin: '0 0 24px' }}>
              {FIELD_DESCRIPTIONS[result.topField]}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectFieldMutation.mutate(result.topField)}
              disabled={selectFieldMutation.isPending}
              style={{
                width: '100%', height: 48,
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                letterSpacing: '-0.01em',
                opacity: selectFieldMutation.isPending ? 0.6 : 1,
              }}
            >
              {selectFieldMutation.isPending ? 'Menyimpan...' : 'Mulai Belajar'}
            </motion.button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {result.tiedFields.map((f) => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => selectFieldMutation.mutate(f)}
                disabled={selectFieldMutation.isPending}
                style={{
                  background: '#fff', border: '1px solid #e8e8e8',
                  borderRadius: 16, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', textAlign: 'left',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.01)'
                }}
              >
                <div style={{ color: 'var(--color-primary)' }}>{FIELD_ICONS[f]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{FIELD_LABELS[f]}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{result.scores[f]}% skor kamu</div>
                </div>
                <ChevronRight size={18} color="#bbb" />
              </motion.button>
            ))}
          </div>
        )}

        {/* All Scores */}
        <div style={{
          background: '#fff',
          border: '1px solid #e8e8e8',
          borderRadius: 20,
          padding: '24px 20px',
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#bbb', marginBottom: 20 }}>
            Skor Per Bidang
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {fields.map(([field, score]) => {
              const isTop = score === maxScore
              return (
                <div key={field}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: isTop ? 'var(--color-primary)' : '#999' }}>{FIELD_ICONS[field]}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{FIELD_LABELS[field]}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isTop ? 'var(--color-primary)' : '#999' }}>{score}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${score}%`, height: '100%',
                      background: isTop ? 'var(--color-primary)' : '#ddd',
                      borderRadius: 99, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Other options */}
        {!result.tiedFields && (
          <>
            <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginBottom: 16 }}>
              Atau pilih bidang lain yang kamu minati
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {fields.slice(1).map(([field]) => (
                <motion.button
                  key={field}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectFieldMutation.mutate(field)}
                  disabled={selectFieldMutation.isPending}
                  style={{
                    background: '#fff', border: '1px solid #e8e8e8',
                    borderRadius: 14, padding: '16px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ color: '#888' }}>{FIELD_ICONS[field]}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{FIELD_LABELS[field]}</span>
                </motion.button>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

