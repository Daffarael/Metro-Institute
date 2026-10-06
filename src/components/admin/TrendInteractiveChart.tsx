'use client'

import React, { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

export type TrendData = {
  date: string
  bootcamp: number
  course: number
}

interface Props {
  data: TrendData[]
  title?: string
  description?: string
}

export default function TrendInteractiveChart({ data, title = 'Tren Pendaftaran', description = 'Total pendaftaran Bootcamp dan Mini Course' }: Props) {
  const [activeChart, setActiveChart] = useState<'bootcamp' | 'course'>('bootcamp')

  const total = useMemo(() => ({
    bootcamp: data.reduce((acc, curr) => acc + curr.bootcamp, 0),
    course: data.reduce((acc, curr) => acc + curr.course, 0),
  }), [data])

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: 'none', borderRadius: 'var(--radius-lg)', background: '#fff', overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
      {/* Header section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--color-border-subtle)' }}>
        
        {/* Title area */}
        <div style={{ flex: 1, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 200 }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>{description}</p>
        </div>

        {/* Tabs area */}
        <div style={{ display: 'flex' }}>
          {(['bootcamp', 'course'] as const).map((key) => {
            const isActive = activeChart === key
            return (
              <button
                key={key}
                onClick={() => setActiveChart(key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minWidth: 140,
                  padding: 'var(--space-4) var(--space-6)',
                  borderLeft: '1px solid var(--color-border-subtle)',
                  background: isActive ? 'var(--color-bg)' : 'transparent',
                  border: 'none',
                  borderLeftWidth: '1px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: 'var(--color-border-subtle)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: 4, textTransform: 'capitalize' }}>
                  {key === 'course' ? 'Mini Course' : 'Bootcamp'}
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                  {total[key].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart Area */}
      <div style={{ padding: 'var(--space-5)' }}>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, left: 10, right: 10, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={32}
                tickFormatter={(value) => {
                  const d = new Date(value as string)
                  return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
                }}
                style={{ fontSize: '11px', fill: 'var(--color-text-tertiary)' }}
              />
              <Tooltip
                cursor={{ fill: 'var(--color-bg)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ background: '#fff', border: '1px solid var(--color-border-subtle)', padding: '8px 12px', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                          {new Date(label as string).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: payload[0].fill }} />
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>
                            {activeChart === 'course' ? 'Mini Course' : 'Bootcamp'}:
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>
                            {payload[0].value}
                          </span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey={activeChart}
                fill={activeChart === 'bootcamp' ? 'var(--color-primary)' : '#0369A1'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
