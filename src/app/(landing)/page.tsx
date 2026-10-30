// src/app/(landing)/page.tsx
// Landing Page utama Metro Institute — 100% konten dinamis dari API

import LandingPageClient from './_components/LandingPageClient'

export interface FeaturedBootcamp {
  id: string
  title: string
  shortDescription: string
  description: string | null
  field: string
  price: number
  thumbnailUrl: string | null
  batchStatus: string
  registrationStartDate?: string | null
  registrationDeadline?: string | null
  batchStartDate?: string | null
  batchEndDate?: string | null
  rating: number
  mentorName: string | null
  outcomes: string[]
}

export interface FeaturedCourse {
  id: string
  title: string
  shortDescription: string
  field: string
  price: number
  thumbnailUrl: string | null
  rating: number
  enrollmentCount: number
  tags: string[]
}

export interface FeaturedWebinar {
  id: string
  title: string
  shortDescription?: string | null
  description: string | null
  field: string
  price: number
  bannerUrl: string | null
  speakerName: string
  speakerRole?: string | null
  scheduledAt: string
  duration: number
  isFeatured: boolean
}

interface HomepageData {
  config: Record<string, string>
  featuredBootcamps: FeaturedBootcamp[]
  featuredCourses: FeaturedCourse[]
  featuredWebinars: FeaturedWebinar[]
  stats: {
    totalMentees: number
    totalCertificates: number
    totalCourses: number
  }
}

// Server-side fetch — ISR revalidate every 60s, no client flicker, SEO-ready
async function getHomepageData(): Promise<HomepageData> {
  const empty: HomepageData = {
    config: {},
    featuredBootcamps: [],
    featuredCourses: [],
    featuredWebinars: [],
    stats: { totalMentees: 0, totalCertificates: 0, totalCourses: 0 },
  }
  try {
    const [homepageRes, bootcampsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/homepage`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/bootcamps`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    ])

    const data: HomepageData = homepageRes?.data ?? empty
    if (data.featuredBootcamps?.length && bootcampsRes?.data?.length) {
      const bootcampMap = new Map<string, any>(bootcampsRes.data.map((b: any) => [b.id, b]))
      data.featuredBootcamps = data.featuredBootcamps.map((fb: any) => {
        const full = bootcampMap.get(fb.id)
        if (full) {
          return {
            ...fb,
            batchStatus: full.batchStatus ?? fb.batchStatus,
            registrationStartDate: full.registrationStartDate ?? fb.registrationStartDate,
            registrationDeadline: full.registrationDeadline ?? fb.registrationDeadline,
            batchStartDate: full.batchStartDate ?? fb.batchStartDate,
            batchEndDate: full.batchEndDate ?? fb.batchEndDate,
          }
        }
        return fb
      })
    }
    return data
  } catch {
    return empty
  }
}

export default async function LandingPage() {
  const { config, featuredBootcamps, featuredCourses, featuredWebinars, stats } = await getHomepageData()
  return (
    <LandingPageClient
      config={config}
      featuredBootcamps={featuredBootcamps}
      featuredCourses={featuredCourses}
      featuredWebinars={featuredWebinars}
      stats={stats}
    />
  )
}
