'use client'

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react'
import {
  Bold,
  Italic,
  Heading,
  List,
  ListOrdered,
  Smile,
  Code,
  Quote,
  Eye,
  Edit3,
  Search,
  X,
  Sparkles
} from 'lucide-react'
import MarkdownText from './MarkdownText'

// ─── Katalog Emoji Sopan & Profesional ────────────────────────────
export interface EmojiItem {
  emoji: string
  name: string
  keywords: string[]
}

export interface EmojiCategory {
  id: string
  name: string
  icon: string
  emojis: EmojiItem[]
}

const POLITE_EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'popular',
    name: 'Sopan & Apresiasi',
    icon: '✨',
    emojis: [
      { emoji: '😊', name: 'Senyum Ramah', keywords: ['senyum', 'ramah', 'baik', 'happy'] },
      { emoji: '🙏', name: 'Terima Kasih / Permohonan', keywords: ['makasih', 'terima kasih', 'tolong', 'maaf', 'respect', 'doa'] },
      { emoji: '👋', name: 'Sapaan / Halo', keywords: ['halo', 'hai', 'sapa', 'pagi', 'siang', 'sore', 'malam'] },
      { emoji: '👍', name: 'Bagus / Setuju (Jempol)', keywords: ['jempol', 'bagus', 'oke', 'mantap', 'setuju', 'good'] },
      { emoji: '🤝', name: 'Kerja Sama / Sepakat', keywords: ['salaman', 'sepakat', 'kolaborasi', 'partner', 'deal'] },
      { emoji: '✨', name: 'Unggulan / Spesial', keywords: ['spesial', 'kilau', 'bagus', 'rekomendasi', 'highlight'] },
      { emoji: '⭐', name: 'Bintang / Nilai', keywords: ['bintang', 'rating', 'star', 'favorit'] },
      { emoji: '🌟', name: 'Istimewa / Terbaik', keywords: ['bersinar', 'istimewa', 'terbaik'] },
      { emoji: '💡', name: 'Ide / Tips Penting', keywords: ['tips', 'ide', 'solusi', 'lampu', 'trik', 'petunjuk'] },
      { emoji: '🎯', name: 'Target / Tujuan', keywords: ['target', 'tujuan', 'fokus', 'goal', 'sasaran'] },
      { emoji: '🚀', name: 'Sukses / Peluncuran', keywords: ['roket', 'sukses', 'maju', 'semangat', 'luncur'] },
      { emoji: '🙌', name: 'Apresiasi / Semangat', keywords: ['hore', 'semangat', 'hebat', 'selamat'] },
      { emoji: '👏', name: 'Tepuk Tangan', keywords: ['tepuk', 'apresiasi', 'bagus', 'bangga'] },
      { emoji: '💪', name: 'Pantang Menyerah', keywords: ['kuat', 'semangat', 'pasti bisa'] },
      { emoji: '🎉', name: 'Perayaan / Selamat', keywords: ['selamat', 'pesta', 'sukses', 'congrats'] },
      { emoji: '🤗', name: 'Salam Hangat', keywords: ['peluk', 'hangat', 'ramah', 'senang'] },
      { emoji: '👌', name: 'Sempurna / Pas', keywords: ['oke', 'pas', 'cocok', 'perfect'] },
      { emoji: '💬', name: 'Diskusi / Tanya Jawab', keywords: ['chat', 'tanya', 'obrolan', 'diskusi', 'komentar'] },
    ]
  },
  {
    id: 'study',
    name: 'Belajar & Tugas',
    icon: '📚',
    emojis: [
      { emoji: '📝', name: 'Catatan / Tulis', keywords: ['catatan', 'tulis', 'tugas', 'ringkasan', 'soal'] },
      { emoji: '📌', name: 'Pin / Poin Penting', keywords: ['pin', 'penting', 'perhatikan', 'ingat', 'fokus'] },
      { emoji: '📋', name: 'Instruksi / Checklist', keywords: ['instruksi', 'papan', 'daftar tugas', 'panduan'] },
      { emoji: '📚', name: 'Buku / Materi Kelas', keywords: ['buku', 'materi', 'modul', 'silabus', 'belajar'] },
      { emoji: '📖', name: 'Bacaan / Panduan', keywords: ['baca', 'buku terbuka', 'panduan', 'literatur'] },
      { emoji: '🎓', name: 'Kelulusan / Sertifikat', keywords: ['topi wisuda', 'lulus', 'gelar', 'sertifikat', 'edukasi'] },
      { emoji: '✍️', name: 'Pengerjaan / Kerjakan', keywords: ['kerjakan', 'tangan tulis', 'ujian', 'tugas'] },
      { emoji: '📄', name: 'Dokumen / Lembar Kerja', keywords: ['dokumen', 'file', 'kertas', 'laporan'] },
      { emoji: '📂', name: 'Folder / Berkas Proyek', keywords: ['folder', 'direktori', 'arsip', 'proyek'] },
      { emoji: '🔍', name: 'Riset / Cari Tahu', keywords: ['kaca pembesar', 'cari', 'riset', 'analisis', 'temukan'] },
      { emoji: '🧠', name: 'Logika / Analisis', keywords: ['otak', 'analisis', 'kreatif', 'konsep', 'paham'] },
      { emoji: '⏰', name: 'Jam / Tenggat Waktu', keywords: ['jam', 'alarm', 'deadline', 'waktu', 'tepat waktu'] },
      { emoji: '⏳', name: 'Proses / Menunggu', keywords: ['jam pasir', 'proses', 'tunggu', 'antrean'] },
      { emoji: '🗓️', name: 'Kalender / Jadwal', keywords: ['kalender', 'jadwal', 'tanggal', 'sesi'] },
      { emoji: '📊', name: 'Grafik / Statistik', keywords: ['grafik', 'chart', 'statistik', 'data'] },
      { emoji: '📈', name: 'Peningkatan / Kemajuan', keywords: ['naik', 'tren', 'kemajuan', 'progress'] },
    ]
  },
  {
    id: 'status',
    name: 'Status & Simbol Poin',
    icon: '✅',
    emojis: [
      { emoji: '✅', name: 'Centang Hijau / Selesai', keywords: ['centang', 'benar', 'sukses', 'selesai', 'valid', 'check'] },
      { emoji: '☑️', name: 'Checklist Kotak', keywords: ['kotak centang', 'selesai', 'done'] },
      { emoji: '❌', name: 'Silang / Dilarang', keywords: ['silang', 'salah', 'tidak boleh', 'hindari', 'jangan'] },
      { emoji: '⚠️', name: 'Perhatian / Peringatan', keywords: ['peringatan', 'perhatian', 'hati-hati', 'warning'] },
      { emoji: 'ℹ️', name: 'Informasi Penting', keywords: ['info', 'keterangan', 'catatan'] },
      { emoji: '🔔', name: 'Pengumuman / Notifikasi', keywords: ['lonceng', 'notif', 'pemberitahuan', 'ingat'] },
      { emoji: '📢', name: 'Pengumuman / Siaran', keywords: ['speaker', 'toa', 'umum', 'broadcast'] },
      { emoji: '🔑', name: 'Kunci / Poin Inti', keywords: ['kunci', 'penting', 'key', 'rahasia', 'inti'] },
      { emoji: '🏆', name: 'Piala / Juara', keywords: ['piala', 'juara', 'terbaik', 'prestasi', 'winner'] },
      { emoji: '🎖️', name: 'Medali Penghargaan', keywords: ['medali', 'reward', 'pencapaian'] },
      { emoji: '💯', name: 'Skor Sempurna (100)', keywords: ['100', 'sempurna', 'maksimal', 'perfect'] },
      { emoji: '🔹', name: 'Poin Berlian Biru', keywords: ['poin', 'butir', 'biru', 'sub'] },
      { emoji: '🔸', name: 'Poin Berlian Oranye', keywords: ['poin', 'butir', 'oranye', 'utama'] },
      { emoji: '▪️', name: 'Poin Hitam Kecil', keywords: ['poin', 'hitam', 'butir', 'list'] },
      { emoji: '▫️', name: 'Poin Putih Kecil', keywords: ['poin', 'putih', 'butir'] },
      { emoji: '➡️', name: 'Panah Langkah Lanjut', keywords: ['panah', 'lanjut', 'next', 'arah', 'kemudian'] },
      { emoji: '⚡', name: 'Cepat / Instan', keywords: ['kilat', 'cepat', 'express', 'langsung'] },
      { emoji: '🛡️', name: 'Terlindungi / Aman', keywords: ['perisai', 'aman', 'terverifikasi', 'valid'] },
    ]
  },
  {
    id: 'tech',
    name: 'Desain & Koding',
    icon: '💻',
    emojis: [
      { emoji: '🎨', name: 'Desain UI / Palet', keywords: ['desain', 'warna', 'figma', 'ui', 'ux', 'estetika'] },
      { emoji: '🖌️', name: 'Kuas / Ilustrasi', keywords: ['kuas', 'gambar', 'visual', 'grafis'] },
      { emoji: '📐', name: 'Ukuran / Grid / Layout', keywords: ['penggaris', 'layout', 'grid', 'padding', 'margin'] },
      { emoji: '📱', name: 'Mobile App / Smartphone', keywords: ['hp', 'mobile', 'android', 'ios', 'smartphone'] },
      { emoji: '💻', name: 'Web Dev / Laptop', keywords: ['laptop', 'koding', 'frontend', 'backend', 'web'] },
      { emoji: '🖥️', name: 'Desktop / Komputer', keywords: ['layar', 'monitor', 'desktop', 'pc'] },
      { emoji: '⚙️', name: 'Pengaturan / Konfigurasi', keywords: ['gear', 'roda gigi', 'konfigurasi', 'setting'] },
      { emoji: '📦', name: 'Komponen / Paket', keywords: ['box', 'paket', 'komponen', 'library', 'package'] },
      { emoji: '🧩', name: 'Modul / Fitur', keywords: ['puzzle', 'modul', 'fitur', 'bagian'] },
      { emoji: '🌐', name: 'Website / Internet', keywords: ['web', 'internet', 'link', 'online', 'browser'] },
      { emoji: '🔗', name: 'Tautan / Link URL', keywords: ['link', 'rantai', 'url', 'tautan', 'github'] },
      { emoji: '🏷️', name: 'Tag / Label Kategori', keywords: ['tag', 'label', 'kategori', 'badge'] },
      { emoji: '🛠️', name: 'Tools / Perkakas', keywords: ['alat', 'tools', 'perbaikan', 'utilitas'] },
      { emoji: '🧪', name: 'Testing / Uji Coba', keywords: ['lab', 'test', 'uji', 'eksperimen', 'validasi'] },
      { emoji: '🔒', name: 'Akses Terkunci', keywords: ['gembok', 'kunci', 'tertutup', 'private'] },
      { emoji: '🔓', name: 'Akses Terbuka', keywords: ['terbuka', 'unlock', 'akses', 'public'] },
    ]
  }
]

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
      placeholder = 'Tuliskan deskripsi di sini... (klik tombol di atas untuk format Tebal, Miring, Poin, atau Emoji)',
      rows = 4,
      minHeight = 115,
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
    const [isEmojiOpen, setIsEmojiOpen] = useState(false)
    const [emojiSearch, setEmojiSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('popular')

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const emojiPopoverRef = useRef<HTMLDivElement>(null)
    const emojiButtonRef = useRef<HTMLButtonElement>(null)

    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

    // Tutup emoji picker ketika klik di luar
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          emojiPopoverRef.current &&
          !emojiPopoverRef.current.contains(e.target as Node) &&
          emojiButtonRef.current &&
          !emojiButtonRef.current.contains(e.target as Node)
        ) {
          setIsEmojiOpen(false)
        }
      }
      if (isEmojiOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isEmojiOpen])

    const updateValue = (newVal: string) => {
      if (!isControlled) {
        setInternalValue(newVal)
      }
      onChange?.(newVal)
    }

    /**
     * Sisipkan atau bungkus teks dengan format markdown di sekitar seleksi kursor
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

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorStart, newCursorEnd)
        }
      }, 10)
    }

    /**
     * Sisipkan awalan baris (daftar poin, nomor, kutipan)
     */
    const insertLinePrefix = (prefix: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.focus()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

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

    /**
     * Sisipkan emoji ke posisi kursor saat ini
     */
    const insertEmoji = (emoji: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.focus()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const nextVal = currentValue.slice(0, start) + emoji + currentValue.slice(end)
      updateValue(nextVal)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const newPos = start + emoji.length
          textareaRef.current.setSelectionRange(newPos, newPos)
        }
      }, 10)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Shortcut Bold: Ctrl+B / Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        insertFormatting('**', '**', 'teks tebal')
      }
      // Shortcut Italic: Ctrl+I / Cmd+I
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        insertFormatting('*', '*', 'teks miring')
      }
    }

    // Filter daftar emoji berdasarkan pencarian atau kategori aktif
    const filteredEmojis = useMemo(() => {
      if (!emojiSearch.trim()) {
        const cat = POLITE_EMOJI_CATEGORIES.find((c) => c.id === selectedCategory)
        return cat ? cat.emojis : []
      }
      const q = emojiSearch.toLowerCase().trim()
      const matches: EmojiItem[] = []
      const seen = new Set<string>()

      for (const cat of POLITE_EMOJI_CATEGORIES) {
        for (const item of cat.emojis) {
          if (seen.has(item.emoji)) continue
          if (
            item.name.toLowerCase().includes(q) ||
            item.keywords.some((k) => k.toLowerCase().includes(q))
          ) {
            seen.add(item.emoji)
            matches.push(item)
          }
        }
      }
      return matches
    }, [emojiSearch, selectedCategory])

    return (
      <div
        className={className}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
          border: error ? '1px solid var(--color-error, #ef4444)' : '1px solid rgba(0, 0, 0, 0.08)',
          background: '#ffffff',
          overflow: 'visible', // Biarkan popover terlihat rapi
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          ...style,
        }}
      >
        {/* Toolbar Header - Sangat Jelas dan Ramah bagi Siapa Saja */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 10px',
            background: 'var(--color-bg, #f8fafc)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '12px 12px 0 0',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {/* Tombol Format Teks Lengkap dengan Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {/* Tombol Tebal (Bold) */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertFormatting('**', '**', 'teks tebal')}
              title="Tebalkan Teks (Ctrl+B) — Contoh: **Tujuan Proyek**"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.06)',
                background: '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-primary, #0f172a)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.borderColor = 'var(--color-primary, #018556)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
              }}
            >
              <Bold size={13} strokeWidth={2.5} />
              <span>Tebal</span>
            </button>

            {/* Tombol Miring (Italic) */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertFormatting('*', '*', 'teks miring')}
              title="Miringkan Teks (Ctrl+I) — Contoh: *opsional*"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.06)',
                background: '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-primary, #0f172a)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.borderColor = 'var(--color-primary, #018556)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
              }}
            >
              <Italic size={13} strokeWidth={2.5} />
              <span>Miring</span>
            </button>

            {/* Tombol Judul (Heading) */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertLinePrefix('### ')}
              title="Buat Judul / Sub-bab (###)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.06)',
                background: '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-primary, #0f172a)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.borderColor = 'var(--color-primary, #018556)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
              }}
            >
              <Heading size={13} strokeWidth={2.5} />
              <span>Judul</span>
            </button>

            {/* Tombol Daftar Poin */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertLinePrefix('- ')}
              title="Daftar Butir Poin (-)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.06)',
                background: '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-primary, #0f172a)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.borderColor = 'var(--color-primary, #018556)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
              }}
            >
              <List size={13} strokeWidth={2.5} />
              <span>Poin</span>
            </button>

            {/* Tombol Daftar Nomor */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertLinePrefix('1. ')}
              title="Daftar Berurutan (1. )"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.06)',
                background: '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-primary, #0f172a)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab === 'write') e.currentTarget.style.borderColor = 'var(--color-primary, #018556)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
              }}
            >
              <ListOrdered size={13} strokeWidth={2.5} />
              <span>Nomor</span>
            </button>

            <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.1)', margin: '0 3px' }} />

            {/* Tombol Emoji Sopan & Profesional */}
            <button
              ref={emojiButtonRef}
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => setIsEmojiOpen(!isEmojiOpen)}
              title="Buka Pilihan Emoji Sopan & Santun"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                border: isEmojiOpen ? '1px solid var(--color-primary, #018556)' : '1px solid rgba(0,0,0,0.08)',
                background: isEmojiOpen ? 'rgba(1, 133, 86, 0.08)' : '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: isEmojiOpen ? 'var(--color-primary, #018556)' : 'var(--color-text-primary, #0f172a)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
                transition: 'all 0.15s ease',
                boxShadow: isEmojiOpen ? '0 0 0 2px rgba(1, 133, 86, 0.1)' : 'none',
              }}
            >
              <Smile size={14} color={isEmojiOpen ? 'var(--color-primary, #018556)' : '#f59e0b'} strokeWidth={2.5} />
              <span>Emoji</span>
            </button>
          </div>

          {/* Switcher Tab: Tulis vs Pratinjau */}
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
              onClick={() => {
                setActiveTab('write')
                setIsEmojiOpen(false)
              }}
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
              onClick={() => {
                setActiveTab('preview')
                setIsEmojiOpen(false)
              }}
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

        {/* ── Popover Pemilih Emoji Sopan ────────────────────────────── */}
        {isEmojiOpen && (
          <div
            ref={emojiPopoverRef}
            style={{
              position: 'absolute',
              top: 44,
              left: 10,
              zIndex: 50,
              width: 320,
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid rgba(0, 0, 0, 0.12)',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            {/* Header Popover & Search Bar */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} color="#f59e0b" />
                  Emoji Sopan & Profesional
                </span>
                <button
                  type="button"
                  onClick={() => setIsEmojiOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 2,
                    borderRadius: 4,
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Input Pencarian Emoji */}
              <div style={{ position: 'relative' }}>
                <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Cari emoji (cth: jempol, bintang, cek, buku)..."
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 28px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Kategori Tabs (Hanya saat tidak mencari) */}
            {!emojiSearch.trim() && (
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#f8fafc',
                  padding: '4px 6px',
                  gap: 3,
                  overflowX: 'auto',
                }}
              >
                {POLITE_EMOJI_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: 'none',
                        background: isActive ? '#ffffff' : 'transparent',
                        color: isActive ? 'var(--color-primary, #018556)' : '#64748b',
                        fontSize: '11px',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Grid Daftar Emoji */}
            <div
              style={{
                maxHeight: 190,
                overflowY: 'auto',
                padding: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 4,
              }}
            >
              {filteredEmojis.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '16px 0', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                  Tidak ada emoji yang cocok dengan "{emojiSearch}".
                </div>
              ) : (
                filteredEmojis.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertEmoji(item.emoji)}
                    title={item.name}
                    style={{
                      width: 42,
                      height: 42,
                      fontSize: '20px',
                      borderRadius: 8,
                      border: '1px solid transparent',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.1s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f1f5f9'
                      e.currentTarget.style.transform = 'scale(1.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    {item.emoji}
                  </button>
                ))
              )}
            </div>

            {/* Footer Popover Info */}
            <div
              style={{
                padding: '6px 10px',
                background: '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                fontSize: '10.5px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Klik emoji untuk langsung menyisipkannya.</span>
              <span style={{ fontWeight: 600, color: 'var(--color-primary, #018556)' }}>100% Sopan</span>
            </div>
          </div>
        )}

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
              borderRadius: '0 0 12px 12px',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              minHeight,
              padding: '14px 16px',
              background: '#ffffff',
              fontSize: '13.5px',
              lineHeight: 1.6,
              color: 'var(--color-text-primary, #0f172a)',
              overflowY: 'auto',
              boxSizing: 'border-box',
              borderRadius: '0 0 12px 12px',
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

        {/* Footer Helper Petunjuk Penggunaan */}
        <div
          style={{
            padding: '7px 12px',
            background: 'var(--color-bg, #f8fafc)',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: '0 0 12px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: 'var(--color-text-tertiary, #64748b)',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary, #475569)' }}>💡 Bantuan:</span>
            <span>
              Klik tombol di atas atau ketik langsung simbol <code>**teks tebal**</code>, <code>*teks miring*</code>, dan emoji.
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currentValue.length} karakter</span>
        </div>
      </div>
    )
  }
)

MarkdownTextarea.displayName = 'MarkdownTextarea'
export default MarkdownTextarea
