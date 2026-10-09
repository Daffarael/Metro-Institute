'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import { FIELD_LABELS, BADGE_LABELS } from '@/lib/utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CleanCombobox from '@/components/admin/CleanCombobox'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AdminBroadcastPage() {
  const [title,       setTitle]       = useState('')
  const [body,        setBody]        = useState('')
  const [targetField, setTargetField] = useState('')
  const [targetBadge, setTargetBadge] = useState('')
  const [result,      setResult]      = useState<string | null>(null)

  const send = useMutation({
    mutationFn: () => api.post('/admin/broadcast', {
      title,
      body,
      targetField: targetField || undefined,
      targetBadge: targetBadge || undefined,
    }),
    onSuccess: (res) => {
      setResult(res.data.message)
      setTitle(''); setBody(''); setTargetField(''); setTargetBadge('')
    },
    onError: () => setResult('Gagal mengirim broadcast. Coba lagi.'),
  })

  const labelStyle: React.CSSProperties = {
    fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: 8,
    color: 'var(--color-text-secondary)'
  }

  const inputStyleClean: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(0,0,0,0.06)',
    fontSize: '14px', outline: 'none',
    background: '#f9fafb',
    color: 'var(--color-text-primary)',
    transition: 'all 0.2s ease',
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, paddingBottom: 60 }}>
      <AdminPageHeader
        title="Broadcast Notifikasi"
        description="Kirim notifikasi ke semua mentee atau segmen tertentu dengan cepat."
      />

      <div style={{
        background: '#ffffff', borderRadius: '24px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)', 
        padding: '32px 40px', marginTop: '24px',
        border: '1px solid rgba(0,0,0,0.03)'
      }}>
        
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Judul Notifikasi <span style={{color: 'var(--color-error)'}}>*</span></label>
          <input
            style={inputStyleClean}
            placeholder="Contoh: Update Kurikulum Baru!"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(1,133,86,0.08)' }}
            onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.boxShadow = 'none' }}
          />
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'right', marginTop: '8px', fontWeight: 500 }}>{title.length}/100</div>
        </div>

        {/* Body */}
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>Isi Pesan <span style={{color: 'var(--color-error)'}}>*</span></label>
          <textarea
            style={{ ...inputStyleClean, resize: 'vertical', fontFamily: 'inherit', minHeight: 120 }}
            placeholder="Tulis pesan broadcast di sini..."
            value={body}
            maxLength={500}
            rows={5}
            onChange={(e) => setBody(e.target.value)}
            onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(1,133,86,0.08)' }}
            onBlur={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.boxShadow = 'none' }}
          />
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'right', marginTop: '8px', fontWeight: 500 }}>{body.length}/500</div>
        </div>

        {/* Targeting */}
        <div style={{ background: '#fafafa', border: '1px solid rgba(0,0,0,0.04)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-primary)' }}>
            Target Penerima <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: '13px' }}>(Opsional)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Berdasarkan Field</label>
              <CleanCombobox
                value={targetField}
                onChange={setTargetField}
                options={[
                  { value: '', label: 'Semua Field' },
                  ...Object.entries(FIELD_LABELS).map(([k, v]) => ({ value: k, label: v }))
                ]}
                placeholder="Semua Field"
                style={{ ...inputStyleClean, background: '#fff', padding: '14px 16px' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Berdasarkan Badge</label>
              <CleanCombobox
                value={targetBadge}
                onChange={setTargetBadge}
                options={[
                  { value: '', label: 'Semua Badge' },
                  ...Object.entries(BADGE_LABELS).map(([k, v]) => ({ value: k, label: v }))
                ]}
                placeholder="Semua Badge"
                style={{ ...inputStyleClean, background: '#fff', padding: '14px 16px' }}
              />
            </div>
          </div>

        </div>

        <button
          disabled={!title || !body || send.isPending}
          onClick={() => send.mutate()}
          style={{ 
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px 24px', borderRadius: '14px', border: 'none',
            background: (!title || !body) ? '#f3f4f6' : 'var(--color-primary)', 
            color: (!title || !body) ? '#9ca3af' : '#fff', 
            fontSize: '15px', fontWeight: 700,
            cursor: (!title || !body || send.isPending) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: (!title || !body || send.isPending) ? 'none' : '0 8px 24px rgba(1,133,86,0.25)'
          }}
          onMouseEnter={e => { if (title && body && !send.isPending) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.05)' } }}
          onMouseLeave={e => { if (title && body && !send.isPending) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)' } }}
        >
          {send.isPending ? 'Mengirim Broadcast...' : 'Kirim Broadcast Sekarang'}
        </button>

        {result && (
          <div style={{ 
            marginTop: '24px', padding: '16px 20px', borderRadius: 12, 
            background: '#f8fafc',
            color: send.isError ? '#ef4444' : '#10b981', 
            fontSize: '14px', fontWeight: 600,
            border: `1px solid ${send.isError ? '#fca5a5' : '#a7f3d0'}`,
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            {send.isError ? (
              <AlertCircle size={20} color="#ef4444" />
            ) : (
              <CheckCircle2 size={20} color="#10b981" />
            )}
            <span style={{ color: '#334155', fontWeight: 500 }}>
              {result}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
