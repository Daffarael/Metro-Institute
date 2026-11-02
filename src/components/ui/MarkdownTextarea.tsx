'use client'

import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Bold, Italic, List, ListOrdered, Code, Quote, Eye, Edit3 } from 'lucide-react'
import MarkdownText from './MarkdownText'

export interface MarkdownTextareaProps {
  value?: string
  defaultValue?: string
  onChange?: (val: string) => void
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  minHeight?: number
  name?: string
  disabled?: boolean
  error?: string
  style?: React.CSSProperties
  className?: string
  id?: string
}

export const MarkdownTextarea = forwardRef<HTMLTextAreaElement, MarkdownTextareaProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      onBlur,
      placeholder = 'Tuliskan deskripsi di sini... (mendukung format Markdown seperti **teks tebal**, *miring*, - poin)',
      rows = 4,
      minHeight = 110,
      name,
      disabled = false,
      error,
      style,
      className,
      id,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue)
    const currentValue = isControlled ? controlledValue ?? '' : internalValue

    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

    const updateValue = (newVal: string) => {
      if (!isControlled) {
        setInternalValue(newVal)
      }
      onChange?.(newVal)
    }

    /**
     * Inserts or wraps text with markdown syntax around current selection
     */
    const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.focus()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = currentValue.slice(start, end)

      let replacement = ''
      let newCursorStart = start + prefix.length
      let newCursorEnd = newCursorStart

      if (selected.length > 0) {
        replacement = `${prefix}${selected}${suffix}`
        newCursorEnd = newCursorStart + selected.length
      } else {
        replacement = `${prefix}${defaultPlaceholder}${suffix}`
        newCursorEnd = newCursorStart + defaultPlaceholder.length
      }

      const nextVal = currentValue.slice(0, start) + replacement + currentValue.slice(end)
      updateValue(nextVal)

      // Restore selection after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorStart, newCursorEnd)
        }
      }, 10)
    }

    /**
     * Prefixes current line(s) with list bullets or numbers
     */
    const insertLinePrefix = (prefix: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.focus()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      // Find the start of the current line
      const lineStart = currentValue.lastIndexOf('\n', start - 1) + 1
      const beforeLine = currentValue.slice(0, lineStart)
      const afterLine = currentValue.slice(lineStart)

      const nextVal = `${beforeLine}${prefix}${afterLine}`
      updateValue(nextVal)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const newPos = start + prefix.length
          textareaRef.current.setSelectionRange(newPos, end + prefix.length)
        }
      }, 10)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Bold shortcut: Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        insertFormatting('**', '**', 'teks tebal')
      }
      // Italic shortcut: Ctrl+I or Cmd+I
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        insertFormatting('*', '*', 'teks miring')
      }
    }

    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
          border: error ? '1px solid var(--color-error, #ef4444)' : '1px solid rgba(0, 0, 0, 0.08)',
          background: '#f9fafb',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        {/* Toolbar Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            background: 'var(--color-bg, #f1f5f9)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            gap: 8,
          }}
        >
          {/* Action formatting buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertFormatting('**', '**', 'teks tebal')}
              title="Tebal / Bold (Ctrl+B)"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-secondary, #475569)',
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Bold size={14} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertFormatting('*', '*', 'teks miring')}
              title="Miring / Italic (Ctrl+I)"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-secondary, #475569)',
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Italic size={14} strokeWidth={2.5} />
            </button>

            <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertLinePrefix('- ')}
              title="Daftar Poin (List)"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-secondary, #475569)',
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <List size={14} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertLinePrefix('1. ')}
              title="Daftar Nomor"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-secondary, #475569)',
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <ListOrdered size={14} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertFormatting('`', '`', 'kode')}
              title="Kode Inline (`code`)"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-secondary, #475569)',
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Code size={14} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertLinePrefix('> ')}
              title="Kutipan / Catatan (>)"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-secondary, #475569)',
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Quote size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Segmented Tab Switcher: Tulis vs Pratinjau */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.05)',
              padding: 2,
              borderRadius: 7,
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 5,
                fontSize: '11.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'write' ? '#ffffff' : 'transparent',
                color: activeTab === 'write' ? 'var(--color-primary, #018556)' : 'var(--color-text-tertiary, #64748b)',
                boxShadow: activeTab === 'write' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Edit3 size={12} />
              Tulis
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 5,
                fontSize: '11.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                color: activeTab === 'preview' ? 'var(--color-primary, #018556)' : 'var(--color-text-tertiary, #64748b)',
                boxShadow: activeTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Eye size={12} />
              Pratinjau
            </button>
          </div>
        </div>

        {/* Editor Body */}
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            disabled={disabled}
            rows={rows}
            value={currentValue}
            onChange={(e) => updateValue(e.target.value)}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              width: '100%',
              minHeight,
              padding: '12px 14px',
              border: 'none',
              background: '#ffffff',
              fontSize: '13.5px',
              lineHeight: 1.6,
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              minHeight,
              padding: '12px 14px',
              background: '#ffffff',
              fontSize: '13.5px',
              lineHeight: 1.6,
              color: 'var(--color-text-primary, #0f172a)',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            {currentValue.trim() ? (
              <MarkdownText content={currentValue} />
            ) : (
              <div style={{ color: 'var(--color-text-tertiary, #94a3b8)', fontStyle: 'italic', fontSize: '13px' }}>
                Belum ada teks untuk dipratinjau. Ketik teks di tab <strong>Tulis</strong>.
              </div>
            )}
          </div>
        )}

        {/* Footer Helper */}
        <div
          style={{
            padding: '5px 12px',
            background: '#ffffff',
            borderTop: '1px solid rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--color-text-tertiary, #94a3b8)',
          }}
        >
          <span>
            💡 Format: <code>**tebal**</code>, <code>*miring*</code>, <code>- daftar poin</code>
          </span>
          <span>{currentValue.length} karakter</span>
        </div>
      </div>
    )
  }
)

MarkdownTextarea.displayName = 'MarkdownTextarea'
export default MarkdownTextarea
