'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/lib/utils'

interface Question {
  id: string
  question: string
  imageUrl?: string
  options: Array<{ id: string; text: string }>
  orderIndex: number
}

const QUESTION_TIME = 30 // seconds per question

export default function SkillTestPage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Load saved progress from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('metro_skill_test_progress')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
        setCurrentIdx(parsed.currentIdx || 0)
        setAnswers(parsed.answers || {})
      }
    }
  }, [])

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ['skill-test-questions'],
    queryFn: () => api.get('/skill-test/questions').then((r) => r.data.data),
  })

  const submitMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      api.post('/skill-test/submit', { answers: data }).then((r) => r.data),
    onSuccess: (data) => {
      sessionStorage.removeItem('metro_skill_test_progress')
      updateUser({ skillTestDone: true, totalXp: (user?.totalXp || 0) + 50 })
      router.push(ROUTES.SKILL_TEST_RESULT)
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        sessionStorage.removeItem('metro_skill_test_progress')
        updateUser({ skillTestDone: true })
        router.push(ROUTES.SKILL_TEST_RESULT)
      } else {
        toast.error('Gagal mengirim jawaban. Silakan coba lagi.')
      }
    },
  })

  // Save progress to sessionStorage
  const saveProgress = useCallback((idx: number, ans: Record<string, string>) => {
    sessionStorage.setItem('metro_skill_test_progress', JSON.stringify({
      currentIdx: idx, answers: ans, savedAt: Date.now(),
    }))
  }, [])

  // Timer
  useEffect(() => {
    if (!questions || isLoading) return
    setTimeLeft(QUESTION_TIME)
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          handleNext(true)
          return QUESTION_TIME
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [currentIdx, questions])

  const handleAnswer = (questionId: string, optionId: string) => {
    if (isTransitioning) return
    const newAnswers = { ...answers, [questionId]: optionId }
    setAnswers(newAnswers)
    saveProgress(currentIdx, newAnswers)
    setIsTransitioning(true)
    setTimeout(() => {
      setIsTransitioning(false)
      handleNext(false, newAnswers)
    }, 400)
  }

  const handleNext = (skipAnswer = false, currentAnswers = answers) => {
    if (!questions) return
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setTimeLeft(QUESTION_TIME)
    } else {
      submitMutation.mutate(currentAnswers)
    }
  }

  if (isLoading || !questions) return <SkillTestLoader />

  const question = questions[currentIdx]
  const progress = ((currentIdx + 1) / questions.length) * 100
  const timeProgress = (timeLeft / QUESTION_TIME) * 100
  const isLastQuestion = currentIdx === questions.length - 1

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        padding: 'var(--space-6) var(--space-8)', display: 'flex',
        alignItems: 'center', gap: 'var(--space-6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <img src="/images/logo.jpg" alt="Metro Logo" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', letterSpacing: '-0.02em' }}>Metro Institute</span>
        </div>
        <div style={{ flex: 1, padding: '0 var(--space-6)' }}>
          <div style={{ height: 2, background: 'var(--color-border)', width: '100%' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-text-primary)', transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: 8, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
            Pertanyaan {currentIdx + 1} / {questions.length}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          color: timeLeft <= 10 ? 'var(--color-error)' : 'var(--color-text-tertiary)',
        }}>
          <span style={{
            fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.05em'
          }}>{timeLeft} DETIK</span>
        </div>
      </header>

      {/* Time progress bar */}
      <div style={{ height: 1, background: 'transparent' }}>
        <div style={{
          height: '100%', background: timeLeft <= 10 ? 'var(--color-error)' : 'transparent',
          width: `${timeProgress}%`, transition: 'width 1s linear, background 0.3s',
        }} />
      </div>

      {/* Question */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div
          style={{
            width: '100%', maxWidth: 640,
            animation: isTransitioning ? 'none' : 'fadeInUp 300ms ease',
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 300ms ease',
          }}
        >
          {/* Question card */}
          <div style={{ padding: '0 var(--space-4)', marginBottom: 'var(--space-10)', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '32px', fontWeight: 700,
              color: 'var(--color-text-primary)', lineHeight: '1.3', letterSpacing: '-0.02em',
              marginBottom: question.imageUrl ? 'var(--space-6)' : 0,
            }}>
              {question.question}
            </h2>

            {question.imageUrl && (
              <img src={question.imageUrl} alt="Soal" style={{ width: '100%', marginTop: 'var(--space-8)', borderRadius: 'var(--radius-lg)' }} />
            )}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: '0 var(--space-4)' }}>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(question.id, option.id)}
                  disabled={isTransitioning || submitMutation.isPending}
                  className="animate-fade-in-up"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-5)',
                    padding: 'var(--space-5) var(--space-6)',
                    background: '#ffffff',
                    border: isSelected ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : '0 2px 6px rgba(0,0,0,0.02)',
                    borderRadius: '16px',
                    cursor: isTransitioning ? 'default' : 'pointer',
                    textAlign: 'left', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isTransitioning) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-text-tertiary)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                    }
                  }}
                >
                  <div style={{
                    width: 28, height: 28,
                    background: isSelected ? 'var(--color-text-primary)' : '#f5f5f5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '8px',
                    flexShrink: 0, transition: 'all 0.2s ease',
                    color: isSelected ? 'white' : 'var(--color-text-secondary)',
                    fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em'
                  }}>
                    {option.id.toUpperCase()}
                  </div>
                  <span style={{
                    fontSize: '17px', fontWeight: isSelected ? 600 : 400,
                    color: 'var(--color-text-primary)',
                    transition: 'all 0.2s ease',
                  }}>
                    {option.text}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Hint */}
          <p style={{ textAlign: 'center', marginTop: 'var(--space-10)', fontSize: '11px', color: 'var(--color-text-tertiary)', letterSpacing: '0.02em' }}>
            Pilih salah satu opsi untuk melanjutkan otomatis
          </p>
        </div>
      </main>
    </div>
  )
}

function SkillTestLoader() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="spinner spinner-lg" />
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Menyiapkan soal...</p>
    </div>
  )
}
