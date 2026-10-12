'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import api from '@/lib/axios'
import { ROUTES, LEVEL_LABELS, FIELD_LABELS } from '@/lib/utils'

interface ChallengeOption { id: string; text: string }
interface ChallengeQuestion {
  id: string; question: string; imageUrl?: string; orderIndex: number
  options: ChallengeOption[]
}
interface ChallengeDetail {
  id: string; title: string; description: string; type: string; field: string; level: string
  xpReward: number; passingScore: number; isCompleted?: boolean; xpClaimed?: boolean; questions: ChallengeQuestion[]
}

interface SubmitResult {
  score: number
  passed: boolean | null
  correct: number
  totalQuestions: number
  xpEarned: number
  isFirstClear?: boolean
  alreadyAwarded?: boolean
  type?: string
}

type Phase = 'quiz' | 'result'

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [linkUrl, setLinkUrl] = useState('')
  const [answerText, setAnswerText] = useState('')
  const [phase, setPhase] = useState<Phase>('quiz')
  const [result, setResult] = useState<SubmitResult | null>(null)

  const { data: challenge, isLoading, error } = useQuery<ChallengeDetail>({
    queryKey: ['challenge', id],
    queryFn: () => api.get(`/challenges/${id}`).then((r) => r.data.data),
    retry: false,
  })

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/challenges/${id}/submit`, 
      challenge?.type === 'PROJECT' ? { linkUrl, answer: answerText } : { answers }
    ).then((r) => r.data.data),
    onSuccess: (data: SubmitResult) => {
      setResult(data)
      setPhase('result')
    },
  })

  if (isLoading) return (
    <div style={{ maxWidth: 640, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
    </div>
  )

  // ── Error state: 403 (belum beli kelas) atau error lainnya ────────
  if (error || !challenge) {
    const errObj = error as any
    const statusCode = errObj?.response?.status
    const message = errObj?.response?.data?.message || 'Tantangan tidak dapat diakses saat ini.'

    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }} className="animate-fade-in">
        <div style={{ padding: '36px 28px', background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
            {statusCode === 403 ? 'Tantangan Terkunci' : 'Tidak Dapat Diakses'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: 20 }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => router.push(ROUTES.CHALLENGES)}
              style={{ padding: '9px 16px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              Kembali
            </button>

            {statusCode === 403 && (
              <Link href={ROUTES.BOOTCAMP_LIST} style={{ textDecoration: 'none' }}>
                <button
                  style={{ padding: '9px 16px', background: 'var(--color-primary, #018556)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  Lihat Katalog Kelas
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  const questions = challenge.questions || []
  const currentQ = questions[currentQIdx]
  const totalQ = questions.length
  const answeredCount = Object.keys(answers).length
  const isLastQ = currentQIdx === totalQ - 1

  if (challenge.type !== 'PROJECT' && !currentQ) return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Belum ada soal untuk tantangan ini.</p>
      <button onClick={() => router.push(ROUTES.CHALLENGES)} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        Kembali
      </button>
    </div>
  )

  // ── Result screen ───────────────────────────────────────
  if (phase === 'result' && result) {
    const isFirstTimePass = result.passed && (result.isFirstClear ?? (result.xpEarned > 0))
    const isRetakePass = result.passed && !isFirstTimePass

    return (
      <div style={{ maxWidth: 460, margin: '40px auto' }} className="animate-fade-in">
        <div style={{ padding: '36px 28px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {result.type === 'PROJECT' 
              ? 'Proyek Terkirim' 
              : isFirstTimePass 
                ? 'Tantangan Selesai' 
                : isRetakePass 
                  ? 'Latihan Selesai' 
                  : 'Coba Lagi'}
          </h1>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: 20 }}>
            {result.type === 'PROJECT' 
              ? 'Jawaban proyekmu telah dikirim dan menunggu penilaian mentor.'
              : isFirstTimePass
                ? `Selamat! Kamu berhasil menyelesaikan tantangan "${challenge.title}" dan mendapatkan XP.`
                : isRetakePass
                  ? `Latihan untuk "${challenge.title}" selesai dengan skor ${result.score}%.`
                  : `Skor kelulusan adalah ${challenge.passingScore}%. Tetap semangat dan coba lagi!`}
          </p>

          {result.type !== 'PROJECT' && (
            <>
              {/* Score block */}
              <div style={{ padding: '16px 0', marginBottom: 16 }}>
                <div style={{ fontSize: '44px', fontWeight: 800, color: result.passed ? 'var(--color-primary, #018556)' : '#DC2626', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {result.score}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 4, fontWeight: 500 }}>
                  Skor Akhir
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Benar', value: result.correct, color: 'var(--color-text-primary)' },
                  { label: 'Salah', value: result.totalQuestions - result.correct, color: 'var(--color-text-secondary)' },
                  { label: 'XP', value: isFirstTimePass ? `+${result.xpEarned}` : '0', color: isFirstTimePass ? 'var(--color-primary, #018556)' : 'var(--color-text-secondary)' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '10px', background: 'var(--color-bg)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Banner XP */}
              {isFirstTimePass && (
                <div style={{ padding: '9px 12px', background: 'rgba(1, 133, 86, 0.08)', borderRadius: '8px', marginBottom: 20, fontSize: '12px', fontWeight: 600, color: 'var(--color-primary, #018556)' }}>
                  +{result.xpEarned} XP ditambahkan ke profilmu
                </div>
              )}

              {isRetakePass && (
                <div style={{ padding: '9px 12px', background: 'var(--color-bg)', borderRadius: '8px', marginBottom: 20, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  XP didapat pada pengerjaan pertama. Latihan ini bebas diulang kapan saja.
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => router.push(ROUTES.CHALLENGES)} 
              style={{ flex: 1, padding: '10px 16px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              Kembali ke Bank
            </button>

            {result.type !== 'PROJECT' && (
              <button 
                onClick={() => { 
                  setPhase('quiz')
                  setAnswers({})
                  setCurrentQIdx(0)
                  setResult(null) 
                }} 
                style={{ flex: 1, padding: '10px 16px', background: 'var(--color-primary, #018556)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                {result.passed ? 'Ulangi Latihan' : 'Coba Lagi'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Project Screen ───────────────────────────────────────
  if (challenge.type === 'PROJECT') {
    return (
      <div style={{ maxWidth: 640, margin: '24px auto' }} className="animate-fade-in">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
            {FIELD_LABELS[challenge.field] || challenge.field} · {LEVEL_LABELS[challenge.level] || challenge.level}
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>{challenge.title}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{challenge.description}</p>
        </div>

        <div style={{ padding: '22px', background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', marginBottom: 20 }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 16 }}>Kumpulkan Jawaban Proyek</h2>
          
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Tautan (URL)</label>
            <input 
              type="url" 
              className="input" 
              placeholder="https://github.com/... atau https://figma.com/..." 
              value={linkUrl} 
              onChange={(e) => setLinkUrl(e.target.value)} 
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Catatan Tambahan (Opsional)</label>
            <textarea 
              rows={4}
              placeholder="Tuliskan catatan pengerjaan..." 
              value={answerText} 
              onChange={(e) => setAnswerText(e.target.value)} 
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => router.push(ROUTES.CHALLENGES)} 
            style={{ flex: 1, padding: '10px 18px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            Batal
          </button>
          <button 
            onClick={() => submitMutation.mutate()} 
            style={{ flex: 1, padding: '10px 18px', background: 'var(--color-primary, #018556)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: (submitMutation.isPending || (!linkUrl && !answerText)) ? 'not-allowed' : 'pointer', opacity: (submitMutation.isPending || (!linkUrl && !answerText)) ? 0.5 : 1 }}
            disabled={submitMutation.isPending || (!linkUrl && !answerText)}
          >
            {submitMutation.isPending ? 'Mengirim...' : 'Kirim Proyek'}
          </button>
        </div>
      </div>
    )
  }

  // ── Quiz Screen ─────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640, margin: '24px auto', paddingBottom: '48px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
              {FIELD_LABELS[challenge.field] || challenge.field} · {LEVEL_LABELS[challenge.level] || challenge.level}
            </span>
            {challenge.isCompleted && (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', background: 'rgba(1, 133, 86, 0.08)', borderRadius: '6px', color: 'var(--color-primary, #018556)' }}>
                Selesai (Latihan Ulang)
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {currentQIdx + 1} <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>/ {totalQ}</span>
          </div>
        </div>

        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px 0', color: 'var(--color-text-primary)' }}>
          {challenge.title}
        </h1>

        {/* Minimal Progress Bar */}
        <div style={{ height: 4, width: '100%', background: 'var(--color-border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(answeredCount / totalQ) * 100}%`, background: 'var(--color-primary, #018556)', transition: 'width 0.2s ease' }} />
        </div>
      </div>

      {/* Question Card */}
      <div style={{ padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '14px', marginBottom: 16 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
          Soal {currentQIdx + 1}
        </div>
        <p style={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-primary)', margin: '0 0 20px 0' }}>
          {currentQ.question}
        </p>

        {currentQ.imageUrl && (
          <img src={currentQ.imageUrl} alt="Ilustrasi" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-border-subtle)', marginBottom: 18, maxHeight: 260, objectFit: 'contain' }} />
        )}

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(currentQ.options || []).map((option, idx) => {
            const isSelected = answers[currentQ.id] === option.id
            return (
              <button
                key={option.id}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: option.id }))}
                style={{
                  padding: '14px 16px',
                  border: `1px solid ${isSelected ? 'var(--color-primary, #018556)' : 'var(--color-border-subtle)'}`,
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(1, 133, 86, 0.04)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: `1px solid ${isSelected ? 'var(--color-primary, #018556)' : 'var(--color-border-subtle)'}`,
                  background: isSelected ? 'var(--color-primary, #018556)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600,
                  color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                }}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, color: 'var(--color-text-primary)' }}>
                  {option.text}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
          disabled={currentQIdx === 0}
          style={{ padding: '9px 16px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: currentQIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentQIdx === 0 ? 0.4 : 1 }}
        >
          Sebelumnya
        </button>

        {/* Number dots */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQIdx(i)}
              style={{
                width: 28, height: 28, borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 600,
                background: i === currentQIdx ? 'var(--color-primary, #018556)' : answers[q.id] ? 'rgba(1, 133, 86, 0.12)' : 'var(--color-bg)',
                color: i === currentQIdx ? '#fff' : answers[q.id] ? 'var(--color-primary, #018556)' : 'var(--color-text-secondary)',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {isLastQ ? (
          <button
            onClick={() => {
              if (answeredCount < totalQ) {
                const unanswered = totalQ - answeredCount
                if (!confirm(`Masih ada ${unanswered} soal yang belum dijawab. Yakin ingin mengumpulkan?`)) return
              }
              submitMutation.mutate()
            }}
            disabled={submitMutation.isPending}
            style={{ padding: '9px 18px', background: 'var(--color-primary, #018556)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: submitMutation.isPending ? 'not-allowed' : 'pointer', opacity: submitMutation.isPending ? 0.5 : 1 }}
          >
            {submitMutation.isPending ? 'Mengirim...' : 'Selesai'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQIdx((i) => Math.min(totalQ - 1, i + 1))}
            style={{ padding: '9px 16px', background: 'var(--color-primary, #018556)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            Selanjutnya
          </button>
        )}
      </div>
    </div>
  )
}
