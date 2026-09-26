// src/components/admin/AdminStatusChip.tsx
// Chip warna konsisten berdasarkan enum Prisma:
// BootcampStatus, ContentStatus, RegistrationStatus, TxStatus, AttemptStatus

interface ChipStyle { bg: string; color: string; label: string }

const STATUS_MAP: Record<string, ChipStyle> = {
  // BootcampStatus
  DRAFT:          { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  PUBLISHED:      { bg: '#E0F2FE', color: '#0369A1', label: 'Tayang' },
  OPEN:           { bg: '#E8F5F0', color: '#018556', label: 'Buka Beli' },
  ONGOING:        { bg: '#ECFDF5', color: '#059669', label: 'Berjalan' },
  COMPLETED:      { bg: '#F3F4F6', color: '#374151', label: 'Selesai' },
  // RegistrationStatus
  ACTIVE:         { bg: '#E8F5F0', color: '#018556', label: 'Aktif' },
  REMOVED:        { bg: '#FEF2F2', color: '#DC2626', label: 'Dikeluarkan' },
  // TxStatus
  PENDING:        { bg: '#FEF3C7', color: '#D97706', label: 'Menunggu' },
  SUCCESS:        { bg: '#E8F5F0', color: '#018556', label: 'Berhasil' },
  FAILED:         { bg: '#FEF2F2', color: '#DC2626', label: 'Gagal' },
  CANCELLED:      { bg: '#F3F4F6', color: '#6B7280', label: 'Dibatalkan' },
  REFUNDED:       { bg: '#F5F3FF', color: '#7C3AED', label: 'Refunded' },
  // AttemptStatus
  PENDING_REVIEW: { bg: '#FEF3C7', color: '#D97706', label: 'Belum Dinilai' },
  GRADED:         { bg: '#E8F5F0', color: '#018556', label: 'Sudah Dinilai' },
  // UserStatus
  SUSPENDED:      { bg: '#FEF2F2', color: '#DC2626', label: 'Suspended' },
}

interface AdminStatusChipProps {
  status: string
  label?: string
  size?: 'sm' | 'md'
}

export default function AdminStatusChip({ status, label, size = 'sm' }: AdminStatusChipProps) {
  const style = STATUS_MAP[status?.toUpperCase()] ?? { bg: '#F3F4F6', color: '#6B7280', label: status }
  const displayLabel = label ?? style.label

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 8px' : '4px 12px',
      borderRadius: 'var(--radius-full)',
      background: style.bg,
      color: style.color,
      fontSize: size === 'sm' ? '11px' : 'var(--text-xs)',
      fontWeight: 600,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
      lineHeight: 1.6,
    }}>
      {displayLabel}
    </span>
  )
}
