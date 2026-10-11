'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Upload, Link as LinkIcon, Film, Check, X, Loader2, Play, ExternalLink } from 'lucide-react'
import * as tus from 'tus-js-client'
import api from '@/lib/axios'
import { toast } from 'sonner'

interface VideoInputWithUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function VideoInputWithUpload({ value, onChange }: VideoInputWithUploadProps) {
  const isBunnyUrl = value && (value.includes('iframe.mediadelivery.net') || value.includes('b-cdn.net'))
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
        throw new Error('Gagal menyiapkan sesi upload')
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
          toast.success('Video berhasil diunggah')
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
            /* Clean Active File Card */
            <div style={{
              borderRadius: '12px',
              border: '1px solid #e4e4e7',
              background: '#fafafa',
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
                    background: '#ecfdf5',
                    color: '#059669',
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
                      color: '#18181b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {fileName || 'Video Terpasang'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} strokeWidth={2.5} /> Video aktif & siap diputar
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e4e4e7',
                      background: '#fff',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#3f3f46',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Play size={11} /> {showPreview ? 'Tutup' : 'Preview'}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e4e4e7',
                      background: '#fff',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#3f3f46',
                      cursor: 'pointer'
                    }}
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => { onChange(''); setFileName(''); setShowPreview(false) }}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                    title="Hapus video"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Collapsible Clean Preview */}
              {showPreview && (
                <div style={{ borderTop: '1px solid #e4e4e7', background: '#000', aspectRatio: '16/9', maxHeight: 220 }}>
                  {isBunnyUrl ? (
                    <iframe
                      src={value}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                    />
                  ) : isDirectVideoUrl ? (
                    <video src={value} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <iframe src={value} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
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
                border: `1px dashed ${isDragging ? '#10b981' : '#d4d4d8'}`,
                borderRadius: '12px',
                padding: '18px 16px',
                textAlign: 'center',
                background: isDragging ? '#f0fdf4' : '#fafafa',
                cursor: isUploading ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={24} className="animate-spin" color="#10b981" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>
                      Mengunggah video... {uploadProgress}%
                    </div>
                    <div style={{ width: 160, height: 4, background: '#e4e4e7', borderRadius: 2, margin: '8px auto 6px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#10b981', transition: 'width 0.2s' }} />
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
              onChange={(e) => onChange(e.target.value)}
              placeholder="Tempel tautan video (https://...)"
              style={{
                width: '100%',
                padding: '9px 36px 9px 12px',
                borderRadius: '10px',
                border: '1px solid #e4e4e7',
                fontSize: '13px',
                background: '#ffffff',
                color: '#18181b',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e4e4e7'}
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
                  color: '#a1a1aa',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Clean Subtle Indicator */}
          {value && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11px', color: '#059669' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Tautan video siap digunakan
            </div>
          )}
        </div>
      )}
    </div>
  )
}
