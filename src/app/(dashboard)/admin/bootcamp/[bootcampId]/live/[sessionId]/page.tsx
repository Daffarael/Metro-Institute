'use client'

import { JitsiMeeting } from '@jitsi/react-sdk'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useState, useEffect } from 'react'

export default function AdminLiveRoomPage() {
  const params = useParams<{ bootcampId: string; sessionId: string }>()
  const router = useRouter()

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  })

  const { data: session, isLoading } = useQuery({
    queryKey: ['admin', 'bootcamp', params.bootcampId, 'session', params.sessionId],
    queryFn: () => api.get(`/admin/bootcamps/${params.bootcampId}/sessions/${params.sessionId}`).then(r => r.data.data),
  })

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>Memuat Live Room...</div>
  }

  if (!session) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Sesi tidak ditemukan atau Anda tidak memiliki akses.</div>
  }

  // Cek apakah ini jitsi
  const isJitsi = session.liveUrl?.startsWith('jitsi:')
  const jitsiRoomName = isJitsi ? session.liveUrl.replace('jitsi:', '') : null

  if (!isJitsi && session.liveUrl) {
    // Jika bukan Jitsi (misal GMeet/Zoom URL biasa)
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>{session.title}</h2>
        <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>
          Sesi ini menggunakan platform eksternal. Silakan klik tombol di bawah untuk bergabung ke meeting.
        </p>
        <a href={session.liveUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-full)', fontWeight: 600, textDecoration: 'none' }}>
          Gabung ke Meeting
        </a>
      </div>
    )
  }

  if (isJitsi && jitsiRoomName && user) {
    return (
      <div style={{ height: 'calc(100vh - 80px)', width: '100%', padding: 'var(--space-4)', background: 'var(--color-bg)' }}>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{session.title}</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Live Session In-Platform</p>
          </div>
          <button onClick={() => router.back()} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer' }}>
            Kembali
          </button>
        </div>
        
        <div style={{ height: '85%', width: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={jitsiRoomName}
            configOverwrite={{
              startWithAudioMuted: true,
              startWithVideoMuted: true,
              disableModeratorIndicator: true,
              enableEmailInStats: false,
              prejoinPageEnabled: false
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_JITSI_WATERMARK: false,
            }}
            userInfo={{
              displayName: user.name ? `${user.name} (Host)` : 'Host (Admin)',
              email: user.email || ''
            }}
            onApiReady={(externalApi) => {
              console.log('Jitsi API is ready', externalApi)
            }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '100%'
              iframeRef.style.width = '100%'
            }}
            onReadyToClose={() => {
              router.back()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      URL Live tidak valid.
    </div>
  )
}
