'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Upload, Link as LinkIcon, Film, CheckCircle2, X, Loader2, AlertCircle } from 'lucide-react'
import api from '@/lib/axios'
import { toast } from 'sonner'

interface VideoInputWithUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function VideoInputWithUpload({ value, onChange }: VideoInputWithUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(
    value && !value.includes('/uploads/') && !value.includes('cloudinary') ? 'url' : 'upload'
  )
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate video type
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      toast.error('File harus berupa video (MP4, WebM, MOV, MKV)')
      return
    }

    // Validate size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Ukuran video maksimal 100MB')
      return
    }

    setFileName(file.name)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          }
        },
      })

      if (response.data?.url) {
        onChange(response.data.url)
        toast.success('Video berhasil diunggah! 🎉')
      } else {
        throw new Error('Gagal mendapatkan URL video dari server')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(err.response?.data?.message || 'Gagal mengunggah video. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
    }
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

  const isYouTube = value && (value.includes('youtu.be') || value.includes('youtube.com'))
  const isDirectVideo = value && (value.includes('/uploads/') || value.includes('cloudinary') || value.match(/\.(mp4|webm|mov)$/i))

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
          <Upload size={14} /> Upload File Video (Drag & Drop)
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

          {value && isDirectVideo && !isUploading ? (
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
                    <Film size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {fileName || 'Video Terunggah'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> File video aktif
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
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Mini Preview */}
              <div style={{ maxHeight: 140, borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                <video src={value} controls style={{ width: '100%', maxHeight: 140, display: 'block' }} />
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
                padding: '24px 16px',
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
                      Mengunggah video... {uploadProgress}%
                    </div>
                    <div style={{ width: 180, height: 6, background: 'var(--color-border)', borderRadius: 3, margin: '8px auto 0', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s' }} />
                    </div>
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
                    Mendukung MP4, WebM, MOV, MKV (Maks. 100MB)
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
              placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/..."
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

          {/* Helper Badge */}
          {value && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px' }}>
              {isYouTube ? (
                <span style={{
                  padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 4
                }}>
                  <Film size={12} /> YouTube terdeteksi (Click Blocker otomatis aktif)
                </span>
              ) : isDirectVideo ? (
                <span style={{
                  padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 4
                }}>
                  <CheckCircle2 size={12} /> File video langsung terdeteksi
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-tertiary)' }}>
                  Format link didukung (YouTube, Vimeo, atau link video langsung)
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
