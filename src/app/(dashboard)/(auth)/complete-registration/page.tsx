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
import { DiamondPattern } from '@/components/ui/diamond-pattern'
import { PopButton } from '@/components/ui/PopButton'
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
  const [loginImageUrl, setLoginImageUrl] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompleteForm>({ resolver: zodResolver(completeSchema) })

  useEffect(() => {
    // Sync document title
    if (typeof document !== 'undefined') {
      document.title = 'Lengkapi Profil | Metro Institute'
    }

    // Fetch background image if configured
    api.get('/homepage-config')
      .then(r => {
        const configs: { key: string; value: string }[] = r.data.data ?? []
        const found = configs.find(c => c.key === 'login_image_url')
        if (found?.value) setLoginImageUrl(found.value)
      })
      .catch(() => {})
  }, [])

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
      
      toast.success('Pendaftaran berhasil diselesaikan!')
      router.push(ROUTES.SKILL_TEST) // Direct to skill test
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data')
    }
  }

  if (loadingConfig) return null

  return (
    <section className="page login-10">
      <div className="card">
        {/* Dynamic / Patterned Background identical to Login card */}
        <div
          className="card-bg"
          style={loginImageUrl ? { backgroundImage: `url(${loginImageUrl})` } : {}}
        >
          {!loginImageUrl && <DiamondPattern size={64} diamondColor="#0F4432" />}
        </div>

        <div className="hero login">
          <img src="/metro-logo.png" alt="Metro Institute" className="hero-logo" />
          <h2>Langkah Terakhir!</h2>
          <p>
            Lengkapi data berikut untuk penerbitan sertifikat kelulusan Anda.
          </p>
        </div>

        <div className="form login" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2>Lengkapi Data</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            
            <div className="input-group">
              <label>Nama Lengkap (Untuk Sertifikat)</label>
              <input 
                {...register('name')}
                type="text" 
                className={errors.name ? 'error' : ''}
                placeholder="Budi Santoso"
              />
              <div className="error-text">{errors.name?.message || ' '}</div>
            </div>

            <div className="input-group">
              <label>Nomor WhatsApp Aktif</label>
              <input 
                {...register('phone')}
                type="tel" 
                className={errors.phone ? 'error' : ''}
                placeholder="081234567890"
              />
              <div className="error-text">{errors.phone?.message || ' '}</div>
            </div>

            <PopButton 
              type="submit" 
              color="green" 
              size="default" 
              disabled={isSubmitting}
              className="w-full mt-4 font-extrabold text-base shadow-sm"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjut'}
            </PopButton>
          </form>
        </div>
      </div>
    </section>
  )
}
