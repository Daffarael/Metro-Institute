'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  CheckCircle2, XCircle, ChevronRight, ChevronLeft, AlertCircle, 
  Lock, ArrowLeft, RefreshCw, Trophy, Sparkles, GraduationCap
} from 'lucide-react'
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
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
    </div>
  )

  // ── Error state: misal 403 (belum beli kelas) atau 429 (cooldown) ────────
  if (error || !challenge) {
    const errObj = error as any
    const statusCode = errObj?.response?.status
    const message = errObj?.response?.data?.message || 'Tantangan tidak dapat diakses saat ini.'

    return (
      <div style={{ maxWidth: 540, margin: '40px auto', textAlign: 'center' }} className="animate-fade-in">
        <div className="card" style={{ padding: '36px 28px', border: '1px solid var(--color-border)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: statusCode === 403 ? 'rgba(234, 88, 12, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            {statusCode === 403 ? <Lock size={32} color="#EA580C" /> : <AlertCircle size={32} color="#EF4444" />}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: 8, color: 'var(--color-text-primary)' }}>
            {statusCode === 403 ? 'Tantangan Terkunci' : 'Tidak Dapat Diakses'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: 24 }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => router.push(ROUTES.CHALLENGES)}
              style={{ padding: '10px 18px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={15} /> Kembali ke Challenge Bank
            </motion.button>

            {statusCode === 403 && (
              <Link href={ROUTES.BOOTCAMP_LIST} style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: '10px 18px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <GraduationCap size={16} /> Lihat Kelas Tersedia
                </motion.button>
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
  const progress = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0
  const isLastQ = currentQIdx === totalQ - 1

  if (challenge.type !== 'PROJECT' && !currentQ) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>Belum ada soal untuk challenge ini.</p>
      <button onClick={() => router.push(ROUTES.CHALLENGES)} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
        Kembali
      </button>
    </div>
  )

  // ── Result screen ───────────────────────────────────────
  if (phase === 'result' && result) {
    const isFirstTimePass = result.passed && (result.isFirstClear ?? (result.xpEarned > 0))
    const isRetakePass = result.passed && !isFirstTimePass

    return (
      <div style={{ maxWidth: 540, margin: '0 auto' }} className="animate-fade-in">
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
          {/* Icon */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            {result.type === 'PROJECT' || result.passed ? (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle2 size={42} color="#16A34A" />
              </div>
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <XCircle size={42} color="#EF4444" />
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
            {result.type === 'PROJECT' 
              ? '🎉 Proyek Terkirim!' 
              : isFirstTimePass 
                ? '🎉 Kamu Berhasil!' 
                : isRetakePass 
                  ? '🎯 Latihan Selesai!' 
                  : 'Hampir! Coba Lagi'}
          </h1>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5, marginBottom: 'var(--space-6)' }}>
            {result.type === 'PROJECT' 
              ? 'Jawaban proyekmu telah dikirim dan sedang menunggu penilaian dari Admin.'
              : isFirstTimePass
                ? `Selamat! Kamu lulus challenge "${challenge.title}" dan mendapatkan XP kelulusan pertamamu.`
                : isRetakePass
                  ? `Kerja bagus! Kamu berhasil menuntaskan tantangan "${challenge.title}" dengan skor ${result.score}%.`
                  : `Skor minimum kelulusan adalah ${challenge.passingScore}%. Tetap semangat!`}
          </p>

          {result.type !== 'PROJECT' && (
            <>
              {/* Score circle */}
              <div style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto var(--space-6)',
                background: `conic-gradient(${result.passed ? '#16A34A' : '#EF4444'} ${result.score * 3.6}deg, var(--color-border) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: result.passed ? '#16A34A' : '#EF4444' }}>{result.score}%</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Skor Akhir</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid-cols-3" style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                {[
                  { label: 'Benar', value: result.correct, color: '#16A34A' },
                  { label: 'Salah', value: result.totalQuestions - result.correct, color: '#EF4444' },
                  { label: 'Poin XP', value: isFirstTimePass ? `+${result.xpEarned}` : '0', color: 'var(--color-xp)' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Banner XP untuk First Clear */}
              {isFirstTimePass && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: 'var(--color-xp-bg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
                  <Trophy size={16} color="var(--color-xp)" />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-xp)' }}>+{result.xpEarned} XP Berhasil Ditambahkan ke Profilmu!</span>
                </div>
              )}

              {/* Banner Retake Info jika sudah pernah lulus sebelumnya */}
              {isRetakePass && (
                <div style={{ padding: '10px 14px', background: 'rgba(37, 99, 235, 0.06)', border: '1px solid rgba(37, 99, 235, 0.15)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  <Sparkles size={14} color="var(--color-primary)" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  <strong>Latihan Ulang:</strong> XP challenge ini sudah kamu klaim pada kelulusan pertama. Kamu bebas mengulang latihan ini kapan saja untuk mengasah pemahamanmu!
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
              onClick={() => router.push(ROUTES.CHALLENGES)} 
              style={{ flex: 1, padding: '11px 18px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              ← Kembali ke Bank Soal
            </motion.button>

            {result.type !== 'PROJECT' && (
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                onClick={() => { 
                  setPhase('quiz')
                  setAnswers({})
                  setCurrentQIdx(0)
                  setResult(null) 
                }} 
                style={{ flex: 1, padding: '11px 18px', background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <RefreshCw size={14} /> {result.passed ? 'Ulangi Latihan' : 'Coba Lagi'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Project Screen ───────────────────────────────────────
  if (challenge.type === 'PROJECT') {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
            {FIELD_LABELS[challenge.field] || challenge.field} · {LEVEL_LABELS[challenge.level] || challenge.level}
          </div>
          <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>{challenge.title}</h1>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{challenge.description}</p>
        </div>

        <div className="card card-body" style={{ marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Kumpulkan Jawaban</h2>
          
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Tautan (URL)</label>
            <input 
              type="url" 
              className="input" 
              placeholder="https://github.com/... atau https://figma.com/..." 
              value={linkUrl} 
              onChange={(e) => setLinkUrl(e.target.value)} 
            />
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Catatan / Penjelasan Tambahan (Opsional)</label>
            <textarea 
              className="input" 
              rows={4}
              placeholder="Tuliskan catatan pengerjaan proyek..." 
              value={answerText} 
              onChange={(e) => setAnswerText(e.target.value)} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push(ROUTES.CHALLENGES)} 
            style={{ flex: 1, padding: '10px 20px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            Batal
          </motion.button>
          <motion.button 
            whileHover={(!submitMutation.isPending && (linkUrl || answerText)) ? { scale: 1.02 } : {}}
            whileTap={(!submitMutation.isPending && (linkUrl || answerText)) ? { scale: 0.98 } : {}}
            onClick={() => submitMutation.mutate()} 
            style={{ flex: 1, padding: '10px 20px', background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', cursor: (submitMutation.isPending || (!linkUrl && !answerText)) ? 'not-allowed' : 'pointer', opacity: (submitMutation.isPending || (!linkUrl && !answerText)) ? 0.5 : 1 }}
            disabled={submitMutation.isPending || (!linkUrl && !answerText)}
          >
            {submitMutation.isPending ? 'Mengirim...' : 'Kirim Proyek'}
          </motion.button>
        </div>
      </div>
    )
  }

  // ── Quiz Screen ─────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 'var(--space-8)' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', background: 'var(--color-bg)', borderRadius: 'var(--radius-full)', color: 'var(--color-text-secondary)' }}>
                {FIELD_LABELS[challenge.field] || challenge.field}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', background: 'var(--color-bg)', borderRadius: 'var(--radius-full)', color: 'var(--color-text-secondary)' }}>
                {LEVEL_LABELS[challenge.level] || challenge.level}
              </span>
              {challenge.isCompleted && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-full)', color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} /> Selesai (Latihan Ulang)
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{challenge.title}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary)' }}>
              {currentQIdx + 1} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>/ {totalQ}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>{answeredCount} dijawab</div>
          </div>
        </div>
        
        {/* Progress */}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div className="progress-bar" style={{ height: 6, background: 'var(--color-border)' }}>
            <div className="progress-bar-fill" style={{ width: `${(answeredCount / totalQ) * 100}%`, background: 'var(--color-primary)' }} />
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="card card-body" style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--color-border)', boxShadow: 'none' }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
          Pertanyaan {currentQIdx + 1}
        </div>
        <p style={{ fontSize: 'var(--text-base)', fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)' }}>
          {currentQ.question}
        </p>
        
        {currentQ.imageUrl && (
          <img src={currentQ.imageUrl} alt="Ilustrasi soal" style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-6)', maxHeight: 280, objectFit: 'contain' }} />
        )}

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {(currentQ.options || []).map((option, idx) => {
            const isSelected = answers[currentQ.id] === option.id
            return (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                key={option.id}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: option.id }))}
                style={{
                  padding: 'var(--space-4)',
                  border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(37, 99, 235, 0.03)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 600,
                  color: isSelected ? 'white' : 'var(--color-text-secondary)',
                }}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: isSelected ? 600 : 400, color: 'var(--color-text-primary)' }}>
                  {option.text}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', border: '1px solid var(--color-border)', boxShadow: 'none' }}>
        <motion.button
          whileHover={currentQIdx > 0 ? { scale: 1.02 } : {}}
          whileTap={currentQIdx > 0 ? { scale: 0.98 } : {}}
          onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
          disabled={currentQIdx === 0}
          style={{ gap: 'var(--space-2)', padding: '10px 20px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', cursor: currentQIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentQIdx === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={16} /> Sebelumnya
        </motion.button>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
          {questions.map((q, i) => (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={q.id}
              onClick={() => setCurrentQIdx(i)}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600,
                background: i === currentQIdx ? 'var(--color-primary)' : answers[q.id] ? 'rgba(37, 99, 235, 0.12)' : 'var(--color-bg)',
                color: i === currentQIdx ? 'white' : answers[q.id] ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {i + 1}
            </motion.button>
          ))}
        </div>

        {isLastQ ? (
          <motion.button
            whileHover={!submitMutation.isPending ? { scale: 1.02 } : {}}
            whileTap={!submitMutation.isPending ? { scale: 0.98 } : {}}
            onClick={() => {
              if (answeredCount < totalQ) {
                const unanswered = totalQ - answeredCount
                if (!confirm(`Masih ada ${unanswered} soal yang belum dijawab. Yakin ingin submit?`)) return
              }
              submitMutation.mutate()
            }}
            disabled={submitMutation.isPending}
            style={{ gap: 'var(--space-2)', padding: '10px 20px', background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', cursor: submitMutation.isPending ? 'not-allowed' : 'pointer', opacity: submitMutation.isPending ? 0.5 : 1, display: 'flex', alignItems: 'center' }}
          >
            {!submitMutation.isPending ? <><CheckCircle2 size={16} /> Submit</> : 'Submit...'}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentQIdx((i) => Math.min(totalQ - 1, i + 1))}
            style={{ gap: 'var(--space-2)', padding: '10px 20px', background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            Selanjutnya <ChevronRight size={16} />
          </motion.button>
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
