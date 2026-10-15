'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ROUTES } from '@/lib/utils'
import api from '@/lib/axios'
import { Loader2 } from 'lucide-react'

export default function LearnBootcampRedirectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: bootcamp, isLoading, isError } = useQuery({
    queryKey: ['bootcamp-detail', id],
    queryFn: () => api.get(`/bootcamps/${id}`).then((r) => r.data.data),
  })

  useEffect(() => {
    if (bootcamp && bootcamp.chapters && bootcamp.chapters.length > 0) {
      let firstSessionId = null
      for (const chapter of bootcamp.chapters) {
        if (chapter.sessions && chapter.sessions.length > 0) {
          firstSessionId = chapter.sessions[0].id
          break
        }
      }

      if (firstSessionId) {
        router.replace(ROUTES.LEARN_BOOTCAMP_SESSION(id, firstSessionId))
      } else {
        router.replace(ROUTES.BOOTCAMP_DETAIL(id))
      }
    } else if (bootcamp && (!bootcamp.chapters || bootcamp.chapters.length === 0)) {
      router.replace(ROUTES.BOOTCAMP_DETAIL(id))
    }
  }, [bootcamp, id, router])

  if (isError) {
    router.replace(ROUTES.MY_COURSES)
    return null
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Mempersiapkan kelas bootcamp Anda...</p>
    </div>
  )
}
