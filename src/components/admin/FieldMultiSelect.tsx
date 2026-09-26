'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface FieldMultiSelectProps {
  value: string[]
  onChange: (values: string[]) => void
  options: Option[]
  placeholder?: string
}

export default function FieldMultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
}: FieldMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = useCallback((optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }, [value, onChange])

  const remove = useCallback((optValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== optValue))
  }, [value, onChange])

  const selectedOptions = options.filter(o => value.includes(o.value))

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>

      {/* Trigger — persis gaya CleanCombobox */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: 44,
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          borderRadius: 12,
          padding: selectedOptions.length > 0 ? '8px 12px' : '10px 12px',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          gap: 8,
          flexWrap: 'wrap',
          textAlign: 'left',
        }}
      >
        {/* Selected badges or placeholder */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
          {selectedOptions.length === 0 ? (
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-tertiary)',
            }}>
              {placeholder}
            </span>
          ) : (
            selectedOptions.map(opt => (
              <span
                key={opt.value}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.06)',
                  color: 'var(--color-text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {opt.label}
                <span
                  onClick={e => remove(opt.value, e)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    flexShrink: 0,
                    lineHeight: 1,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                >
                  ×
                </span>
              </span>
            ))
          )}
        </div>

        {/* Chevron */}
        <div style={{
          flexShrink: 0,
          color: 'var(--color-text-tertiary)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <ChevronDown size={15} />
        </div>
      </button>

      {/* Dropdown — persis gaya CleanCombobox */}
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        zIndex: 100,
        pointerEvents: open ? 'auto' : 'none',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.05)',
          overflow: 'hidden',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0px) scale(1)' : 'translateY(-6px) scale(0.97)',
          transformOrigin: 'top center',
          transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ padding: 4, maxHeight: '180px', overflowY: 'auto' }}>
            {options.map(opt => {
              const isSelected = value.includes(opt.value)
              return (
                <DropdownItem
                  key={opt.value}
                  label={opt.label}
                  isSelected={isSelected}
                  onClick={() => toggle(opt.value)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function DropdownItem({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={e => { e.preventDefault(); onClick() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '9px 12px',
        borderRadius: 8,
        border: 'none',
        background: hovered ? 'rgba(0,0,0,0.04)' : 'transparent',
        color: 'var(--color-text-primary)',
        fontSize: 'var(--text-sm)',
        fontWeight: isSelected ? 600 : 400,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s ease',
      }}
    >
      {label}
      {isSelected && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}
