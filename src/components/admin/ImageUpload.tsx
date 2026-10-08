'use client'

import React, { useRef, useState } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran maksimal gambar adalah 2MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Assuming we have POST /admin/upload
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (res.data?.success && res.data?.url) {
        onChange(res.data.url)
        toast.success('Gambar berhasil diunggah')
      } else {
        throw new Error('Gagal mengunggah gambar')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah gambar')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {value ? (
        <div style={{
          position: 'relative', width: '100%', height: 180, borderRadius: 12,
          border: '1px solid var(--color-border)', overflow: 'hidden',
          background: 'var(--color-surface)'
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            type="button"
            onClick={handleRemove}
            style={{
              position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)',
              color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', height: 140, borderRadius: 12, border: '2px dashed var(--color-border)',
            background: 'var(--color-surface)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', gap: 8
          }}
          onMouseEnter={e => { if (!isUploading) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
          onMouseLeave={e => { if (!isUploading) e.currentTarget.style.borderColor = 'var(--color-border)' }}
        >
          {isUploading ? (
            <>
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Mengunggah...</span>
            </>
          ) : (
            <>
              <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: '50%', color: 'var(--color-text-tertiary)' }}>
                <ImageIcon size={24} strokeWidth={1.5} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Klik untuk unggah gambar
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>JPG, PNG (Maks. 2MB)</span>
            </>
          )}
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg, image/png, image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  )
}
