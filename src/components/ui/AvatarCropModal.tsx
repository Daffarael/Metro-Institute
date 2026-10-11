'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ZoomIn, ZoomOut, RotateCw, Move, Check, Loader2 } from 'lucide-react'

interface AvatarCropModalProps {
  imageSrc: string | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (croppedBlob: Blob) => Promise<void> | void
  isUploading?: boolean
}

const CROP_CONTAINER_SIZE = 300 // px
const CROP_RADIUS = 120 // 240px diameter circle

export default function AvatarCropModal({
  imageSrc,
  isOpen,
  onClose,
  onConfirm,
  isUploading = false,
}: AvatarCropModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 })

  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Reset state when a new image is loaded or opened
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1)
      setRotation(0)
      setOffset({ x: 0, y: 0 })

      const img = new Image()
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.src = imageSrc
    }
  }, [isOpen, imageSrc])

  // Compute base scaling so the smallest side fits the crop circle
  const getBaseScale = useCallback(() => {
    if (!imageSize) return 1
    const isRotated90 = rotation % 180 !== 0
    const w = isRotated90 ? imageSize.height : imageSize.width
    const h = isRotated90 ? imageSize.width : imageSize.height
    const diameter = CROP_RADIUS * 2
    return Math.max(diameter / w, diameter / h)
  }, [imageSize, rotation])

  // Drag pan handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isUploading) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialOffset({ ...offset })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !imageSize) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    const baseScale = getBaseScale()
    const scale = baseScale * zoom
    const isRotated90 = rotation % 180 !== 0
    const currentW = (isRotated90 ? imageSize.height : imageSize.width) * scale
    const currentH = (isRotated90 ? imageSize.width : imageSize.height) * scale

    // Max allowed offset to keep the circle covered
    const maxOffsetX = Math.max(0, (currentW - CROP_RADIUS * 2) / 2)
    const maxOffsetY = Math.max(0, (currentH - CROP_RADIUS * 2) / 2)

    const nextX = initialOffset.x + dx
    const nextY = initialOffset.y + dy

    setOffset({
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nextX)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, nextY)),
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  // Zoom via wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isUploading) return
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    setZoom((prev) => Math.max(1, Math.min(3, +(prev + delta).toFixed(2))))
  }

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    if (isUploading) return
    setRotation((prev) => (prev + 90) % 360)
    setOffset({ x: 0, y: 0 })
  }

  // Export cropped circle to Blob
  const handleCrop = async () => {
    if (!imgRef.current || !imageSize || isUploading) return

    const OUTPUT_SIZE = 512 // 512x512 high res
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const baseScale = getBaseScale()
    const scale = baseScale * zoom
    const ratio = OUTPUT_SIZE / (CROP_RADIUS * 2)

    // Center of output canvas
    const cx = OUTPUT_SIZE / 2
    const cy = OUTPUT_SIZE / 2

    ctx.save()
    // Move to canvas center + scaled offset
    ctx.translate(cx + offset.x * ratio, cy + offset.y * ratio)
    ctx.rotate((rotation * Math.PI) / 180)

    const drawW = imageSize.width * scale * ratio
    const drawH = imageSize.height * scale * ratio

    ctx.drawImage(imgRef.current, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onConfirm(blob)
        }
      },
      'image/jpeg',
      0.92
    )
  }

  if (!isOpen || !imageSrc) return null

  const baseScale = getBaseScale()
  const displayScale = baseScale * zoom

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isUploading) onClose()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          style={{
            background: '#ffffff',
            borderRadius: 20,
            width: '100%',
            maxWidth: 440,
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #0f172a)',
                  margin: 0,
                }}
              >
                Sesuaikan Foto Profil
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-tertiary, #64748b)',
                  margin: '3px 0 0',
                }}
              >
                Geser dan atur ukuran agar pas di dalam lingkaran
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isUploading}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
            >
              <X size={16} />
            </button>
          </div>

          {/* Interactive Crop Viewport */}
          <div
            style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#f8fafc',
            }}
          >
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              style={{
                width: CROP_CONTAINER_SIZE,
                height: CROP_CONTAINER_SIZE,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 16,
                background: '#0f172a',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                userSelect: 'none',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              {/* Image element being transformed */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transformOrigin: 'center center',
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${displayScale})`,
                  pointerEvents: 'none',
                  willChange: 'transform',
                }}
              />

              {/* Dark Translucent Mask with Circular Cutout */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                }}
              >
                <svg width="100%" height="100%" viewBox={`0 0 ${CROP_CONTAINER_SIZE} ${CROP_CONTAINER_SIZE}`}>
                  <defs>
                    <mask id="crop-circle-mask">
                      {/* White fills everything (opaque) */}
                      <rect width="100%" height="100%" fill="white" />
                      {/* Black cuts out the circle (transparent) */}
                      <circle
                        cx={CROP_CONTAINER_SIZE / 2}
                        cy={CROP_CONTAINER_SIZE / 2}
                        r={CROP_RADIUS}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  {/* Dimmed backdrop */}
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(15, 23, 42, 0.65)"
                    mask="url(#crop-circle-mask)"
                  />
                  {/* Circular Guide Ring */}
                  <circle
                    cx={CROP_CONTAINER_SIZE / 2}
                    cy={CROP_CONTAINER_SIZE / 2}
                    r={CROP_RADIUS}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.9"
                  />
                </svg>
              </div>

              {/* Drag Hint overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  pointerEvents: 'none',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Move size={11} /> Geser untuk memposisikan
              </div>
            </div>

            {/* Controls: Zoom & Rotate */}
            <div
              style={{
                width: '100%',
                maxWidth: CROP_CONTAINER_SIZE,
                marginTop: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.1).toFixed(2)))}
                disabled={zoom <= 1 || isUploading}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
                  color: zoom <= 1 ? '#cbd5e1' : '#334155',
                  transition: 'all 0.15s',
                }}
              >
                <ZoomOut size={15} />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                disabled={isUploading}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: 'var(--color-primary, #018556)',
                  cursor: 'pointer',
                }}
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
                disabled={zoom >= 3 || isUploading}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
                  color: zoom >= 3 ? '#cbd5e1' : '#334155',
                  transition: 'all 0.15s',
                }}
              >
                <ZoomIn size={15} />
              </button>

              <button
                type="button"
                onClick={handleRotate}
                title="Putar 90 derajat"
                disabled={isUploading}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#334155',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary, #018556)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              background: '#fff',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748b',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isUploading) e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCrop}
              disabled={isUploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--color-primary, #018556)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.8 : 1,
                boxShadow: '0 2px 4px rgba(1, 133, 86, 0.25)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isUploading) e.currentTarget.style.filter = 'brightness(1.08)'
              }}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              {isUploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Check size={15} />
                  Gunakan Foto
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
