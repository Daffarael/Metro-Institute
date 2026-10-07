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
              Hasil Analisis
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
              Skor analisismu menunjukkan kecocokan pada beberapa bidang sekaligus. Eksplorasi sekarang untuk menemukan minat utamamu.
            </p>
          </div>
        )}

        {/* Main Action */}
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
            {selectFieldMutation.isPending ? 'Menyimpan...' : 'Eksplorasi Sekarang'}
          </motion.button>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 16 }}>
            +{result.xpEarned} XP diperoleh dari test ini
          </p>
        </div>



      </div>
    </div>
  )
}

