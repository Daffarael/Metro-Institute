// src/components/admin/AdminTableSkeleton.tsx
// 8 baris shimmer saat loading data tabel

interface AdminTableSkeletonProps {
  rows?: number
  cols?: number
}

function SkeletonLine({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: 'var(--radius-sm)',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  )
}

export default function AdminTableSkeleton({ rows = 8, cols = 6 }: AdminTableSkeletonProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width="60%" height={12} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 'var(--space-4)',
            padding: 'var(--space-4)',
            borderBottom: row < rows - 1 ? '1px solid var(--color-border-subtle)' : 'none',
          }}
        >
          {Array.from({ length: cols }).map((_, col) => (
            <SkeletonLine key={col} width={col === 0 ? '40%' : col === cols - 1 ? '50%' : '80%'} />
          ))}
        </div>
      ))}
    </div>
  )
}
