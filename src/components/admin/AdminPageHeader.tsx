'use client'
// src/components/admin/AdminPageHeader.tsx

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

interface AdminPageHeaderProps {
  title: string
  breadcrumbs?: Breadcrumb[]
  /** Tombol aksi di kanan (mis: <Button>+ Buat Baru</Button>) */
  action?: React.ReactNode
  /** Deskripsi singkat di bawah judul */
  description?: string
}

export default function AdminPageHeader({
  title,
  breadcrumbs,
  action,
  description,
}: AdminPageHeaderProps) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 'var(--space-2)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-tertiary)',
        }}>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} />}
              {crumb.href ? (
                <Link href={crumb.href} style={{
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  transition: 'color var(--transition-fast)',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {description && (
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--space-1)',
            }}>
              {description}
            </p>
          )}
        </div>
        {action && (
          <div style={{ flexShrink: 0 }}>
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
