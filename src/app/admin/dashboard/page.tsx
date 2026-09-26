'use client'
// src/app/admin/dashboard/page.tsx
// Sesuai concept_dashboard_superadmin.md Section 3:
// KPI: Total Mentee | Total Transaksi | Revenue Bulan Ini | Total Enrollment
// Section B: Mentee baru 7 hari | Section E: Distribusi transaksi | Section F: Tren pendaftaran
// Section C: Transaksi terbaru | Section D: Top Course + Top Bootcamp

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/axios'
import { formatRupiah, formatDate, FIELD_LABELS } from '@/lib/utils'
import Link from 'next/link'
import AdminStatusChip from '@/components/admin/AdminStatusChip'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import TrendInteractiveChart from '@/components/admin/TrendInteractiveChart'
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Types ─────────────────────────────────────────────────
interface DashboardData {
  kpis: {
    totalMentees:         number
    newMenteesThisMonth:  number
    totalTransactions:    number
    successTransactions:  number
    pendingTransactions:  number
    revenueThisMonth:     number
    totalEnrollments:     number
    bootcampEnrollments:  number
    courseEnrollments:    number
  }
  transactionStatus: Record<string, number>
  recentTransactions: {
    id: string; orderId: string; title: string; amount: number; finalAmount: number
    status: string; productType: string; createdAt: string
    user: { name: string; email: string }
  }[]
  topCourses: {
    id: string; title: string; field: string; enrollmentCount: number; rating: number
  }[]
  topBootcamps: {
    id: string; title: string; field: string; enrollmentCount: number; status: string
  }[]
  newMenteesLast7Days: { date: string; count: number }[]
  enrollmentTrend: { date: string; bootcamp: number; course: number }[]
}

// ─── KPI Card ──────────────────────────────────────────────
function KpiCard({ label, value, sub, subColor = 'var(--color-primary)' }: {
  label: string; value: string | number
  sub?: string; subColor?: string
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-5)', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: 'none' }}>
      <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em', marginTop: 4 }}>{value}</div>
      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px' }}>
          <span style={{ color: subColor, fontWeight: 500 }}>{sub}</span>
        </div>
      )}
    </div>
  )
}

