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
  allowClear?: boolean
}

export default function CleanCombobox({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  width = '100%',
  direction = 'down',
  style,
  allowClear = true
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

      {/* Trigger â€” button biasa, bukan div+input */}
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

      {/* Dropdown â€” AnimatePresence to prevent prop jumping (flicker) on close */}
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
                {allowClear && value && (
                  <ClearDropdownItem onClick={() => handleSelect('')} />
                )}

                {/* Opsi */}
                {options.map(opt => (
                  <ComboboxDropdownItem
                    key={opt.value}
                    label={opt.label}
                    isSelected={value === opt.value}
                    onClick={() => handleSelect(opt.value)}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}


function ComboboxDropdownItem({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
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
        boxSizing: 'border-box',
        padding: '9px 12px',
        borderRadius: 8,
        border: 'none',
        background: isSelected ? 'rgba(0, 0, 0, 0.04)' : (hovered ? 'rgba(0,0,0,0.04)' : 'transparent'),
        color: isSelected ? 'var(--color-primary)' : (hovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'),
        fontSize: 'var(--text-sm)',
        fontWeight: isSelected ? 600 : 400,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        outline: 'none',
      }}
    >
      {label}
      {isSelected && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}


function ClearDropdownItem({ onClick }: { onClick: () => void }) {
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
        justifyContent: 'flex-start',
        width: '100%',
        boxSizing: 'border-box',
        padding: '9px 12px',
        borderRadius: 8,
        border: 'none',
        background: hovered ? 'rgba(0,0,0,0.04)' : 'transparent',
        color: 'var(--color-text-tertiary)',
        fontSize: 'var(--text-sm)',
        fontStyle: 'italic',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        outline: 'none',
        borderBottom: '1px solid var(--color-border-subtle)',
        marginBottom: '4px'
      }}
    >
      Hapus pilihan
    </button>
  )
}
