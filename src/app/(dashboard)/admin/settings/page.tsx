'use client'
// src/app/admin/settings/page.tsx
// Pengaturan akun admin

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { toast } from 'sonner'

// ─── Schemas ───────────────────────────────────────────────
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Wajib diisi'),
  newPassword:     z.string().min(8, 'Minimal 8 karakter'),
  confirmPassword: z.string().min(1, 'Wajib diisi'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Password baru tidak cocok',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
})
type ProfileForm = z.infer<typeof profileSchema>

// ─── UI Components ─────────────────────────────────────────
function InputField({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</label>
      <input
        {...props}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 6,
          border: error ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
          fontSize: 14, background: '#fff',
          color: 'var(--color-text-primary)', outline: 'none',
          boxSizing: 'border-box', transition: 'border-color 0.15s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          WebkitBoxShadow: '0 0 0 1000px #fff inset, 0 1px 2px rgba(0,0,0,0.02)',
          WebkitTextFillColor: 'var(--color-text-primary)',
        } as React.CSSProperties}
        onFocus={e => { if (!error) e.target.style.borderColor = 'var(--color-primary)' }}
        onBlur={e => { if (!error) e.target.style.borderColor = 'var(--color-border)' }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{error}</span>}
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{description}</div>
      </div>
      <button
        type="button"
        onClick={onChange}
        style={{
          width: 40, height: 22, borderRadius: 24, padding: 2, cursor: 'pointer',
          background: checked ? 'var(--color-primary)' : '#e0e0e0',
          border: 'none',
          display: 'flex', alignItems: 'center',
          transition: 'background 0.2s', flexShrink: 0
        }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transform: `translateX(${checked ? 18 : 0}px)`, transition: 'transform 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
        }} />
      </button>
    </div>
  )
}

function PasswordField({
  label, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          type={show ? 'text' : 'password'}
          style={{
            width: '100%', padding: '8px 12px', paddingRight: 40, borderRadius: 6,
            border: error ? '1px solid var(--color-error)' : '1px solid var(--color-border)',
            fontSize: 14, background: '#fff',
            color: 'var(--color-text-primary)', outline: 'none',
            boxSizing: 'border-box', transition: 'border-color 0.15s',
            WebkitBoxShadow: '0 0 0 1000px #fff inset',
            WebkitTextFillColor: 'var(--color-text-primary)',
          } as React.CSSProperties}
          onFocus={e => { if (!error) e.target.style.borderColor = 'var(--color-primary)' }}
          onBlur={e => { if (!error) e.target.style.borderColor = 'var(--color-border)' }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{
            position: 'absolute', right: 12, top: 9,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-tertiary)', padding: 0
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{error}</span>}
    </div>
  )
}

// ─── Section Card ───────────────────────────────────────────
function Section({ title, description, children, footer }: {
  title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode
}) {
  return (
    <div style={{ 
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      marginBottom: 24,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      overflow: 'hidden'
    }}>
      <div style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {description}
          </p>
        )}
        <div style={{ marginTop: 24 }}>
          {children}
        </div>
      </div>
      
      {footer && (
        <div style={{
          padding: '12px 24px',
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center'
        }}>
          {footer}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const { user, setUser } = useAuthStore()

  // Profile Form
  const { register: regProfile, handleSubmit: submitProfile, formState: { errors: errProfile } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      email: user?.email || '',
    }
  })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => api.patch('/admin/profile', data),
    onSuccess: (res) => {
      setUser(res.data.data)
      toast.success('Profil berhasil diperbarui.')
    },
    onError: () => toast.error('Gagal memperbarui profil.'),
  })

  // Password Form
  const { register: regPass, handleSubmit: submitPass, reset: resetPass, formState: { errors: errPass } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const passMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.patch('/admin/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => { toast.success('Password berhasil diubah.'); resetPass() },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Gagal mengubah password.'),
  })

  // Notifications state
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPromo, setNotifPromo] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A'

  return (
    <div>
      <AdminPageHeader title="Pengaturan" description="Kelola informasi akun dan preferensi sistem." />

      {/* ── Profil ── */}
      <form onSubmit={submitProfile(d => profileMutation.mutate(d))}>
        <Section 
          title="Informasi Profil" 
          description="Perbarui identitas akun Anda di platform."
          footer={
            <button
              type="submit"
              disabled={profileMutation.isPending}
              style={{
                padding: '6px 14px', borderRadius: 6,
                border: 'none',
                background: 'var(--color-primary)', color: '#fff',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                opacity: profileMutation.isPending ? 0.7 : 1,
              }}
            >
              {profileMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 600, flexShrink: 0,
              }}>
                {initials}
              </div>
              <button type="button" style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid var(--color-border)',
                background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}>
                Unggah Foto
              </button>
            </div>
            
            <InputField label="Nama Lengkap" error={errProfile.name?.message} placeholder="John Doe" {...regProfile('name')} />
            <InputField label="Alamat Email" error={errProfile.email?.message} placeholder="admin@domain.com" {...regProfile('email')} />
          </div>
        </Section>
      </form>

      {/* ── Notifikasi ── */}
      <Section 
        title="Preferensi Notifikasi" 
        description="Atur jenis laporan dan email yang ingin Anda terima."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Toggle
            label="Laporan Transaksi"
            description="Terima email setiap ada transaksi pembelian Bootcamp atau Mini Course yang berhasil."
            checked={notifEmail}
            onChange={() => { setNotifEmail(!notifEmail); toast.success('Preferensi diperbarui') }}
          />
          <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />
          <Toggle
            label="Pembaruan Sistem"
            description="Dapatkan informasi mengenai fitur baru dan jadwal pemeliharaan server."
            checked={notifPromo}
            onChange={() => { setNotifPromo(!notifPromo); toast.success('Preferensi diperbarui') }}
          />
        </div>
      </Section>

      {/* ── Keamanan ── */}
      <form onSubmit={submitPass(d => passMutation.mutate(d))}>
        <Section 
          title="Keamanan Sandi" 
          description="Ubah password Anda secara berkala untuk menjaga keamanan akun."
          footer={
            <button
              type="submit"
              disabled={passMutation.isPending}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: 'var(--color-primary)', color: '#fff',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                opacity: passMutation.isPending ? 0.7 : 1,
              }}
            >
              {passMutation.isPending ? 'Menyimpan...' : 'Ubah Sandi'}
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460 }}>
            <PasswordField label="Password saat ini" error={errPass.currentPassword?.message} placeholder="••••••••" {...regPass('currentPassword')} />
            <PasswordField label="Password baru (min. 8 karakter)" error={errPass.newPassword?.message} placeholder="••••••••" {...regPass('newPassword')} />
            <PasswordField label="Konfirmasi password baru" error={errPass.confirmPassword?.message} placeholder="••••••••" {...regPass('confirmPassword')} />
          </div>
        </Section>
      </form>

    </div>
  )
}
