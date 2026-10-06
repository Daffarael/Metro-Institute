'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/lib/utils'

import { Suspense } from 'react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setToken, setUser, logout } = useAuthStore()
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) return
    hasProcessed.current = true

    const token = searchParams.get('token')
    const err = searchParams.get('error')

    if (err) {
      toast.error(`Login gagal: ${err}`)
      router.replace('/login')
      return
    }

    if (!token) {
      toast.error('Token tidak valid')
      router.replace('/login')
      return
    }

    // Set temporary token to fetch user profile
    setToken(token)

    authService.getMe()
      .then((res) => {
        const userData = res.data
        setUser(userData)
        
        // If Admin
        if (userData.role === 'SUPER_ADMIN' || userData.role === 'ADMIN') {
          router.replace('/admin/dashboard')
          return
        }

        // If missing phone number (from Google OAuth)
        if (!userData.phone) {
          router.replace('/complete-registration')
          return
        }

        // Standard redirect
        router.replace(userData.skillTestDone ? ROUTES.BASECAMP : ROUTES.SKILL_TEST)
      })
      .catch((error) => {
        console.error('Failed to get user profile', error)
        toast.error('Sesi login tidak valid')
        logout() // clear auth state
        router.replace('/login')
      })

  }, [router, searchParams, setToken, setUser])

  return (
    <div className="flex flex-col items-center gap-4">
      <svg className="animate-spin h-8 w-8 text-[#018556]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <p className="text-gray-600 font-medium text-sm animate-pulse">Menyiapkan profil Anda...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#018556]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <p className="text-gray-600 font-medium text-sm animate-pulse">Memuat...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  )
}

