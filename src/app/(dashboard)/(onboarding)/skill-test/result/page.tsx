'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore, Field } from '@/stores/auth.store'
import { ROUTES, FIELD_LABELS } from '@/lib/utils'

interface SkillResult {
  scores: Record<string, number>
  topField: Field
  recommendation: string
  xpEarned: number
  tiedFields: Field[] | null
}

const FIELD_DESCRIPTIONS: Record<string, string> = {
  UI_UX: 'Kamu memiliki insting visual dan empati yang baik terhadap pengguna. Karir yang ideal: Product Designer, UX Researcher, atau UI Engineer.',
  FRONTEND: 'Kamu memiliki logika terstruktur dan ketertarikan pada interaksi visual. Kuasai React & Next.js untuk membangun antarmuka web modern.',
  BACKEND: 'Pemikiran sistematis adalah kekuatanmu. Bangun fondasi aplikasi yang kokoh, arsitektur data yang skalabel, dan API berkinerja tinggi.',
  MOBILE: 'Kamu tertarik pada produk yang digunakan langsung di genggaman. Pelajari pengembangan aplikasi native atau cross-platform (Flutter/React Native).',
}

export default function SkillTestResultPage() {
  const router = useRouter()
  const { updateUser } = useAuthStore()

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
        <p style={{ color: '#999', fontSize: 14 }}>Memproses hasil analisismu...</p>
      </div>
    )
  }

  const fields = Object.entries(result.scores).sort(([, a], [, b]) => b - a) as [Field, number][]

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '64px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Minimal Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 56 }}>
          <img src="/images/logo.jpg" alt="Metro Logo" style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }} />
          <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em', color: '#111' }}>Metro Institute</span>
        </div>

        {/* Top Recommendation (Typography-first) */}
        {!result.tiedFields ? (
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#888', marginBottom: 12 }}>
              Hasil Analisis &middot; {result.scores[result.topField]}% Kecocokan
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1, margin: '0 0 16px 0' }}>
              {FIELD_LABELS[result.topField]}
            </h1>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, margin: '0 auto', maxWidth: 380 }}>
              {FIELD_DESCRIPTIONS[result.topField]}
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#888', marginBottom: 12 }}>
              Hasil Analisis
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1, margin: '0 0 16px 0' }}>
              Potensimu Seimbang
            </h1>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, margin: '0 auto', maxWidth: 380 }}>
              Skor tertinggimu seri di beberapa bidang. Silakan pilih jalur yang paling sesuai dengan minat utamamu saat ini.
            </p>
          </div>
        )}

        {/* Main Action */}
        {!result.tiedFields ? (
          <div style={{ marginBottom: 48 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectFieldMutation.mutate(result.topField)}
              disabled={selectFieldMutation.isPending}
              style={{
                width: '100%', height: 50,
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '-0.01em',
                opacity: selectFieldMutation.isPending ? 0.6 : 1,
              }}
            >
              {selectFieldMutation.isPending ? 'Menyimpan...' : `Mulai Jalur ${FIELD_LABELS[result.topField]}`}
            </motion.button>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 16 }}>
              +{result.xpEarned} XP diperoleh dari test ini
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
            {result.tiedFields.map((f) => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => selectFieldMutation.mutate(f)}
                disabled={selectFieldMutation.isPending}
                style={{
                  width: '100%', height: 56,
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 24px',
                }}
              >
                <span>Mulai Jalur {FIELD_LABELS[f]}</span>
                <span style={{ opacity: 0.8, fontWeight: 400 }}>{result.scores[f]}%</span>
              </motion.button>
            ))}
          </div>
        )}

        <div style={{ height: 1, background: '#eaeaea', width: '100%', margin: '0 0 40px 0' }} />

        {/* All Scores (Minimalist layout) */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#aaa', marginBottom: 24 }}>
            Rincian Skor Kecocokan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {fields.map(([field, score]) => {
              const isTop = !result.tiedFields && field === result.topField
              return (
                <div key={field}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: isTop ? 600 : 500, color: isTop ? '#111' : '#555' }}>
                      {FIELD_LABELS[field]}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: isTop ? 600 : 500, color: isTop ? '#111' : '#888' }}>
                      {score}%
                    </span>
                  </div>
                  <div style={{ height: 3, background: '#f5f5f5', borderRadius: 99, overflow: 'hidden' }}>
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

        {/* Alternative options */}
        {!result.tiedFields && (
          <div>
             <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#aaa', marginBottom: 16 }}>
              Atau pilih jalur lain
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fields.slice(1).map(([field, score]) => (
                <button
                  key={field}
                  onClick={() => selectFieldMutation.mutate(field)}
                  disabled={selectFieldMutation.isPending}
                  style={{
                    background: 'transparent',
                    border: '1px solid #eaeaea',
                    borderRadius: 10, padding: '14px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#ccc'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#eaeaea'}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{FIELD_LABELS[field]}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{score}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

