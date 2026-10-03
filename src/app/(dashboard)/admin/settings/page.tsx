'use client'
// src/app/admin/settings/page.tsx
// Pengaturan akun admin (ganti password)
// Sesuai concept doc Section 18 + design_superadmin.md

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Eye, EyeOff, Check } from 'lucide-react'
import api from '@/lib/axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { toast } from 'sonner'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Wajib diisi'),
  newPassword:     z.string().min(8, 'Minimal 8 karakter'),
  confirmPassword: z.string().min(1, 'Wajib diisi'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Password baru tidak cocok',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)',
  background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none',
}

function PasswordField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input {...props} type={show ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 36 }} />
        <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.patch('/admin/password', { currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      toast.success('Password berhasil diubah.')
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Gagal mengubah password.'),
  })

  return (
    <div>
      <AdminPageHeader title="Pengaturan" description="Kelola akun dan keamanan admin." />

      <div style={{ maxWidth: 520 }}>
        {/* Ganti Password */}
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="var(--color-primary)" />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>Ganti Password</h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Gunakan password yang kuat dan tidak mudah ditebak.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <PasswordField label="Password Saat Ini *" {...register('currentPassword')} placeholder="••••••••" />
            {errors.currentPassword && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: -8 }}>{errors.currentPassword.message}</p>}

            <PasswordField label="Password Baru * (minimal 8 karakter)" {...register('newPassword')} placeholder="••••••••" />
            {errors.newPassword && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: -8 }}>{errors.newPassword.message}</p>}

            <PasswordField label="Konfirmasi Password Baru *" {...register('confirmPassword')} placeholder="••••••••" />
            {errors.confirmPassword && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: -8 }}>{errors.confirmPassword.message}</p>}

            <button type="submit" disabled={mutation.isPending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer', opacity: mutation.isPending ? 0.7 : 1 }}>
              <Check size={16} /> {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>

        {/* Info versi */}
        <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--color-bg)' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Metro Institute Admin Panel · v2.0 · 2024</p>
        </div>
      </div>
    </div>
  )
}
