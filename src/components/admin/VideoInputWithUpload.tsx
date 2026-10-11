'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Upload, Link as LinkIcon, Film, Check, X, Loader2, Play, Trash2, Info } from 'lucide-react'
import * as tus from 'tus-js-client'
import api from '@/lib/axios'
import { toast } from 'sonner'

interface VideoInputWithUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function VideoInputWithUpload({ value, onChange }: VideoInputWithUploadProps) {
  const isBunnyUrl = value && (value.includes('iframe.mediadelivery.net') || value.includes('b-cdn.net') || value.includes('bunnycdn'))
  const isYouTubeUrl = value && (value.includes('youtu.be') || value.includes('youtube.com'))
  const isDirectVideoUrl = value && (value.includes('/uploads/') || value.includes('cloudinary') || value.match(/\.(mp4|webm|mov)$/i))

  const [mode, setMode] = useState<'upload' | 'url'>(
    value && !isBunnyUrl && !isDirectVideoUrl ? 'url' : 'upload'
  )
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileName, setFileName] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const tusUploadRef = useRef<tus.Upload | null>(null)

  const handleUpload = async (file: File) => {
    if (!file) return

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      toast.error('Pilih file berformat video (MP4, WebM, MOV)')
      return
    }

    if (file.size > 2 * 1024 * 1024 * 1024) {
      toast.error('Ukuran video maksimal 2GB')
      return
    }

    setFileName(file.name)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const sanitizedTitle = file.name.replace(/\.[^/.]+$/, '').trim() || `Video-${Date.now()}`
      const response = await api.post('/admin/bunny/create-upload', {
        title: sanitizedTitle,
      })

      if (!response.data?.success || !response.data?.data) {
        throw new Error('Gagal menyiapkan sesi upload ke Bunny Stream')
      }

      const { videoId, libraryId, expirationTime, signature, embedUrl } = response.data.data

      const upload = new tus.Upload(file, {
        endpoint: 'https://video.bunnycdn.com/tusupload',
        retryDelays: [0, 2000, 5000, 10000],
        headers: {
          AuthorizationSignature: signature,
          AuthorizationExpire: String(expirationTime),
          VideoId: videoId,
          LibraryId: String(libraryId),
        },
        metadata: {
          filetype: file.type || 'video/mp4',
          title: sanitizedTitle,
        },
        onError: (error) => {
          console.error('Tus error:', error)
          toast.error(`Upload gagal: ${error.message || 'Koneksi terputus'}`)
          setIsUploading(false)
          tusUploadRef.current = null
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          if (bytesTotal > 0) {
            setUploadProgress(Math.round((bytesUploaded / bytesTotal) * 100))
          }
        },
        onSuccess: () => {
          setIsUploading(false)
          setUploadProgress(100)
          tusUploadRef.current = null
          onChange(embedUrl)
          toast.success('Video berhasil diunggah ke Bunny Stream')
        },
      })

      tusUploadRef.current = upload
      upload.start()
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(err.response?.data?.message || err.message || 'Gagal memulai upload')
      setIsUploading(false)
    }
  }

  const handleCancelUpload = () => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort()
      tusUploadRef.current = null
    }
    setIsUploading(false)
    setUploadProgress(0)
    setFileName('')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0])
  }, [])

  const handleUrlChange = (newUrl: string) => {
    onChange(newUrl)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Sleek Segmented Switcher */}
      <div style={{
        display: 'inline-flex',
        padding: '3px',
        background: '#f4f4f5',
        borderRadius: '10px',
        width: 'fit-content',
        border: '1px solid rgba(0,0,0,0.04)'
      }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{
            padding: '5px 12px',
            borderRadius: '7px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: mode === 'upload' ? '#ffffff' : 'transparent',
            color: mode === 'upload' ? '#111827' : '#71717a',
            boxShadow: mode === 'upload' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Upload size={13} /> Upload File
        </button>

        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            padding: '5px 12px',
            borderRadius: '7px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: mode === 'url' ? '#ffffff' : 'transparent',
            color: mode === 'url' ? '#111827' : '#71717a',
            boxShadow: mode === 'url' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <LinkIcon size={13} /> Link / URL
        </button>
      </div>

      {/* 1. UPLOAD FILE MODE */}
      {mode === 'upload' && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleUpload(e.target.files[0])
            }}
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
            style={{ display: 'none' }}
          />

          {value && !isUploading ? (
            /* Active Video Card */
            <div style={{
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: isYouTubeUrl ? '#f3f4f6' : 'rgba(1, 133, 86, 0.08)',
                    color: isYouTubeUrl ? '#6b7280' : 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Film size={15} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {isYouTubeUrl ? 'Video Sesi (Tautan Lama)' : (fileName || 'Video Bunny Stream Terpasang')}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isYouTubeUrl ? '#6b7280' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {isYouTubeUrl ? (
                        'Format lama • Silakan hapus atau ganti dengan video baru'
                      ) : (
                        <>
                          <Check size={11} strokeWidth={2.5} /> Video aktif & siap diputar
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {!isYouTubeUrl && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Play size={11} /> {showPreview ? 'Tutup' : 'Preview'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      background: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => { onChange(''); setFileName(''); setShowPreview(false) }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      background: '#ffffff',
                      color: '#6b7280',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#fee2e2'
                      e.currentTarget.style.background = '#fef2f2'
                      e.currentTarget.style.color = '#ef4444'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.background = '#ffffff'
                      e.currentTarget.style.color = '#6b7280'
                    }}
                    title="Hapus video ini"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>

              {/* Collapsible Clean Preview */}
              {showPreview && !isYouTubeUrl && (
                <div style={{ borderTop: '1px solid #e5e7eb', background: '#000000', aspectRatio: '16/9', maxHeight: 220 }}>
                  {isBunnyUrl ? (
                    <iframe
                      src={value}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                    />
                  ) : (
                    <video src={value} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Sleek Minimal Dropzone */
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              style={{
                border: `1px dashed ${isDragging ? 'var(--color-primary)' : '#d4d4d8'}`,
                borderRadius: '10px',
                padding: '20px 16px',
                textAlign: 'center',
                background: isDragging ? 'var(--color-primary-xlight)' : '#fafafa',
                cursor: isUploading ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>
                      Mengunggah video... {uploadProgress}%
                    </div>
                    <div style={{ width: 160, height: 4, background: '#e4e4e7', borderRadius: 2, margin: '8px auto 6px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s' }} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCancelUpload() }}
                      style={{
                        background: 'none', border: 'none',
                        color: '#ef4444', fontSize: '11px', fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Batalkan
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid #e4e4e7',
                    color: '#71717a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}>
                    <Upload size={15} />
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#27272a' }}>
                      Pilih video atau seret ke sini
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                    MP4, WebM, MOV (Maks. 2GB)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. URL INPUT MODE */}
      {mode === 'url' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Tempel tautan Bunny Stream (https://iframe.mediadelivery.net/...)"
              style={{
                width: '100%',
                padding: '9px 36px 9px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
                background: '#ffffff',
                color: '#18181b',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Hapus tautan"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Clean, professional, subtle notice if an unsupported YouTube link is in URL input */}
          {isYouTubeUrl && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '9px 12px',
              borderRadius: '8px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              marginTop: 4
            }}>
              <Info size={14} style={{ color: '#6b7280', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '12px', color: '#4b5563', lineHeight: 1.45 }}>
                <span style={{ fontWeight: 600, color: '#111827', display: 'inline', marginRight: 4 }}>
                  Tautan belum didukung:
                </span>
                Format YouTube tidak digunakan demi keamanan materi. Harap gunakan tautan Bunny Stream atau unggah file pada tab <strong>Upload File</strong>.
              </div>
              <button
                type="button"
                onClick={() => onChange('')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '5px',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  color: '#6b7280',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#fee2e2'
                  e.currentTarget.style.color = '#ef4444'
                  e.currentTarget.style.background = '#fef2f2'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.color = '#6b7280'
                  e.currentTarget.style.background = '#ffffff'
                }}
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
