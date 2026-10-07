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
  const [showIntro, setShowIntro] = useState(true)
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
    if (!questions || isLoading || showIntro) return

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
  }, [currentIdx, questions, showIntro])

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

  // ── Intro Screen ──────────────────────────────────────────────
  if (showIntro) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#f9f9f9',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: '#111' }}>Metro Institute</span>
        </div>

        <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
          {/* Icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 24, background: '#fff', border: '1px solid #eaeaea',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', color: '#333', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12, color: '#111' }}>
            Skill Test Awal
          </h1>
          <p style={{ fontSize: 15, color: '#666', lineHeight: 1.65, marginBottom: 36 }}>
            Sebelum mulai, kami ingin mengetahui kemampuanmu saat ini. Hasil tes ini membantu kami menentukan jalur belajar yang paling sesuai untukmu.
          </p>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
            {[
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>, label: 'Jumlah Soal', value: `${questions.length} Pertanyaan` },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></svg>, label: 'Waktu per Soal', value: `${QUESTION_TIME} Detik` },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, label: 'Tipe Soal', value: 'Pilihan Ganda' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, label: 'Tujuan', value: 'Personalisasi Belajar' },
            ].map((item) => (
              <div key={item.label} style={{
                background: '#ffffff', border: '1px solid #e8e8e8',
                borderRadius: 16, padding: '16px 14px', textAlign: 'left',
              }}>
                <div style={{ color: '#444', marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: '#999', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div style={{
            background: '#f2f2f2', borderRadius: 12, padding: '16px', marginBottom: 32, textAlign: 'left',
            display: 'flex', gap: 12, alignItems: 'flex-start'
          }}>
            <div style={{ color: '#666', marginTop: 2 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            </div>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 }}>
              <strong>Tips:</strong> Jawab dengan jujur sesuai kemampuanmu sekarang. Tidak ada nilai benar atau salah.
            </p>
          </div>

          <button
            onClick={() => setShowIntro(false)}
            style={{
              width: '100%', height: 50, background: '#111',
              color: '#ffffff', border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '-0.01em', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            Mulai Test &rarr;
          </button>
        </div>
      </div>
    )
  }
  // ─────────────────────────────────────────────────────────────

  const question = questions[currentIdx]
  const progress = ((currentIdx + 1) / questions.length) * 100
  const timeProgress = (timeLeft / QUESTION_TIME) * 100

  return (
    <div style={{
      minHeight: '100dvh', background: '#f9f9f9',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        padding: '24px', display: 'flex',
        alignItems: 'center', gap: '24px', maxWidth: 800, margin: '0 auto', width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <img src="/logo-metro-clean.png" alt="Metro Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
        </div>
        
        {/* Progress */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Pertanyaan {currentIdx + 1} / {questions.length}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              color: timeLeft <= 10 ? '#ef4444' : '#666',
            }}>
              {timeLeft} DETIK
            </span>
          </div>
          <div style={{ height: 4, background: '#e5e5e5', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#111', borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
        </div>
      </header>

      {/* Time progress bar thin at bottom of header */}
      <div style={{ height: 2, background: 'transparent' }}>
        <div style={{
          height: '100%', background: timeLeft <= 10 ? '#ef4444' : '#ddd',
          width: `${timeProgress}%`, transition: 'width 1s linear, background 0.3s',
        }} />
      </div>

      {/* Question Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div
          style={{
            width: '100%', maxWidth: 600,
            animation: isTransitioning ? 'none' : 'fadeInUp 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 300ms ease',
          }}
        >
          {/* Question text */}
          <div style={{ marginBottom: 40, textAlign: 'left' }}>
            <h2 style={{
              fontSize: 26, fontWeight: 700,
              color: '#111', lineHeight: 1.4, letterSpacing: '-0.02em',
              marginBottom: question.imageUrl ? 24 : 0,
            }}>
              {question.question}
            </h2>

            {question.imageUrl && (
              <img src={question.imageUrl} alt="Soal" style={{ width: '100%', borderRadius: 16, border: '1px solid #eaeaea' }} />
            )}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(question.id, option.id)}
                  disabled={isTransitioning || submitMutation.isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 20px',
                    background: '#fff',
                    border: isSelected ? '2px solid #111' : '1px solid #e8e8e8',
                    borderRadius: 16,
                    cursor: isTransitioning ? 'default' : 'pointer',
                    textAlign: 'left', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isTransitioning) {
                      (e.currentTarget as HTMLElement).style.borderColor = '#ccc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor = '#e8e8e8';
                    }
                  }}
                >
                  <div style={{
                    width: 32, height: 32,
                    background: isSelected ? '#111' : '#f4f4f4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10,
                    flexShrink: 0, transition: 'all 0.2s ease',
                    color: isSelected ? '#fff' : '#666',
                    fontWeight: 700, fontSize: 13,
                  }}>
                    {option.id.toUpperCase()}
                  </div>
                  <span style={{
                    fontSize: 16, fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#111' : '#444',
                    lineHeight: 1.5,
                  }}>
                    {option.text}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      {/* Global styles for animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  )
}

function SkillTestLoader() {
  return (
    <div style={{ minHeight: '100dvh', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="spinner spinner-lg" />
      <p style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>Menyiapkan soal...</p>
    </div>
  )
}
