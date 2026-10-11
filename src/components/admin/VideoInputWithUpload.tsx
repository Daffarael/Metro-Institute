'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Upload, Link as LinkIcon, Film, CheckCircle2, X, Loader2, PlayCircle, ShieldCheck } from 'lucide-react'
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
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tusUploadRef = useRef<tus.Upload | null>(null)

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate video type
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      toast.error('File harus berupa video (MP4, WebM, MOV, MKV)')
      return
    }

    // Validate size (maks 2GB untuk Bunny Stream)
    if (file.size > 2 * 1024 * 1024 * 1024) {
      toast.error('Ukuran video maksimal 2GB')
      return
    }

    setFileName(file.name)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 1. Dapatkan izin & tanda tangan upload dari server backend (Bunny Stream Tus token)
      const sanitizedTitle = file.name.replace(/\.[^/.]+$/, '').trim() || `Video-${Date.now()}`
      const response = await api.post('/admin/bunny/create-upload', {
        title: sanitizedTitle,
      })

      if (!response.data?.success || !response.data?.data) {
        throw new Error('Gagal menginisialisasi sesi upload ke Bunny Stream')
      }

      const { videoId, libraryId, expirationTime, signature, embedUrl } = response.data.data

      // 2. Direct Upload dari browser ke server Bunny Stream menggunakan Tus Protocol (0% beban server Railway!)
      const upload = new tus.Upload(file, {
        endpoint: 'https://video.bunnycdn.com/tusupload',
        retryDelays: [0, 3000, 5000, 10000, 20000],
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
          console.error('Bunny Tus upload error:', error)
          toast.error(`Gagal upload video: ${error.message || 'Koneksi terputus'}`)
          setIsUploading(false)
          tusUploadRef.current = null
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          if (bytesTotal > 0) {
            const percent = Math.round((bytesUploaded / bytesTotal) * 100)
            setUploadProgress(percent)
          }
        },
        onSuccess: () => {
          setIsUploading(false)
          setUploadProgress(100)
          tusUploadRef.current = null
          onChange(embedUrl)
          toast.success('Video berhasil diunggah ke Bunny Stream! 🎉')
        },
      })

      tusUploadRef.current = upload
      upload.start()
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(err.response?.data?.message || err.message || 'Gagal memulai upload video. Silakan coba lagi.')
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
    toast.info('Upload dibatalkan')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Mode Switcher Tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: 3,
        background: 'var(--color-bg)', borderRadius: 10,
        border: '1px solid var(--color-border)', width: 'fit-content'
      }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{
            padding: '6px 14px', borderRadius: 8, border: 'none',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            background: mode === 'upload' ? 'var(--color-surface)' : 'transparent',
            color: mode === 'upload' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            boxShadow: mode === 'upload' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          <Upload size={14} /> Upload Video (Bunny Stream)
        </button>

        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            padding: '6px 14px', borderRadius: 8, border: 'none',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            background: mode === 'url' ? 'var(--color-surface)' : 'transparent',
            color: mode === 'url' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            boxShadow: mode === 'url' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          <LinkIcon size={14} /> Masukkan Link / URL
        </button>
      </div>

      {/* 1. Upload File Mode */}
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
            /* Uploaded State */
            <div style={{
              padding: '14px 16px', borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isBunnyUrl ? <ShieldCheck size={18} /> : <Film size={18} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {fileName || (isBunnyUrl ? 'Video Bunny Stream Aktif' : 'Video Terunggah')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> {isBunnyUrl ? 'Tersimpan di Bunny Stream (Anti-Bocor)' : 'File video aktif'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '5px 10px', borderRadius: 6,
                      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                      fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => { onChange(''); setFileName('') }}
                    style={{
                      padding: '5px 8px', borderRadius: 6,
                      background: 'rgba(239, 68, 68, 0.1)', border: 'none',
                      fontSize: '11px', fontWeight: 600, color: '#ef4444',
                      cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                    title="Hapus video"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Video Preview */}
              <div style={{ width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', background: '#000', position: 'relative' }}>
                {isBunnyUrl ? (
                  <iframe
                    src={value}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                  />
                ) : isDirectVideoUrl ? (
                  <video src={value} controls style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>
                    <PlayCircle size={24} style={{ marginRight: 6 }} /> Video siap diputar
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Drag and Drop Zone */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '26px 16px',
                textAlign: 'center',
                background: isDragging ? 'rgba(16, 185, 129, 0.05)' : 'var(--color-bg)',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Mengunggah ke Bunny Stream... {uploadProgress}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                      Upload langsung dari browser (aman & cepat)
                    </div>
                    <div style={{ width: 200, height: 6, background: 'var(--color-border)', borderRadius: 3, margin: '10px auto 6px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s' }} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelUpload()
                      }}
                      style={{
                        marginTop: 4, background: 'none', border: 'none',
                        color: 'var(--color-error)', fontSize: '11px', fontWeight: 600,
                        cursor: 'pointer', textDecoration: 'underline'
                      }}
                    >
                      Batalkan Upload
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Upload size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Tarik & lepas file video di sini,
                    </span>{' '}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      atau telusuri
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    Mendukung MP4, WebM, MOV, MKV (Maks. 2GB — Powered by Bunny Stream)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. URL Input Mode */}
      {mode === 'url' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Contoh: https://iframe.mediadelivery.net/embed/... atau https://youtu.be/..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none',
              }}
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Helper Badges */}
          {value && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px' }}>
              {isBunnyUrl ? (
                <span style={{
                  padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 4
                }}>
                  <ShieldCheck size={12} /> Bunny Stream terdeteksi (Player Anti-Bocor Aktif)
                </span>
              ) : isYouTubeUrl ? (
                <span style={{
                  padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 4
                }}>
                  <Film size={12} /> YouTube terdeteksi (Click Blocker otomatis aktif)
                </span>
              ) : isDirectVideoUrl ? (
                <span style={{
                  padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 4
                }}>
                  <CheckCircle2 size={12} /> File video langsung terdeteksi
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-tertiary)' }}>
                  Format link didukung (Bunny Stream, YouTube, Vimeo, atau MP4 langsung)
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
