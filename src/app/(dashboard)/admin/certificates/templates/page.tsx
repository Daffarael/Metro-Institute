'use client'

import { useState } from 'react'
import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import { toast } from 'sonner'
import { Edit, Trash, Plus } from 'lucide-react'

export default function CertificateTemplatesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin', 'certificate-templates'],
    queryFn: () => api.get('/admin/certificate-templates').then(r => r.data),
  })

  const templates = response?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/certificate-templates/${id}`),
    onSuccess: () => {
      toast.success('Template berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['admin', 'certificate-templates'] })
    },
    onError: () => toast.error('Gagal menghapus template')
  })

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus template ini?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Template Sertifikat"
        description="Kelola desain dan tata letak sertifikat dinamis."
        breadcrumbs={[
          { label: 'Sertifikat', href: '/admin/certificates' },
          { label: 'Template' }
        ]}
        action={
          <button
            onClick={() => router.push('/admin/certificates/templates/new')}
            style={{ padding: '9px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', transition: 'filter 0.2s', boxShadow: '0 2px 4px rgba(1,133,86,0.1)' }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.05)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            <Plus size={15} /> Buat Template
          </button>
        }
      />

      {isLoading ? <AdminTableSkeleton rows={5} cols={5} /> : templates.length === 0 ? (
        <div className="card">
          <AdminEmptyState type="empty" message="Belum ada template sertifikat." />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                {['Nama Template', 'Tipe', 'Status', 'Dibuat Pada', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl: any) => (
                <tr key={tpl.id}
                  style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {tpl.name}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                    {tpl.type === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {tpl.isActive ? (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Aktif</span>
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>Nonaktif</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {new Date(tpl.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => router.push(`/admin/certificates/templates/${tpl.id}`)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                        title="Edit Template"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                        title="Hapus Template"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
