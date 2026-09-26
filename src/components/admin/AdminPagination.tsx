'use client'
// src/components/admin/AdminPagination.tsx

import { usePagination } from '@/hooks/use-pagination'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminPaginationProps {
  page: number
  totalPages: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function AdminPagination({
  page,
  totalPages,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: AdminPaginationProps) {
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: page,
    totalPages,
    paginationItemsToDisplay: 5,
  })

  if (totalPages <= 1 && total <= 10) return null

  const btnStyle = (active?: boolean, disabled?: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    height: 34,
    padding: '0 10px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
    background: active ? 'var(--color-primary)' : 'transparent',
    color: disabled
      ? 'var(--color-text-disabled)'
      : active
        ? '#fff'
        : 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: active ? 700 : 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.15s ease',
    userSelect: 'none',
    flexShrink: 0,
    gap: 4,
  })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '12px 16px',
        borderTop: '1px solid var(--color-border-subtle)',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >

      {/* Right: pagination controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

        {/* Prev */}
        <button
          onClick={() => !( page === 1) && onPageChange(page - 1)}
          disabled={page === 1}
          style={btnStyle(false, page === 1)}
        >
          <ChevronLeft size={15} />
          <span>Prev</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginInline: 4 }}>
          {/* First page + left ellipsis */}
          {showLeftEllipsis && (
            <>
              <button onClick={() => onPageChange(1)} style={btnStyle(false, false)}>1</button>
              <span style={{ color: 'var(--color-text-disabled)', padding: '0 4px', fontSize: 'var(--text-sm)', letterSpacing: 1 }}>···</span>
            </>
          )}

          {/* Page numbers */}
          {pages.map(p => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={btnStyle(page === p, false)}
            >
              {p}
            </button>
          ))}

          {/* Right ellipsis + last page */}
          {showRightEllipsis && (
            <>
              <span style={{ color: 'var(--color-text-disabled)', padding: '0 4px', fontSize: 'var(--text-sm)', letterSpacing: 1 }}>···</span>
              <button onClick={() => onPageChange(totalPages)} style={btnStyle(false, false)}>{totalPages}</button>
            </>
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => !(page === totalPages) && onPageChange(page + 1)}
          disabled={page === totalPages}
          style={btnStyle(false, page === totalPages)}
        >
          <span>Next</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
