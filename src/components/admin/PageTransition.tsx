'use client'

import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'

// ── Page Transition ─────────────────────────────────────────────
// Pure opacity fade — no movement, no stagger, fully consistent
// across all admin pages.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const key = pathname.split('/').slice(0, 3).join('/')

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.45,
        ease: [0.4, 0, 0.2, 1], // easeInOut — mulai pelan, akhiri pelan
      }}
    >
      {children}
    </motion.div>
  )
}

// ── Reveal — no-op wrapper (kept for import compatibility) ──────
// Semua halaman yang sudah pakai <Reveal> tidak perlu diubah,
// tapi tidak ada efek animasi tambahan — PageTransition saja yang kerja.
export function Reveal({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}
