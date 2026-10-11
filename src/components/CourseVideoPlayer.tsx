'use client'

import React, { useEffect, useRef, useState } from 'react'

interface CourseVideoPlayerProps {
  url: string
  title?: string
  onProgress?: (progress: { playedSeconds: number; played: number }) => void
  onEnded?: () => void
}

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

function getYouTubeId(url: string): string | null {
  if (!url) return null
  const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/
  const match = url.match(regExp)
  return match ? match[1] : null
}

function getVimeoId(url: string): string | null {
  if (!url) return null
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
}

export default function CourseVideoPlayer({
  url,
  title = 'Course Video',
  onProgress,
  onEnded,
}: CourseVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const ytId = getYouTubeId(url)
  const vimeoId = getVimeoId(url)

  useEffect(() => {
    if (!mounted || !ytId || !iframeRef.current) return

    let player: any = null
    let progressInterval: any = null

    const attachYT = () => {
      if (!window.YT || !window.YT.Player || !iframeRef.current) return
      try {
        player = new window.YT.Player(iframeRef.current, {
          events: {
            onStateChange: (event: any) => {
              // 1 = PLAYING
              if (event.data === 1) {
                if (progressInterval) clearInterval(progressInterval)
                progressInterval = setInterval(() => {
                  try {
                    if (player && typeof player.getCurrentTime === 'function' && typeof player.getDuration === 'function') {
                      const current = player.getCurrentTime()
                      const duration = player.getDuration()
                      if (duration > 0) {
                        onProgress?.({ playedSeconds: current, played: current / duration })
                      }
                    }
                  } catch {}
                }, 1000)
              } else {
                if (progressInterval) clearInterval(progressInterval)
              }
              // 0 = ENDED
              if (event.data === 0) {
                onEnded?.()
              }
            },
          },
        })
      } catch (err) {
        console.warn('YT Player init skipped or failed:', err)
      }
    }

    if (window.YT && window.YT.Player) {
      attachYT()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        attachYT()
      }
      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script')
        script.id = 'yt-iframe-api'
        script.src = 'https://www.youtube.com/iframe_api'
        document.body.appendChild(script)
      }
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval)
      if (player && typeof player.destroy === 'function') {
        try { player.destroy() } catch {}
      }
    }
  }, [mounted, ytId, onProgress, onEnded])

  if (!mounted) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)' }} className="animate-spin" />
      </div>
    )
  }

  // 1. YouTube Player (Clean embed with official YouTube controls & fallback to API)
  if (ytId) {
    return (
      <iframe
        ref={iframeRef}
        key={ytId}
        src={`https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`}
        title={title}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    )
  }

  // 2. Vimeo Player
  if (vimeoId) {
    return (
      <iframe
        key={vimeoId}
        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=0`}
        title={title}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    )
  }

  // 3. Direct HTML5 Video (.mp4, .webm, etc.)
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