// ─── Bar Chart (mentee baru) ────────────────────────────────
function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const chartData = data.map(d => ({
    date: new Date(d.date).getDate().toString(),
    count: d.count
  }))

  return (
    <div style={{ height: 220, width: '100%', marginTop: 'var(--space-4)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" strokeDasharray="4 4" />
          <XAxis 
            dataKey="date" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)', fontWeight: 500 }}
            tickMargin={12}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-primary)'
            }} 
            itemStyle={{ color: 'var(--color-primary)' }}
            formatter={(value: number) => [`${value} Mentee`, 'Total']}
            labelStyle={{ display: 'none' }}
          />
          <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'], placeholderData: keepPreviousData,
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
    refetchInterval: 60_000,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div>
        <AdminPageHeader title="Dashboard" description="Overview aktivitas Metro Institute" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
          ))}
        </div>
        <AdminTableSkeleton rows={5} cols={6} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', color: '#DC2626', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-4)', border: '1px solid #FECACA' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          Backend tidak tersambung. Data tidak dapat dimuat. Pastikan backend berjalan.
        </div>
      </div>
    )
  }

  const { kpis, transactionStatus, recentTransactions, topCourses, topBootcamps, newMenteesLast7Days, enrollmentTrend } = data
  const txTotal = Object.values(transactionStatus).reduce((a, b) => a + b, 0)

  const TX_STATUS_COLOR: Record<string, string> = {
    SUCCESS: 'var(--color-primary)', PENDING: '#D97706',
    FAILED: '#DC2626', CANCELLED: '#6B7280', REFUNDED: '#7C3AED',
  }
  const TX_STATUS_LABEL: Record<string, string> = {
    SUCCESS: 'Berhasil', PENDING: 'Menunggu',
    FAILED: 'Gagal', CANCELLED: 'Dibatalkan', REFUNDED: 'Refunded',
  }

  return (
    <div className="animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Dashboard"
        description="Overview aktivitas Metro Institute hari ini."
      />

      {/* ── Section A: KPI Cards (4 kolom) ────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-5)',
        marginBottom: 'var(--space-6)',
      }}>
        <KpiCard
          label="Total Mentee"
          value={(kpis.totalMentees ?? 0).toLocaleString()}
          sub={`+${kpis.newMenteesThisMonth ?? 0} bulan ini`}
        />
        <KpiCard
          label="Total Transaksi"
          value={(kpis.totalTransactions ?? 0).toLocaleString()}
          sub={`${kpis.successTransactions ?? 0} berhasil / ${kpis.pendingTransactions ?? 0} pending`}
          subColor="var(--color-text-secondary)"
        />
        <KpiCard
          label="Revenue Bulan Ini"
          value={formatRupiah(kpis.revenueThisMonth ?? 0)}
          sub="Transaksi berhasil bulan ini"
        />
        <KpiCard
          label="Total Enrollment"
          value={(kpis.totalEnrollments ?? 0).toLocaleString()}
          sub={`${kpis.bootcampEnrollments ?? 0} Bootcamp / ${kpis.courseEnrollments ?? 0} Mini Course`}
          subColor="var(--color-text-secondary)"
        />
      </div>

      {/* ── Section B+E: Mentee chart + Distribusi Transaksi ─────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>

        {/* Section B - Mentee Baru 7 Hari */}
        <div className="card" style={{ padding: 'var(--space-5)', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: 'none' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-5)' }}>
            Mentee Baru (7 Hari)
          </h2>
          <BarChart data={newMenteesLast7Days} />
        </div>

        {/* Section E - Distribusi Status Transaksi */}
        <div className="card" style={{ padding: 'var(--space-5)', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: 'none' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-5)' }}>
            Status Transaksi
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {Object.entries(transactionStatus).map(([status, count]) => {
              const pct = txTotal > 0 ? Math.round((count / txTotal) * 100) : 0
              const color = TX_STATUS_COLOR[status] ?? '#6B7280'
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)' }}>
                    <span style={{ fontWeight: 500 }}>{TX_STATUS_LABEL[status] ?? status}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{count.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--color-border-subtle)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Section F: Tren Pendaftaran ───────────────────────── */}
      {enrollmentTrend && enrollmentTrend.length > 1 && (
        <TrendInteractiveChart data={enrollmentTrend} />
      )}

      {/* ── Section C: Transaksi Terbaru ──────────────────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: 'none' }}>
        <div style={{
          padding: 'var(--space-5)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Transaksi Terbaru</h2>
          <Link href="/admin/transactions" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 500 }}>
            Lihat Semua
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ color: 'var(--color-text-tertiary)' }}>
                {['Mentee', 'Produk', 'Tipe', 'Jumlah', 'Status', 'Tanggal'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-5)', textAlign: 'left', fontWeight: 500, fontSize: '12px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontWeight: 600 }}>{tx.user.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{tx.user.email}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: 160 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <AdminStatusChip status={tx.productType} label={tx.productType === 'BOOTCAMP' ? 'Bootcamp' : 'Mini Course'} />
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>{formatRupiah(tx.finalAmount)}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <AdminStatusChip status={tx.status} />
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                    {formatDate(tx.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section D: Top Products ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
        {/* Top Mini Course */}
        <div className="card" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: 'none' }}>
          <div style={{ padding: 'var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Mini Course Terlaris</h2>
            <Link href="/admin/mini-course" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 500 }}>Kelola</Link>
          </div>
          <div style={{ padding: '0 var(--space-5) var(--space-5) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {topCourses.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)', width: 16 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {FIELD_LABELS?.[c.field] ?? c.field} - Rating: {c.rating?.toFixed(1) ?? '–'} - {c.enrollmentCount} siswa
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Bootcamp */}
        <div className="card" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: 'none' }}>
          <div style={{ padding: 'var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Bootcamp Terlaris</h2>
            <Link href="/admin/bootcamp" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 500 }}>Kelola</Link>
          </div>
          <div style={{ padding: '0 var(--space-5) var(--space-5) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {topBootcamps.map((b, i) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)', width: 16 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {FIELD_LABELS?.[b.field] ?? b.field} - {b.enrollmentCount} peserta
                  </div>
                </div>
                <AdminStatusChip status={b.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
