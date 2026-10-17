'use client'

import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface CourseVideoPlayerProps {
  url: string
  title?: string
  isCompleted?: boolean
  onProgress?: (progress: { playedSeconds: number; played: number }) => void
  onEnded?: () => void
}

export default function CourseVideoPlayer({
  url,
  title = 'Course Video',
  isCompleted = false,
  onProgress,
  onEnded,
}: CourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [mounted, setMounted] = useState(false)

  // Anti-skip guard tracking
  const maxWatchedTimeRef = useRef<number>(0)
  const isUnlockedRef = useRef<boolean>(Boolean(isCompleted))
  const lastToastTimeRef = useRef<number>(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync isCompleted prop: if already completed, unlock seeking immediately
  useEffect(() => {
    if (isCompleted) {
      isUnlockedRef.current = true
    }
  }, [isCompleted])

  // Reset maxWatchedTime when URL changes
  useEffect(() => {
    maxWatchedTimeRef.current = 0
    isUnlockedRef.current = Boolean(isCompleted)
  }, [url, isCompleted])

  const notifyAntiSkip = () => {
    const now = Date.now()
    if (now - lastToastTimeRef.current > 3000) {
      lastToastTimeRef.current = now
      toast.info('Video belum bisa dilewati (skip). Silakan tonton hingga minimal 90% terlebih dahulu.', {
        id: 'anti-skip-toast',
      })
    }
  }

  const isBunny = url && (url.includes('iframe.mediadelivery.net') || url.includes('b-cdn.net') || url.includes('bunnycdn'))

  // Listen to Bunny Stream Player postMessage events
  useEffect(() => {
    if (!mounted || !isBunny) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data?.event === 'timeupdate' || data?.type === 'timeupdate') {
          const current = data.currentTime || data.seconds || 0
          const duration = data.duration || 1
          if (duration > 0) {
            const played = current / duration

            // Unlock if completed or reached >= 90%
            if (isCompleted || played >= 0.9) {
              isUnlockedRef.current = true
            }

            // Anti-skip enforcement for Bunny Player
            if (!isUnlockedRef.current && current > maxWatchedTimeRef.current + 3) {
              const iframe = iframeRef.current
              if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({ method: 'setCurrentTime', value: maxWatchedTimeRef.current }), '*')
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setCurrentTime', args: [maxWatchedTimeRef.current] }), '*')
              }
              notifyAntiSkip()
              return
            }

            if (current > maxWatchedTimeRef.current) {
              maxWatchedTimeRef.current = current
            }

            onProgress?.({ playedSeconds: current, played })
          }
        }
        if (data?.event === 'ended' || data?.type === 'ended') {
          isUnlockedRef.current = true
          onEnded?.()
        }
      } catch {}
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [mounted, isBunny, isCompleted, onProgress, onEnded])

  if (!mounted) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)' }} className="animate-spin" />
      </div>
    )
  }

  // 1. Official Bunny Stream Player (Dedicated & Anti-Theft)
  if (isBunny) {
    return (
      <iframe
        ref={iframeRef}
        key={url}
        src={url}
        title={title}
        loading="lazy"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    )
  }

  // 2. Direct HTML5 Video (.mp4, .webm, etc.) with strict Anti-Skip Guard
  return (
    <video
      ref={videoRef}
      key={url}
      src={url}
      controls
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block' }}
      onTimeUpdate={(e) => {
        const v = e.currentTarget
        if (!v || v.duration <= 0) return

        const current = v.currentTime
        const duration = v.duration
        const played = current / duration

        // Unlock seeking if already completed or reached >= 90%
        if (isCompleted || played >= 0.9) {
          isUnlockedRef.current = true
        }

        // Anti-skip: prevent jumping ahead of watched duration if not unlocked
        if (!isUnlockedRef.current && current > maxWatchedTimeRef.current + 2) {
          v.currentTime = maxWatchedTimeRef.current
          notifyAntiSkip()
          return
        }

        if (current > maxWatchedTimeRef.current) {
          maxWatchedTimeRef.current = current
        }

        onProgress?.({ playedSeconds: current, played })
      }}
      onSeeking={(e) => {
        const v = e.currentTarget
        if (!v) return

        if (!isUnlockedRef.current && v.currentTime > maxWatchedTimeRef.current + 2) {
          v.currentTime = maxWatchedTimeRef.current
          notifyAntiSkip()
        }
      }}
      onEnded={() => {
        isUnlockedRef.current = true
        onEnded?.()
      }}
    />
  )
}
