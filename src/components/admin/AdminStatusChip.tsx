// src/components/admin/AdminStatusChip.tsx
// Chip warna konsisten berdasarkan enum Prisma:
// BootcampStatus, ContentStatus, RegistrationStatus, TxStatus, AttemptStatus

interface ChipStyle { color: string; label: string }

const STATUS_MAP: Record<string, ChipStyle> = {
  // BootcampStatus & Webinar
  DRAFT:          { color: '#4B5563', label: 'Draf' }, // Dark Gray
  PUBLISHED:      { color: '#018556', label: 'Tayang' }, // Metro Green
  OPEN:           { color: '#018556', label: 'Pendaftaran Dibuka' }, // Green
  CLOSED:         { color: '#DC2626', label: 'Pendaftaran Ditutup' }, // Deep Red
  ONGOING:        { color: '#2563EB', label: 'Sedang Berlangsung' }, // Blue
  COMPLETED:      { color: '#475569', label: 'Berakhir' }, // Deep Slate/Gray
  ENDED:          { color: '#475569', label: 'Berakhir' },
  // RegistrationStatus
  ACTIVE:         { color: '#018556', label: 'Aktif' },
  INACTIVE:       { color: '#DC2626', label: 'Nonaktif' },
  EXPIRED:        { color: '#DC2626', label: 'Kadaluarsa' },
  FULL:           { color: '#D97706', label: 'Habis' },
  REMOVED:        { color: '#EF4444', label: 'Dikeluarkan' },
  // TxStatus
  PENDING:        { color: '#D97706', label: 'Menunggu' }, // Deep Amber
  SUCCESS:        { color: '#018556', label: 'Berhasil' }, // Metro Green
  FAILED:         { color: '#DC2626', label: 'Gagal' },
  CANCELLED:      { color: '#4B5563', label: 'Dibatalkan' },
  REFUNDED:       { color: '#8B5CF6', label: 'Dikembalikan' }, // Purple
  // AttemptStatus
  PENDING_REVIEW: { color: '#F59E0B', label: 'Belum Dinilai' },
  GRADED:         { color: '#10B981', label: 'Sudah Dinilai' },
  // UserStatus
  SUSPENDED:      { color: '#DC2626', label: 'Ditangguhkan' },
  // Types
  BOOTCAMP:       { color: '#018556', label: 'Bootcamp' },
  MINI_COURSE:    { color: '#063D2A', label: 'Mini Course' },
  WEBINAR:        { color: '#D97706', label: 'Inspire Talk' },
  INSPIRE_TALK:   { color: '#D97706', label: 'Inspire Talk' },
}

interface AdminStatusChipProps {
  status?: string | boolean | null
  label?: string
  size?: 'sm' | 'md'
}

export default function AdminStatusChip({ status, label, size = 'sm' }: AdminStatusChipProps) {
  let resolvedStatus = typeof status === 'boolean'
    ? (status ? 'PUBLISHED' : 'DRAFT')
    : (status ?? '').toString().toUpperCase()

  if (resolvedStatus === 'TRUE') resolvedStatus = 'PUBLISHED'
  if (resolvedStatus === 'FALSE') resolvedStatus = 'DRAFT'

  const style = STATUS_MAP[resolvedStatus] ?? { color: '#6B7280', label: resolvedStatus || 'Draf' }
  const displayLabel = label ?? (style.label || 'Draf')

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: '4px',
      border: '1px solid #e5e7eb',
      background: '#ffffff',
      color: style.color,
      fontSize: size === 'sm' ? '12px' : '13px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
    }}>
      {displayLabel}
    </span>
  )
}
