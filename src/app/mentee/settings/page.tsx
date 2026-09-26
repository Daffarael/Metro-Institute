'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Mail, Phone, FileText, Building2, Upload, Save, Lock, Eye, EyeOff, Loader2, Camera } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { getInitials, FIELD_LABELS } from '@/lib/utils'

const profileSchema = z.object({
  name: z.string().min(2, 'Minimal 2 karakter').max(80),
  phone: z.string().min(10, 'Nomor tidak valid').optional().or(z.literal('')),
  bio: z.string().max(500, 'Maksimal 500 karakter').optional(),
  status: z.string().max(100).optional(),
  institution: z.string().max(100).optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Wajib diisi'),
  newPassword: z.string().min(8, 'Minimal 8 karakter').regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors, isSubmitting: isSavingProfile } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      status: user?.status || '',
      institution: user?.institution || '',
    },
  })

  const { register: regPassword, handleSubmit: handlePassword, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: isSavingPassword } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const saveProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => api.patch('/users/me', data).then((r) => r.data),
    onSuccess: (data) => {
      setUser({ ...user!, ...data.data })
      toast.success('Profil berhasil disimpan')
    },
    onError: () => toast.error('Gagal menyimpan profil'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Password berhasil diubah')
      resetPassword()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal mengubah password'
      toast.error(msg)
    },
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran foto maksimal 5MB'); return }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = async () => {
    if (!photoFile) return
    setIsUploadingPhoto(true)
    const fd = new FormData()
    fd.append('photo', photoFile)
    try {
      const res = await api.post('/users/me/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUser({ ...user!, photoUrl: res.data.data.photoUrl })
      setPhotoPreview(null)
      setPhotoFile(null)
      toast.success(`Foto profil diperbarui${res.data.xpEarned ? ` +${res.data.xpEarned} XP!` : ''}`)
    } catch {
      toast.error('Gagal mengunggah foto')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const TABS = [
    { id: 'profile', label: '👤 Profil' },
    { id: 'password', label: '🔐 Password' },
    { id: 'notifications', label: '🔔 Notifikasi' },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="animate-fade-in">
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>Pengaturan</h1>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }} className="animate-fade-in">
          {/* Photo */}
          <div className="card card-body">
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Foto Profil</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
              <div style={{ position: 'relative' }}>
                <div className="avatar" style={{ width: 80, height: 80, fontSize: 28 }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{user ? getInitials(user.name) : '?'}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--color-primary)', border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={12} color="white" />
                </button>
              </div>
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
                    <Upload size={14} /> Pilih Foto
                  </button>
                  {photoFile && (
                    <button
                      onClick={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="btn btn-primary btn-sm"
                    >
                      {isUploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {isUploadingPhoto ? 'Mengupload...' : 'Simpan Foto'}
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2)' }}>
                  JPG, PNG. Maks 5MB. Foto pertama = +20 XP 🎉
                </p>
              </div>
            </div>
          </div>

          {/* Profile form */}
          <div className="card card-body">
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Informasi Pribadi</h2>
            <form onSubmit={handleProfile(saveProfileMutation.mutate)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-name">Nama Lengkap</label>
                  <div className="input-wrapper">
                    <User size={15} className="input-icon-left" />
                    <input id="s-name" type="text" className={`form-input has-icon-left ${profileErrors.name ? 'error' : ''}`} {...regProfile('name')} />
                  </div>
                  {profileErrors.name && <span className="form-error">{profileErrors.name.message}</span>}
                  <span className="form-hint">⚠️ Tercetak di sertifikat</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-wrapper">
                    <Mail size={15} className="input-icon-left" />
                    <input type="email" value={user?.email || ''} readOnly className="form-input has-icon-left" style={{ background: 'var(--color-bg)', opacity: 0.7 }} />
                  </div>
                  <span className="form-hint">Email tidak bisa diubah</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="s-phone">Nomor WhatsApp</label>
                <div className="input-wrapper">
                  <Phone size={15} className="input-icon-left" />
                  <input id="s-phone" type="tel" className="form-input has-icon-left" {...regProfile('phone')} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="s-institution">Institusi / Perusahaan</label>
                <div className="input-wrapper">
                  <Building2 size={15} className="input-icon-left" />
                  <input id="s-institution" type="text" placeholder="Universitas / Startup / ..." className="form-input has-icon-left" {...regProfile('institution')} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="s-status">Status Saat Ini</label>
                <input id="s-status" type="text" placeholder="Mahasiswa, Fresh Graduate, Software Engineer, ..." className="form-input" {...regProfile('status')} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="s-bio">Bio</label>
                <textarea id="s-bio" className="form-textarea" rows={3} placeholder="Ceritakan sedikit tentang dirimu..." {...regProfile('bio')} />
                <span className="form-hint">Maks 500 karakter</span>
              </div>

              {user?.selectedField && (
                <div className="form-group">
                  <label className="form-label">Bidang yang Dipilih</label>
                  <div style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--color-primary-xlight)', border: '1.5px solid var(--color-primary-light)',
                    borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)',
                  }}>
                    {FIELD_LABELS[user.selectedField]}
                  </div>
                  <span className="form-hint">Bidang dipilih saat Skill Test. Hubungi admin untuk mengubah.</span>
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary ${isSavingProfile ? 'btn-loading' : ''}`}
                disabled={isSavingProfile}
                style={{ alignSelf: 'flex-start', gap: 'var(--space-2)' }}
              >
                {!isSavingProfile && <><Save size={15} /> Simpan Perubahan</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Password Tab ────────────────────────────────────── */}
      {activeTab === 'password' && (
        <div className="card card-body animate-fade-in">
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Ubah Password</h2>
          {user?.googleId && !user?.passwordHash && (
            <div style={{ padding: 'var(--space-4)', background: 'var(--color-primary-xlight)', border: '1px solid var(--color-primary-light)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
              🔗 Akun ini terhubung via Google. Kamu bisa menambahkan password untuk login dengan email juga.
            </div>
          )}
          <form
            onSubmit={handlePassword((data) => changePasswordMutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword }))}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="pw-current">Password Saat Ini</label>
              <div className="input-wrapper">
                <Lock size={15} className="input-icon-left" />
                <input id="pw-current" type={showCurrentPw ? 'text' : 'password'} className={`form-input has-icon-left has-icon-right ${passwordErrors.currentPassword ? 'error' : ''}`} {...regPassword('currentPassword')} />
                <button type="button" className="input-icon-right" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }} onClick={() => setShowCurrentPw(!showCurrentPw)}>
                  {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordErrors.currentPassword && <span className="form-error">{passwordErrors.currentPassword.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pw-new">Password Baru</label>
              <div className="input-wrapper">
                <Lock size={15} className="input-icon-left" />
                <input id="pw-new" type={showNewPw ? 'text' : 'password'} className={`form-input has-icon-left has-icon-right ${passwordErrors.newPassword ? 'error' : ''}`} {...regPassword('newPassword')} />
                <button type="button" className="input-icon-right" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }} onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordErrors.newPassword && <span className="form-error">{passwordErrors.newPassword.message}</span>}
              <span className="form-hint">Min 8 karakter, huruf besar, huruf kecil, dan angka</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pw-confirm">Konfirmasi Password Baru</label>
              <div className="input-wrapper">
                <Lock size={15} className="input-icon-left" />
                <input id="pw-confirm" type="password" className={`form-input has-icon-left ${passwordErrors.confirmPassword ? 'error' : ''}`} {...regPassword('confirmPassword')} />
              </div>
              {passwordErrors.confirmPassword && <span className="form-error">{passwordErrors.confirmPassword.message}</span>}
            </div>

            <button type="submit" disabled={isSavingPassword} className={`btn btn-primary ${isSavingPassword ? 'btn-loading' : ''}`} style={{ alignSelf: 'flex-start', gap: 'var(--space-2)' }}>
              {!isSavingPassword && <><Lock size={15} /> Ubah Password</>}
            </button>
          </form>
        </div>
      )}

      {/* ── Notification Prefs Tab ──────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="card card-body animate-fade-in">
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Preferensi Notifikasi</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Fitur ini akan segera tersedia.</p>
        </div>
      )}
    </div>
  )
}
