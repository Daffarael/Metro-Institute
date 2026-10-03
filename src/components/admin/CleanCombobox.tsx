'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export interface ComboboxOption {
  value: string
  label: string
}

interface CleanComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  width?: number | string
  direction?: 'up' | 'down'
  style?: React.CSSProperties
}

export default function CleanCombobox({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  width = '100%',
  direction = 'down',
  style
}: CleanComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width, minWidth: 160 }}>

      {/* Trigger — button biasa, bukan div+input */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        suppressHydrationWarning
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          gap: 8,
          ...style
        }}
      >
        <span style={{
          fontSize: 'var(--text-sm)',
          color: (selectedOption && selectedOption.value !== '') ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          textAlign: 'left',
        }}>
          {selectedOption?.label || placeholder}
        </span>

        <div style={{
          flexShrink: 0,
          color: 'var(--color-text-tertiary)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <ChevronDown size={15} />
        </div>
      </button>

      {/* Dropdown — AnimatePresence to prevent prop jumping (flicker) on close */}
      <AnimatePresence>
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: direction === 'down' ? 'calc(100% + 4px)' : 'auto',
            bottom: direction === 'up' ? 'calc(100% + 4px)' : 'auto',
            left: 0,
            right: 0,
            zIndex: 100,
          }}>
            <motion.div 
              initial={{ opacity: 0, y: direction === 'down' ? -6 : 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: direction === 'down' ? -6 : 6, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.05)',
                overflow: 'hidden',
                transformOrigin: direction === 'down' ? 'top center' : 'bottom center',
              }}
            >
              <div style={{ padding: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {/* Hapus pilihan */}
                {value && (
                  <button
                    type="button"
                    className="clean-combobox-clear"
                    onClick={e => { e.preventDefault(); handleSelect('') }}
                  >
                    Hapus pilihan
                  </button>
                )}

                {/* Opsi */}
                {options.map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`clean-combobox-opt${value === opt.value ? ' is-selected' : ''}`}
                    onClick={e => { e.preventDefault(); handleSelect(opt.value) }}
                  >
                    {opt.label}
                    {value === opt.value && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
