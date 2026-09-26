'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Heart, BookOpen, Trash2, Star, ChevronRight } from 'lucide-react'
import api from '@/lib/axios'
import { ROUTES, FIELD_LABELS, FIELD_COLORS, formatRupiah } from '@/lib/utils'
import { toast } from 'sonner'

interface WishlistItem {
  id: string
  productType: 'MINI_COURSE' | 'BOOTCAMP'
  course?: { id: string; title: string; price: number; field: string; level: string; thumbnailUrl?: string; rating: number }
  bootcamp?: { id: string; title: string; price: number; field: string; thumbnailUrl?: string; rating: number }
}

export default function WishlistPage() {
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist').then((r) => r.data.data),
  })

  const removeMutation = useMutation({
    mutationFn: (item: WishlistItem) =>
      item.productType === 'MINI_COURSE'
        ? api.delete(`/wishlist/course/${item.course?.id}`)
        : api.delete(`/wishlist/bootcamp/${item.bootcamp?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Dihapus dari wishlist')
    },
  })

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Wishlist ❤️
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {items.length} item tersimpan
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Heart className="empty-state-icon" />
          <p className="empty-state-title">Wishlist masih kosong</p>
          <p className="empty-state-desc">Simpan bootcamp atau mini course yang kamu inginkan untuk akses cepat nanti.</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link href="/bootcamp" className="btn btn-primary btn-sm">Jelajahi Bootcamp</Link>
            <Link href="/mini-course" className="btn btn-secondary btn-sm">Mini Course</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }} className="stagger-children">
          {items.map((item) => {
            const product = item.course || item.bootcamp
            if (!product) return null
            const isBootcamp = item.productType === 'BOOTCAMP'
            const href = isBootcamp ? ROUTES.BOOTCAMP_DETAIL(product.id) : ROUTES.COURSE_DETAIL(product.id)

            return (
              <div key={item.id} className="card card-hover animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Thumbnail */}
                <div style={{ height: 120, background: `${FIELD_COLORS[product.field]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {product.thumbnailUrl ? (
                    <img src={product.thumbnailUrl} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 36 }}>{{ UI_UX: '🎨', FRONTEND: '💻', BACKEND: '⚙️', MOBILE: '📱' }[product.field] || '📚'}</span>
                  )}
                  <button
                    onClick={() => removeMutation.mutate(item)}
                    style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={13} color="#EF4444" />
                  </button>
                  <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                    {isBootcamp ? 'Bootcamp' : 'Mini Course'}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: FIELD_COLORS[product.field] }}>{FIELD_LABELS[product.field]?.split(' ')[0]}</span>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, lineHeight: 1.4, flex: 1 }} className="line-clamp-2">{product.title}</h3>
                  {product.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      <Star size={11} fill="#F59E0B" color="#F59E0B" /> {product.rating.toFixed(1)}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>{formatRupiah(product.price)}</span>
                    <Link href={href} className="btn btn-primary btn-sm" style={{ gap: 'var(--space-1)' }}>
                      Lihat <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
