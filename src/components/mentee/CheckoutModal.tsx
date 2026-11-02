'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Tag, Check, AlertCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import api from '@/lib/axios'
import { formatRupiah } from '@/lib/utils'
import { toast } from 'sonner'

export interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  productType: 'BOOTCAMP' | 'MINI_COURSE' | 'WEBINAR'
  productId: string
  title: string
  price: number
  badgeLabel?: string
  speakerOrMentor?: string
  onSuccess: (data: any) => void
}

export default function CheckoutModal({
  isOpen,
  onClose,
  productType,
  productId,
  title,
  price,
  badgeLabel,
  speakerOrMentor,
  onSuccess,
}: CheckoutModalProps) {
  const [voucherInput, setVoucherInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string
    type: 'PERCENT' | 'FIXED'
    value: number
    discountAmount: number
    finalPrice: number
  } | null>(null)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return
    setIsValidating(true)
    setVoucherError(null)

    try {
      const res = await api.post('/voucher/validate', {
        code: voucherInput.trim(),
        productType,
        productId,
      })

      if (res.data?.success && res.data?.data) {
        const d = res.data.data
        setAppliedVoucher({
          code: d.code,
          type: d.type,
          value: d.value,
          discountAmount: d.discountAmount,
          finalPrice: d.finalPrice,
        })
        toast.success(`Voucher "${d.code}" berhasil dipasang!`)
      } else {
        setVoucherError('Voucher tidak valid')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Kode voucher tidak valid atau telah kedaluwarsa'
      setVoucherError(msg)
      toast.error(msg)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherInput('')
    setVoucherError(null)
  }

  const handleCheckout = async () => {
    setIsSubmitting(true)
    try {
      const payload: Record<string, any> = {
        productType,
        ...(productType === 'BOOTCAMP' ? { bootcampId: productId } : {}),
        ...(productType === 'MINI_COURSE' ? { courseId: productId } : {}),
        ...(productType === 'WEBINAR' ? { webinarId: productId } : {}),
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
      }

      const res = await api.post('/transactions/initiate', payload)
      const data = res.data?.data

      if (data?.isFree) {
        toast.success(data.message || 'Pendaftaran berhasil menggunakan voucher 100%!')
        onSuccess(data)
        onClose()
      } else if (data?.snapToken) {
        onSuccess(data)
        onClose()
      } else {
        onSuccess(data)
        onClose()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memproses pendaftaran'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentDiscount = appliedVoucher ? appliedVoucher.discountAmount : 0
  const finalPrice = Math.max(0, price - currentDiscount)
  const isFree = finalPrice === 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) onClose()
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Konfirmasi Pendaftaran
                </h3>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '13px',
                    color: '#475569',
                    fontWeight: 500,
                  }}
                >
                  Periksa rincian pesanan & gunakan voucher diskon
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxHeight: 'calc(85vh - 120px)',
                overflowY: 'auto',
              }}
            >
              {/* Product Info Card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#018556',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {badgeLabel || (productType === 'BOOTCAMP' ? 'Bootcamp' : productType === 'MINI_COURSE' ? 'Mini Course' : 'Inspire Talk')}
                  </span>
                  {speakerOrMentor && (
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                      {speakerOrMentor}
                    </span>
                  )}
                </div>

                <h4
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </h4>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                    marginTop: '4px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                    Harga Normal:
                  </span>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: appliedVoucher ? '#94a3b8' : '#0f172a',
                      textDecoration: appliedVoucher ? 'line-through' : 'none',
                    }}
                  >
                    {formatRupiah(price)}
                  </span>
                </div>
              </div>

              {/* Voucher Section */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Tag size={15} color="#018556" strokeWidth={2.5} />
                  Punya Kode Voucher?
                </label>

                {!appliedVoucher ? (
                  <div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={voucherInput}
                        onChange={(e) => {
                          setVoucherInput(e.target.value.toUpperCase())
                          setVoucherError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleApplyVoucher()
                          }
                        }}
                        placeholder="CONTOH: METROPROMO"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: voucherError ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          letterSpacing: '0.05em',
                          color: '#0f172a',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={isValidating || !voucherInput.trim()}
                        style={{
                          padding: '0 18px',
                          borderRadius: '10px',
                          border: 'none',
                          background: voucherInput.trim() ? '#018556' : '#94a3b8',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: voucherInput.trim() && !isValidating ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isValidating ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Cek...
                          </>
                        ) : (
                          'Terapkan'
                        )}
                      </button>
                    </div>

                    {voucherError && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '8px',
                          color: '#dc2626',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <AlertCircle size={14} strokeWidth={2.5} />
                        {voucherError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: '#ecfdf5',
                      border: '1.5px solid #018556',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: '#018556',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                        }}
                      >
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '14px',
                              color: '#064e3b',
                            }}
                          >
                            {appliedVoucher.code}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#018556',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            {appliedVoucher.type === 'PERCENT'
                              ? `Diskon ${appliedVoucher.value}%`
                              : `Hemat ${formatRupiah(appliedVoucher.value)}`}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#065f46',
                            fontWeight: 600,
                            marginTop: '2px',
                          }}
                        >
                          Hemat {formatRupiah(appliedVoucher.discountAmount)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #dc2626',
                        background: '#ffffff',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* Cost Summary Box */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#334155',
                    fontWeight: 600,
                  }}
                >
                  <span>Harga</span>
                  <span>{formatRupiah(price)}</span>
                </div>

                {appliedVoucher && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      color: '#018556',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={14} color="#018556" /> Diskon Voucher ({appliedVoucher.code})
                    </span>
                    <span>- {formatRupiah(appliedVoucher.discountAmount)}</span>
                  </div>
                )}

                <div
                  style={{
                    height: '1px',
                    background: '#cbd5e1',
                    margin: '4px 0',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#0f172a',
                    }}
                  >
                    Total Pembayaran:
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: isFree ? '#018556' : '#0f172a',
                    }}
                  >
                    {isFree ? 'GRATIS (Rp 0)' : formatRupiah(finalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '11px 20px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                style={{
                  padding: '11px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#018556',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(1, 133, 86, 0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Memproses...
                  </>
                ) : isFree ? (
                  <>
                    Daftar Gratis Sekarang <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                ) : (
                  <>
                    Lanjut ke Pembayaran <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
