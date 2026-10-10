// src/app/(landing)/page.tsx
// Landing Page utama Metro Institute — 100% konten dinamis dari API

import LandingPageClient from './_components/LandingPageClient'

export interface FeaturedBootcamp {
  id: string
  title: string
  shortDescription: string
  field: string
  price: number
  thumbnailUrl: string | null
  batchStatus: string
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

interface HomepageData {
  config: Record<string, string>
  featuredBootcamps: FeaturedBootcamp[]
  featuredCourses: FeaturedCourse[]
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
    stats: { totalMentees: 0, totalCertificates: 0, totalCourses: 0 },
  }
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/homepage`,
      { cache: 'no-store' }
    )
    if (!res.ok) return empty
    const json = await res.json()
    return json.data ?? empty
  } catch {
    return empty
  }
}

export default async function LandingPage() {
  const { config, featuredBootcamps, featuredCourses, stats } = await getHomepageData()
  return (
    <LandingPageClient
      config={config}
      featuredBootcamps={featuredBootcamps}
      featuredCourses={featuredCourses}
      stats={stats}
    />
  )
}
