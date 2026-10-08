/* eslint-disable */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/lib/utils'
import '../login/Login10.css'

const completeSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string()
    .min(9, 'Nomor WhatsApp minimal 9 digit')
    .max(15, 'Nomor WhatsApp terlalu panjang')
    .regex(/^[0-9+]+$/, 'Hanya boleh angka dan tanda +'),
})
type CompleteForm = z.infer<typeof completeSchema>

export default function CompleteRegistrationPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [loadingConfig, setLoadingConfig] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompleteForm>({ resolver: zodResolver(completeSchema) })

  useEffect(() => {
    // If not logged in, or if phone is already set, redirect away
    if (!user) {
      router.replace('/login')
      return
    }
    if (user.phone) {
      router.replace(user.skillTestDone ? ROUTES.BASECAMP : ROUTES.SKILL_TEST)
      return
    }

    // Pre-fill name from email prefix
    if (user.email) {
      setValue('name', user.email.split('@')[0])
    } else if (user.name) {
      setValue('name', user.name)
    }
    setLoadingConfig(false)
  }, [user, router, setValue])

  const onSubmit = async (data: CompleteForm) => {
    try {
      // Update user profile in backend
      const res = await api.patch('/users/me', {
        name: data.name,
        phone: data.phone
      })
      
      // Update local store
      setUser({ ...user, name: data.name, phone: data.phone } as any)
      
      toast.success('Pendaftaran via Google berhasil diselesaikan!')
      router.push(ROUTES.SKILL_TEST) // Direct to skill test
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data')
    }
  }

  if (loadingConfig) return null

  return (
    <section className="page login-10">
      <div className="card">
        {/* We use a solid color background since we don't have the background image URL handy here, or we can fetch it */}
        <div className="card-bg" style={{ backgroundColor: '#050505' }} />

        <div className="hero login">
          <img src="/logo-metro-clean.png" alt="Metro Institute" className="hero-logo" />
          <h2>Langkah Terakhir!</h2>
          <p>
            Akun Google Anda berhasil dihubungkan. Lengkapi data di bawah ini untuk sertifikat dan komunikasi kelas Anda.
          </p>
        </div>

        <div className="form login" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            
            <div className="input-group">
              <label>Nama Lengkap (Untuk Sertifikat)</label>
              <input 
                {...register('name')}
                type="text" 
                className={errors.name ? 'error' : ''}
                placeholder="Budi Santoso"
              />
              {errors.name && <span className="error-text">{errors.name.message}</span>}
            </div>

            <div className="input-group">
              <label>Nomor WhatsApp Aktif</label>
              <input 
                {...register('phone')}
                type="text" 
                className={errors.phone ? 'error' : ''}
                placeholder="081234567890"
              />
              {errors.phone && <span className="error-text">{errors.phone.message}</span>}
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjut'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
