'use client'

import React, { useEffect, useRef, useState } from 'react'

interface CourseVideoPlayerProps {
  url: string
  title?: string
  onProgress?: (progress: { playedSeconds: number; played: number }) => void
  onEnded?: () => void
}

export default function CourseVideoPlayer({
  url,
  title = 'Course Video',
  onProgress,
  onEnded,
}: CourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
            onProgress?.({ playedSeconds: current, played: current / duration })
          }
        }
        if (data?.event === 'ended' || data?.type === 'ended') {
          onEnded?.()
        }
      } catch {}
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [mounted, isBunny, onProgress, onEnded])

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

  // 2. Direct HTML5 Video (.mp4, .webm, etc.)
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
        if (v.duration > 0) {
          onProgress?.({ playedSeconds: v.currentTime, played: v.currentTime / v.duration })
        }
      }}
      onEnded={onEnded}
    />
  )
}
