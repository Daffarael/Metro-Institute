'use client'

import { Suspense } from 'react'
import AuthCard from '../_components/AuthCard'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="page login-10 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#063D2A]" />
      </div>
    }>
      <AuthCard initialMode="login" />
    </Suspense>
  )
}
