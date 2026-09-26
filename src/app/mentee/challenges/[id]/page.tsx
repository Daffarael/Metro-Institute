'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Zap, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, LEVEL_LABELS, FIELD_LABELS } from '@/lib/utils'

interface ChallengeOption { id: string; text: string }
interface ChallengeQuestion {
  id: string; question: string; imageUrl?: string; orderIndex: number
  options: ChallengeOption[]
}
interface ChallengeDetail {
  id: string; title: string; type: string; field: string; level: string
  xpReward: number; passingScore: number; questions: ChallengeQuestion[]
}

type Phase = 'quiz' | 'result'

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<Phase>('quiz')
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; totalQuestions: number; xpEarned: number } | null>(null)

  const { data: challenge, isLoading } = useQuery<ChallengeDetail>({
    queryKey: ['challenge', id],
    queryFn: () => api.get(`/challenges/${id}`).then((r) => r.data.data),
  })

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/challenges/${id}/submit`, { answers }).then((r) => r.data.data),
    onSuccess: (data) => {
      setResult(data)
      setPhase('result')
    },
  })

  if (isLoading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
    </div>
  )
  if (!challenge) return null

  const questions = challenge.questions
  const currentQ = questions[currentQIdx]
  const totalQ = questions.length
  const answeredCount = Object.keys(answers).length
  const progress = Math.round((answeredCount / totalQ) * 100)
  const isLastQ = currentQIdx === totalQ - 1

  // ── Result screen ───────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }} className="animate-fade-in">
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          {/* Icon */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            {result.passed ? (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle2 size={40} color="var(--color-primary)" />
              </div>
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <XCircle size={40} color="#EF4444" />
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
            {result.passed ? '🎉 Kamu Berhasil!' : 'Hampir! Coba Lagi'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
            {result.passed
              ? `Selamat! Kamu lulus challenge "${challenge.title}".`
              : `Skor minimumnya adalah ${challenge.passingScore}%. Jangan menyerah!`}
          </p>

          {/* Score circle */}
          <div style={{
            width: 120, height: 120, borderRadius: '50%', margin: '0 auto var(--space-6)',
            background: `conic-gradient(${result.passed ? 'var(--color-primary)' : '#EF4444'} ${result.score * 3.6}deg, var(--color-border) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: result.passed ? 'var(--color-primary)' : '#EF4444' }}>{result.score}%</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Skor</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            {[
              { label: 'Benar', value: result.correct, color: 'var(--color-primary)' },
              { label: 'Salah', value: result.totalQuestions - result.correct, color: '#EF4444' },
              { label: 'XP', value: `+${result.xpEarned}`, color: 'var(--color-xp)' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* XP banner if passed */}
          {result.passed && result.xpEarned > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-xp-bg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
              <Zap size={16} color="var(--color-xp)" />
              <span style={{ fontWeight: 700, color: 'var(--color-xp)' }}>+{result.xpEarned} XP Earned!</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button onClick={() => router.push(ROUTES.CHALLENGES)} className="btn btn-secondary" style={{ flex: 1 }}>
              ← Kembali
            </button>
            {!result.passed && (
              <button onClick={() => { setPhase('quiz'); setAnswers({}); setCurrentQIdx(0); setResult(null) }} className="btn btn-primary" style={{ flex: 1 }}>
                Coba Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Quiz screen ─────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
              {FIELD_LABELS[challenge.field]} · {LEVEL_LABELS[challenge.level]}
            </div>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>{challenge.title}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{currentQIdx + 1} / {totalQ}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{answeredCount} dijawab</div>
          </div>
        </div>
        {/* Progress */}
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${((currentQIdx) / totalQ) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Question card */}
      <div className="card card-body" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
          Pertanyaan {currentQIdx + 1}
        </div>
        <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-5)' }}>
          {currentQ.question}
        </p>
        {currentQ.imageUrl && (
          <img src={currentQ.imageUrl} alt="Ilustrasi soal" style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', maxHeight: 280, objectFit: 'contain' }} />
        )}

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {currentQ.options.map((option, idx) => {
            const isSelected = answers[currentQ.id] === option.id
            return (
              <button
                key={option.id}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: option.id }))}
                style={{
                  padding: 'var(--space-4)',
                  border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  background: isSelected ? 'var(--color-primary-xlight)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  transition: 'all var(--transition-fast)',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700,
                  color: isSelected ? 'white' : 'var(--color-text-tertiary)',
                  transition: 'all var(--transition-fast)',
                }}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                  {option.text}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
          disabled={currentQIdx === 0}
          className="btn btn-secondary"
          style={{ gap: 'var(--space-2)' }}
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQIdx(i)}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 600,
                background: i === currentQIdx ? 'var(--color-primary)' : answers[q.id] ? 'var(--color-primary-light)' : 'var(--color-border)',
                color: i === currentQIdx ? 'white' : answers[q.id] ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
                if (!confirm(`Masih ada ${unanswered} soal yang belum dijawab. Yakin ingin submit?`)) return
              }
              submitMutation.mutate()
            }}
            disabled={submitMutation.isPending}
            className={`btn btn-primary ${submitMutation.isPending ? 'btn-loading' : ''}`}
            style={{ gap: 'var(--space-2)' }}
          >
            {!submitMutation.isPending && <><CheckCircle2 size={16} /> Submit</>}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQIdx((i) => Math.min(totalQ - 1, i + 1))}
            className="btn btn-primary"
            style={{ gap: 'var(--space-2)' }}
          >
            Selanjutnya <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Warning if not all answered */}
      {isLastQ && answeredCount < totalQ && (
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: '#D97706', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={15} />
          {totalQ - answeredCount} soal belum dijawab
        </div>
      )}
    </div>
  )
}
