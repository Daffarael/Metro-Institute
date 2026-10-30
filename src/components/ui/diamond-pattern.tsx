'use client'

import { useId } from 'react'

interface DiamondPatternProps {
  size?: number
  diamondColor?: string
  opacity?: number
  className?: string
}

/**
 * Pola belah ketupat tegas khas identitas Metro Institute
 * Menggunakan warna hijau solid tanpa transparansi putih agar tidak pudar
 */
export function DiamondPattern({
  size = 76,
  diamondColor = '#0F4432',
  opacity,
  className = '',
}: DiamondPatternProps) {
  const id = useId().replace(/:/g, '')
  const half = size / 2

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id={`diamond-${id}`}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          {opacity !== undefined ? (
            <>
              <rect width={half} height={half} fill="#ffffff" fillOpacity={opacity} />
              <rect x={half} y={half} width={half} height={half} fill="#ffffff" fillOpacity={opacity} />
            </>
          ) : (
            <>
              <rect width={half} height={half} fill={diamondColor} />
              <rect x={half} y={half} width={half} height={half} fill={diamondColor} />
            </>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#diamond-${id})`} />
    </svg>
  )
}

export default DiamondPattern
