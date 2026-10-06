// src/components/admin/AdminStatusChip.tsx
// Chip warna konsisten berdasarkan enum Prisma:
// BootcampStatus, ContentStatus, RegistrationStatus, TxStatus, AttemptStatus

interface ChipStyle { color: string; label: string }

const STATUS_MAP: Record<string, ChipStyle> = {
  // BootcampStatus
  DRAFT:          { color: '#6B7280', label: 'Draft' }, // Gray
  PUBLISHED:      { color: '#0ea5e9', label: 'Tayang' }, // Sky blue
  OPEN:           { color: '#018556', label: 'Buka Beli' }, // Green
  ONGOING:        { color: '#10B981', label: 'Berjalan' }, // Emerald
  COMPLETED:      { color: '#374151', label: 'Selesai' }, // Dark Gray
  // RegistrationStatus
  ACTIVE:         { color: '#018556', label: 'Aktif' },
  REMOVED:        { color: '#EF4444', label: 'Dikeluarkan' },
  // TxStatus
  PENDING:        { color: '#F59E0B', label: 'Menunggu' }, // Amber
  SUCCESS:        { color: '#10B981', label: 'Berhasil' }, // Emerald
  FAILED:         { color: '#EF4444', label: 'Gagal' },
  CANCELLED:      { color: '#6B7280', label: 'Dibatalkan' },
  REFUNDED:       { color: '#8B5CF6', label: 'Refunded' }, // Purple
  // AttemptStatus
  PENDING_REVIEW: { color: '#F59E0B', label: 'Belum Dinilai' },
  GRADED:         { color: '#10B981', label: 'Sudah Dinilai' },
  // UserStatus
  SUSPENDED:      { color: '#EF4444', label: 'Suspended' },
  // Types
  BOOTCAMP:       { color: '#018556', label: 'Bootcamp' },
  MINI_COURSE:    { color: '#0ea5e9', label: 'Mini Course' },
}

interface AdminStatusChipProps {
  status: string
  label?: string
  size?: 'sm' | 'md'
}

export default function AdminStatusChip({ status, label, size = 'sm' }: AdminStatusChipProps) {
  const style = STATUS_MAP[status?.toUpperCase()] ?? { color: '#6B7280', label: status }
  const displayLabel = label ?? style.label

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: '4px',
      border: '1px solid var(--color-border)',
      background: '#ffffff',
      color: style.color,
      fontSize: size === 'sm' ? '12px' : '13px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
    }}>
      {displayLabel}
    </span>
  )
}
