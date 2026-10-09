'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ROUTES } from '@/lib/utils'
import api from '@/lib/axios'
import { Loader2 } from 'lucide-react'

export default function LearnCourseRedirectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['course-detail', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data),
  })

  useEffect(() => {
    if (course && course.chapters && course.chapters.length > 0) {
      // Temukan session pertama dari chapter pertama
      let firstSessionId = null
      for (const chapter of course.chapters) {
        if (chapter.sessions && chapter.sessions.length > 0) {
          firstSessionId = chapter.sessions[0].id
          break
        }
      }

      if (firstSessionId) {
        router.replace(ROUTES.LEARN_COURSE_SESSION(id, firstSessionId))
      } else {
        // Fallback jika tidak ada sesi
        router.replace(ROUTES.COURSE_DETAIL(id))
      }
    } else if (course && (!course.chapters || course.chapters.length === 0)) {
      router.replace(ROUTES.COURSE_DETAIL(id))
    }
  }, [course, id, router])

  if (isError) {
    router.replace(ROUTES.MY_COURSES)
    return null
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Mempersiapkan kelas Anda...</p>
    </div>
  )
}
