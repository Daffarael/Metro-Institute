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
  Image as ImageIcon,
  Sigma,
  Eye,
  Edit3,
  Search,
  X,
  Upload,
  Loader2,
  Check,
  Link as LinkIcon,
  Terminal,
  FileCode2
} from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import katex from 'katex'
import api from '@/lib/axios'
import CleanCombobox, { ComboboxOption } from '@/components/admin/CleanCombobox'
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

// ─── Preset Rumus Matematika (Equation Presets) ───────────────────────
interface MathPreset {
  label: string
  latex: string
}

const MATH_PRESETS: MathPreset[] = [
  { label: 'Pecahan', latex: '\\frac{a}{b}' },
  { label: 'Akar', latex: '\\sqrt{x}' },
  { label: 'Pangkat', latex: 'x^{2}' },
  { label: 'Indeks', latex: 'x_{i}' },
  { label: 'Kuadratik', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: 'Pythagoras', latex: 'a^2 + b^2 = c^2' },
  { label: 'Sigma', latex: '\\sum_{i=1}^{n} x_i' },
  { label: 'Integral', latex: '\\int_{a}^{b} f(x) \\, dx' },
  { label: 'Limit', latex: '\\lim_{x \\to 0} f(x)' },
  { label: 'Matriks 2x2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: 'Vektor 2D', latex: '\\vec{v} = \\begin{pmatrix} x \\\\ y \\end{pmatrix}' },
  { label: 'Big-O', latex: 'O(n \\log n)' },
  { label: 'Akurasi ML', latex: '\\text{Akurasi} = \\frac{TP + TN}{TP + TN + FP + FN}' },
  { label: 'Cosine Sim', latex: '\\text{sim}(A, B) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|}' },
  { label: 'Sigmoid', latex: '\\sigma(z) = \\frac{1}{1 + e^{-z}}' },
  { label: 'Bayes', latex: 'P(A|B) = \\frac{P(B|A) P(A)}{P(B)}' },
  { label: 'Rata-rata', latex: '\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i' },
]

// ─── Opsi Bahasa Pemrograman untuk CleanCombobox ─────────────────────
const LANGUAGE_OPTIONS: ComboboxOption[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL (Database)' },
  { value: 'java', label: 'Java' },
  { value: 'kotlin', label: 'Kotlin (Android)' },
  { value: 'dart', label: 'Dart / Flutter' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'cpp', label: 'C++' },
  { value: 'php', label: 'PHP' },
]

const LANGUAGE_SAMPLES: Record<string, string> = {
  javascript: '// Contoh fungsi JavaScript\nfunction hitungTotal(a, b) {\n  return a + b;\n}',
  typescript: '// Contoh fungsi TypeScript\nconst greet = (name: string): string => `Halo, ${name}!`;',
  python: '# Contoh fungsi Python\ndef hitung_luas(panjang: float, lebar: float) -> float:\n    return panjang * lebar',
  html: '<div class="container">\n  <h1>Judul Materi</h1>\n  <p>Deskripsi materi pembelajaran.</p>\n</div>',
  css: '.card {\n  display: flex;\n  border-radius: 12px;\n  background: #ffffff;\n}',
  sql: 'SELECT id, name, email FROM users WHERE is_active = true ORDER BY name ASC;',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  kotlin: 'fun main() {\n    val greeting = "Halo Metro Institute"\n    println(greeting)\n}',
  dart: 'Widget build(BuildContext context) {\n  return Text("Hello Flutter");\n}',
  json: '{\n  "status": "success",\n  "data": []\n}',
  bash: 'npm install\nnpm run dev',
  cpp: '#include <iostream>\nint main() {\n    std::cout << "Hello World!";\n    return 0;\n}',
  php: '<?php\necho "Hello World!";\n?>',
}

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

const EDITOR_TABS = [
  { id: 'write', label: 'Tulis', icon: <Edit3 size={12} strokeWidth={2.5} /> },
  { id: 'preview', label: 'Pratinjau', icon: <Eye size={12} strokeWidth={2.5} /> },
] as const

export const MarkdownTextarea = forwardRef<HTMLTextAreaElement, MarkdownTextareaProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      onBlur,
      placeholder = 'Tuliskan deskripsi atau isi materi di sini...',
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

    // Popover States
    const [isEmojiOpen, setIsEmojiOpen] = useState(false)
    const [emojiSearch, setEmojiSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('popular')

    // Modal Image
    const [isImageModalOpen, setIsImageModalOpen] = useState(false)
    const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload')
    const [imageUrl, setImageUrl] = useState('')
    const [imageCaption, setImageCaption] = useState('')
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Modal Code
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
    const [selectedLang, setSelectedLang] = useState('javascript')
    const [codeContent, setCodeContent] = useState(LANGUAGE_SAMPLES.javascript)
    const [codeMode, setCodeMode] = useState<'block' | 'inline'>('block')

    // Modal Equation / Rumus
    const [isMathModalOpen, setIsMathModalOpen] = useState(false)
    const [mathLatex, setMathLatex] = useState('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}')
    const [mathMode, setMathMode] = useState<'block' | 'inline'>('block')

    // Sliding pill animation untuk tab switcher
    const tabBtnRefs = useRef<(HTMLButtonElement | null)[]>([])
    const [tabPill, setTabPill] = useState({ left: 0, width: 0 })
    const [tabReady, setTabReady] = useState(false)

    useEffect(() => {
      const idx = EDITOR_TABS.findIndex((t) => t.id === activeTab)
      const el = tabBtnRefs.current[idx === -1 ? 0 : idx]
      if (el) {
        setTabPill({ left: el.offsetLeft, width: el.offsetWidth })
        setTabReady(true)
      }
    }, [activeTab])

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

    const toggleLinePrefix = (type: 'heading' | 'bullet' | 'number') => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.focus()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const lineStart = currentValue.lastIndexOf('\n', start - 1) + 1
      const lineEndIndex = currentValue.indexOf('\n', start)
      const lineEnd = lineEndIndex === -1 ? currentValue.length : lineEndIndex

      const beforeLine = currentValue.slice(0, lineStart)
      const lineText = currentValue.slice(lineStart, lineEnd)
      const afterLine = currentValue.slice(lineEnd)

      let newLineText = ''
      let cursorOffset = 0

      const bulletMatch = lineText.match(/^(\s*)([-*])\s(.*)$/)
      const numberMatch = lineText.match(/^(\s*)(\d+)\.\s(.*)$/)
      const headingMatch = lineText.match(/^(\s*)(#{1,6})\s(.*)$/)

      if (type === 'bullet') {
        if (bulletMatch) {
          return
        } else if (numberMatch) {
          newLineText = `${numberMatch[1]}- ${numberMatch[3]}`
          cursorOffset = newLineText.length - lineText.length
        } else if (headingMatch) {
          newLineText = `${headingMatch[1]}- ${headingMatch[3]}`
          cursorOffset = newLineText.length - lineText.length
        } else {
          const indentMatch = lineText.match(/^(\s*)(.*)$/)
          const indent = indentMatch ? indentMatch[1] : ''
          const rest = indentMatch ? indentMatch[2] : lineText
          newLineText = `${indent}- ${rest}`
          cursorOffset = 2
        }
      } else if (type === 'number') {
        let targetNum = 1
        if (lineStart > 0) {
          const prevText = currentValue.slice(0, lineStart - 1)
          const prevLineStart = prevText.lastIndexOf('\n') + 1
          const prevLine = prevText.slice(prevLineStart)
          const prevNumMatch = prevLine.match(/^(\s*)(\d+)\.\s/)
          if (prevNumMatch) {
            targetNum = parseInt(prevNumMatch[2], 10) + 1
          }
        }

        if (numberMatch) {
          return
        } else if (bulletMatch) {
          newLineText = `${bulletMatch[1]}${targetNum}. ${bulletMatch[3]}`
          cursorOffset = newLineText.length - lineText.length
        } else if (headingMatch) {
          newLineText = `${headingMatch[1]}${targetNum}. ${headingMatch[3]}`
          cursorOffset = newLineText.length - lineText.length
        } else {
          const indentMatch = lineText.match(/^(\s*)(.*)$/)
          const indent = indentMatch ? indentMatch[1] : ''
          const rest = indentMatch ? indentMatch[2] : lineText
          const prefix = `${indent}${targetNum}. `
          newLineText = `${prefix}${rest}`
          cursorOffset = prefix.length
        }
      } else if (type === 'heading') {
        if (headingMatch) {
          return
        } else if (bulletMatch) {
          newLineText = `${bulletMatch[1]}### ${bulletMatch[3]}`
          cursorOffset = newLineText.length - lineText.length
        } else if (numberMatch) {
          newLineText = `${numberMatch[1]}### ${numberMatch[3]}`
          cursorOffset = newLineText.length - lineText.length
        } else {
          const indentMatch = lineText.match(/^(\s*)(.*)$/)
          const indent = indentMatch ? indentMatch[1] : ''
          const rest = indentMatch ? indentMatch[2] : lineText
          newLineText = `${indent}### ${rest}`
          cursorOffset = 4
        }
      }

      const nextVal = `${beforeLine}${newLineText}${afterLine}`
      updateValue(nextVal)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const newPos = Math.min(nextVal.length, Math.max(0, start + cursorOffset))
          textareaRef.current.setSelectionRange(newPos, newPos)
        }
      }, 10)
    }

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

    const insertRawSnippet = (snippet: string) => {
      const textarea = textareaRef.current
      if (!textarea) {
        updateValue(currentValue + snippet)
        return
      }

      textarea.focus()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const nextVal = currentValue.slice(0, start) + snippet + currentValue.slice(end)
      updateValue(nextVal)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const newPos = start + snippet.length
          textareaRef.current.setSelectionRange(newPos, newPos)
        }
      }, 10)
    }

    // Handle Upload File Gambar
    const handleUploadImageFile = async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Hanya file gambar (JPG, PNG, WEBP, GIF) yang diperbolehkan.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran maksimal gambar adalah 5MB.')
        return
      }

      setIsUploadingImage(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (res.data?.success && res.data?.url) {
          setImageUrl(res.data.url)
          toast.success('Gambar berhasil diunggah')
        } else {
          throw new Error('Gagal mengunggah gambar.')
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal mengunggah gambar.')
      } finally {
        setIsUploadingImage(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }

    // Submit Sisipkan Gambar
    const handleInsertImage = () => {
      if (!imageUrl.trim()) {
        toast.error('Pilih atau masukkan tautan URL gambar terlebih dahulu.')
        return
      }

      const caption = imageCaption.trim()
      const snippet = caption
        ? `\n\n![${caption}](${imageUrl.trim()} "${caption}")\n\n`
        : `\n\n![Gambar](${imageUrl.trim()})\n\n`

      insertRawSnippet(snippet)
      setIsImageModalOpen(false)
      setImageUrl('')
      setImageCaption('')
      toast.success('Foto berhasil disisipkan')
    }

    // Submit Sisipkan Kode
    const handleInsertCode = () => {
      if (codeMode === 'inline') {
        const code = codeContent.trim() || 'console.log("Halo")'
        insertRawSnippet(`\`${code}\``)
      } else {
        const code = codeContent.trim() || '// Tulis kode di sini'
        insertRawSnippet(`\n\n\`\`\`${selectedLang}\n${code}\n\`\`\`\n\n`)
      }
      setIsCodeModalOpen(false)
      toast.success('Kode berhasil disisipkan')
    }

    // Submit Sisipkan Rumus KaTeX
    const handleInsertMath = () => {
      const tex = mathLatex.trim()
      if (!tex) {
        toast.error('Rumus tidak boleh kosong.')
        return
      }

      if (mathMode === 'inline') {
        insertRawSnippet(` $${tex}$ `)
      } else {
        insertRawSnippet(`\n\n$$\n${tex}\n$$\n\n`)
      }
      setIsMathModalOpen(false)
      toast.success('Rumus berhasil disisipkan')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        insertFormatting('**', '**', 'teks tebal')
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        insertFormatting('*', '*', 'teks miring')
        return
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        if (start !== end) return

        const lineStart = currentValue.lastIndexOf('\n', start - 1) + 1
        const lineBeforeCursor = currentValue.slice(lineStart, start)

        const bulletMatch = lineBeforeCursor.match(/^(\s*)([-*])\s(.*)$/)
        const numberMatch = lineBeforeCursor.match(/^(\s*)(\d+)\.\s(.*)$/)

        if (bulletMatch) {
          e.preventDefault()
          const indent = bulletMatch[1]
          const content = bulletMatch[3].trim()

          if (content.length === 0) {
            const nextVal = currentValue.slice(0, lineStart) + currentValue.slice(start)
            updateValue(nextVal)
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(lineStart, lineStart)
              }
            }, 10)
          } else {
            const insertion = `\n${indent}- `
            const nextVal = currentValue.slice(0, start) + insertion + currentValue.slice(start)
            updateValue(nextVal)
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.focus()
                const newPos = start + insertion.length
                textareaRef.current.setSelectionRange(newPos, newPos)
              }
            }, 10)
          }
          return
        }

        if (numberMatch) {
          e.preventDefault()
          const indent = numberMatch[1]
          const currentNum = parseInt(numberMatch[2], 10)
          const content = numberMatch[3].trim()

          if (content.length === 0) {
            const nextVal = currentValue.slice(0, lineStart) + currentValue.slice(start)
            updateValue(nextVal)
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(lineStart, lineStart)
              }
            }, 10)
          } else {
            const nextNum = currentNum + 1
            const insertion = `\n${indent}${nextNum}. `
            const nextVal = currentValue.slice(0, start) + insertion + currentValue.slice(start)
            updateValue(nextVal)
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.focus()
                const newPos = start + insertion.length
                textareaRef.current.setSelectionRange(newPos, newPos)
              }
            }, 10)
          }
          return
        }
      }
    }

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

    const renderedMathPreview = useMemo(() => {
      try {
        return katex.renderToString(mathLatex.trim() || 'f(x)', {
          displayMode: mathMode === 'block',
          throwOnError: false,
          output: 'htmlAndMathml',
        })
      } catch {
        return `<span style="color:#ef4444">${mathLatex}</span>`
      }
    }, [mathLatex, mathMode])

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
          overflow: 'visible',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          ...style,
        }}
      >
        {/* Toolbar Header - Clean & Minimal */}
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
          {/* Tombol Format */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {/* Tebal */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertFormatting('**', '**', 'teks tebal')}
              title="Tebalkan Teks (Ctrl+B)"
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
              }}
            >
              <Bold size={13} strokeWidth={2.5} />
              <span>Tebal</span>
            </button>

            {/* Miring */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => insertFormatting('*', '*', 'teks miring')}
              title="Miringkan Teks (Ctrl+I)"
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
              }}
            >
              <Italic size={13} strokeWidth={2.5} />
              <span>Miring</span>
            </button>

            {/* Judul */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => toggleLinePrefix('heading')}
              title="Buat Judul (###)"
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
              }}
            >
              <Heading size={13} strokeWidth={2.5} />
              <span>Judul</span>
            </button>

            {/* Poin */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => toggleLinePrefix('bullet')}
              title="Daftar Poin (-)"
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
              }}
            >
              <List size={13} strokeWidth={2.5} />
              <span>Poin</span>
            </button>

            {/* Nomor */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => toggleLinePrefix('number')}
              title="Daftar Nomor (1. )"
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
              }}
            >
              <ListOrdered size={13} strokeWidth={2.5} />
              <span>Nomor</span>
            </button>

            <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.1)', margin: '0 3px' }} />

            {/* 📷 Foto */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => setIsImageModalOpen(true)}
              title="Sisipkan Foto"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 6,
                border: '1px solid rgba(1, 133, 86, 0.2)',
                background: '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-primary, #018556)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
              }}
            >
              <ImageIcon size={13} strokeWidth={2.5} />
              <span>Foto</span>
            </button>

            {/* 💻 Kode */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => setIsCodeModalOpen(true)}
              title="Sisipkan Kode"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 6,
                border: '1px solid rgba(1, 133, 86, 0.2)',
                background: '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-primary, #018556)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
              }}
            >
              <Code size={13} strokeWidth={2.5} />
              <span>Kode</span>
            </button>

            {/* 📐 Rumus */}
            <button
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => setIsMathModalOpen(true)}
              title="Sisipkan Rumus Matematika"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 6,
                border: '1px solid rgba(1, 133, 86, 0.2)',
                background: '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: 'var(--color-primary, #018556)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
              }}
            >
              <Sigma size={13} strokeWidth={2.5} />
              <span>Rumus</span>
            </button>

            <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.1)', margin: '0 3px' }} />

            {/* Emoji */}
            <button
              ref={emojiButtonRef}
              type="button"
              disabled={disabled || activeTab === 'preview'}
              onClick={() => setIsEmojiOpen(!isEmojiOpen)}
              title="Pilih Emoji"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 6,
                border: isEmojiOpen ? '1px solid var(--color-primary, #018556)' : '1px solid rgba(0,0,0,0.08)',
                background: isEmojiOpen ? 'rgba(1, 133, 86, 0.08)' : '#ffffff',
                cursor: activeTab === 'preview' ? 'not-allowed' : 'pointer',
                color: isEmojiOpen ? 'var(--color-primary, #018556)' : 'var(--color-text-primary, #0f172a)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: activeTab === 'preview' ? 0.4 : 1,
              }}
            >
              <Smile size={13} color={isEmojiOpen ? 'var(--color-primary, #018556)' : '#475569'} strokeWidth={2.5} />
              <span>Emoji</span>
            </button>
          </div>

          {/* Switcher Tab: Tulis vs Pratinjau */}
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--color-bg, #f1f5f9)',
              border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: 9999,
              padding: 3,
            }}
          >
            {tabReady && (
              <motion.div
                animate={{ left: tabPill.left, width: tabPill.width }}
                transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  top: 3,
                  bottom: 3,
                  background: 'var(--color-surface, #ffffff)',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))',
                  borderRadius: 9999,
                  border: '1px solid var(--color-border, #e2e8f0)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
            )}

            {EDITOR_TABS.map((tab, i) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabBtnRefs.current[i] = el }}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as 'write' | 'preview')
                    setIsEmojiOpen(false)
                  }}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 11px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--color-primary, #018556)' : 'var(--color-text-secondary, #64748b)',
                    transition: 'color 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Popover Pemilih Emoji ──────────────────────────────────── */}
        {isEmojiOpen && (
          <div
            ref={emojiPopoverRef}
            style={{
              position: 'absolute',
              top: 44,
              right: 10,
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
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                  Pilih Emoji
                </span>
                <button
                  type="button"
                  onClick={() => setIsEmojiOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Cari emoji..."
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

            {!emojiSearch.trim() && (
              <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', padding: '4px 6px', gap: 3, overflowX: 'auto' }}>
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
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{ maxHeight: 180, overflowY: 'auto', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
              {filteredEmojis.map((item, idx) => (
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
                  }}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MODAL SISIPKAN FOTO (CLEAN & MINIMAL) ──────────────────── */}
        {isImageModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 460,
                background: '#ffffff',
                borderRadius: 14,
                boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header Modal */}
              <div
                style={{
                  padding: '14px 18px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary, #018556)', padding: 6, borderRadius: 8 }}>
                    <ImageIcon size={16} strokeWidth={2.5} />
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Sisipkan Foto
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Segmented Pill Tab Selector */}
              <div style={{ padding: '14px 18px 0', background: '#ffffff' }}>
                <div
                  style={{
                    display: 'flex',
                    background: '#f1f5f9',
                    borderRadius: 8,
                    padding: 3,
                    gap: 3,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: imageTab === 'upload' ? '#ffffff' : 'transparent',
                      color: imageTab === 'upload' ? 'var(--color-primary, #018556)' : '#64748b',
                      fontWeight: imageTab === 'upload' ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: imageTab === 'upload' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Upload size={13} />
                    Unggah File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: imageTab === 'url' ? '#ffffff' : 'transparent',
                      color: imageTab === 'url' ? 'var(--color-primary, #018556)' : '#64748b',
                      fontWeight: imageTab === 'url' ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: imageTab === 'url' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <LinkIcon size={13} />
                    Tautan URL
                  </button>
                </div>
              </div>

              {/* Body Form Modal */}
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {imageTab === 'upload' ? (
                  <div>
                    {imageUrl ? (
                      <div style={{ position: 'relative', width: '100%', height: 150, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'rgba(15, 23, 42, 0.75)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          width: '100%',
                          height: 125,
                          borderRadius: 10,
                          border: '1.5px dashed #cbd5e1',
                          background: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                          gap: 6,
                        }}
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 size={22} className="animate-spin" color="var(--color-primary, #018556)" />
                            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Mengunggah...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={18} color="var(--color-primary, #018556)" />
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                              Pilih file gambar atau seret ke sini
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              PNG, JPG, WEBP (maks. 5MB)
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadImageFile(file)
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                      Tautan Gambar
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/foto.png"
                      style={{
                        width: '100%',
                        padding: '8px 11px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {/* Caption Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                    Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Tulis keterangan foto..."
                    style={{
                      width: '100%',
                      padding: '8px 11px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Footer Modal */}
              <div
                style={{
                  padding: '12px 18px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  style={{
                    padding: '7px 13px',
                    borderRadius: 7,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!imageUrl.trim() || isUploadingImage}
                  onClick={handleInsertImage}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 7,
                    border: 'none',
                    background: (!imageUrl.trim() || isUploadingImage) ? '#94a3b8' : 'var(--color-primary, #018556)',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: (!imageUrl.trim() || isUploadingImage) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Sisipkan Foto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL SISIPKAN KODE (CLEAN & DENGAN CLEANCOMBOBOX) ─────── */}
        {isCodeModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 540,
                background: '#ffffff',
                borderRadius: 14,
                boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
              }}
            >
              {/* Header Modal */}
              <div
                style={{
                  padding: '14px 18px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '14px 14px 0 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary, #018556)', padding: 6, borderRadius: 8 }}>
                    <Code size={16} strokeWidth={2.5} />
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Sisipkan Kode
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCodeModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body Form Modal */}
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Segmented Pill Mode Switcher */}
                <div
                  style={{
                    display: 'flex',
                    background: '#f1f5f9',
                    borderRadius: 8,
                    padding: 3,
                    gap: 3,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCodeMode('block')}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: codeMode === 'block' ? '#ffffff' : 'transparent',
                      color: codeMode === 'block' ? 'var(--color-primary, #018556)' : '#64748b',
                      fontWeight: codeMode === 'block' ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: codeMode === 'block' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Terminal size={13} />
                    Blok Program
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeMode('inline')}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: codeMode === 'inline' ? '#ffffff' : 'transparent',
                      color: codeMode === 'inline' ? 'var(--color-primary, #018556)' : '#64748b',
                      fontWeight: codeMode === 'inline' ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: codeMode === 'inline' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FileCode2 size={13} />
                    Kode Sebaris
                  </button>
                </div>

                {/* Combobox Bahasa Pemrograman (CleanCombobox) */}
                {codeMode === 'block' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>
                      Bahasa Pemrograman
                    </label>
                    <CleanCombobox
                      options={LANGUAGE_OPTIONS}
                      value={selectedLang}
                      onChange={(newLang) => {
                        setSelectedLang(newLang)
                        if (LANGUAGE_SAMPLES[newLang] && (!codeContent.trim() || Object.values(LANGUAGE_SAMPLES).includes(codeContent))) {
                          setCodeContent(LANGUAGE_SAMPLES[newLang])
                        }
                      }}
                      placeholder="Pilih bahasa..."
                      width="100%"
                      allowClear={false}
                    />
                  </div>
                )}

                {/* Editor Kode */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>
                    Kode
                  </label>
                  <textarea
                    rows={codeMode === 'block' ? 7 : 3}
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    placeholder="Tuliskan kode di sini..."
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#0d1117',
                      color: '#e6edf3',
                      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Menlo, monospace",
                      fontSize: '13px',
                      lineHeight: 1.5,
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Footer Modal */}
              <div
                style={{
                  padding: '12px 18px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8,
                  borderRadius: '0 0 14px 14px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCodeModalOpen(false)}
                  style={{
                    padding: '7px 13px',
                    borderRadius: 7,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleInsertCode}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 7,
                    border: 'none',
                    background: 'var(--color-primary, #018556)',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sisipkan Kode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL SISIPKAN RUMUS (CLEAN & MINIMAL) ─────────────────── */}
        {isMathModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 540,
                maxHeight: '90vh',
                background: '#ffffff',
                borderRadius: 14,
                boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header Modal */}
              <div
                style={{
                  padding: '14px 18px',
                  background: '#f8fafc',
                  borderTop: 'none',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'rgba(1, 133, 86, 0.1)', color: 'var(--color-primary, #018556)', padding: 6, borderRadius: 8 }}>
                    <Sigma size={16} strokeWidth={2.5} />
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Sisipkan Rumus Matematika
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMathModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body Form Modal */}
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                {/* Live Preview Box */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>
                    Pratinjau
                  </label>
                  <div
                    style={{
                      width: '100%',
                      minHeight: 56,
                      padding: '12px',
                      borderRadius: 8,
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '17px',
                      color: '#0f172a',
                      overflowX: 'auto',
                    }}
                    dangerouslySetInnerHTML={{ __html: renderedMathPreview }}
                  />
                </div>

                {/* Input Formula */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>
                    Formula (LaTeX)
                  </label>
                  <input
                    type="text"
                    value={mathLatex}
                    onChange={(e) => setMathLatex(e.target.value)}
                    placeholder="Contoh: \frac{a}{b}"
                    style={{
                      width: '100%',
                      padding: '8px 11px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontFamily: "'JetBrains Mono', Consolas, monospace",
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Template Cepat */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                    Template Cepat
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 110, overflowY: 'auto' }}>
                    {MATH_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMathLatex(preset.latex)}
                        style={{
                          padding: '4px 9px',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          background: mathLatex === preset.latex ? 'rgba(1, 133, 86, 0.1)' : '#f8fafc',
                          borderColor: mathLatex === preset.latex ? 'var(--color-primary, #018556)' : '#e2e8f0',
                          color: mathLatex === preset.latex ? 'var(--color-primary, #018556)' : '#334155',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posisi Tampilan (Segmented Switcher) */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>
                    Posisi Tampilan
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      background: '#f1f5f9',
                      borderRadius: 8,
                      padding: 3,
                      gap: 3,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setMathMode('block')}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: mathMode === 'block' ? '#ffffff' : 'transparent',
                        color: mathMode === 'block' ? 'var(--color-primary, #018556)' : '#64748b',
                        fontWeight: mathMode === 'block' ? 700 : 500,
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: mathMode === 'block' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Blok Tengah ($$...$$)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMathMode('inline')}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: mathMode === 'inline' ? '#ffffff' : 'transparent',
                        color: mathMode === 'inline' ? 'var(--color-primary, #018556)' : '#64748b',
                        fontWeight: mathMode === 'inline' ? 700 : 500,
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: mathMode === 'inline' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Dalam Kalimat ($...$)
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div
                style={{
                  padding: '12px 18px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsMathModalOpen(false)}
                  style={{
                    padding: '7px 13px',
                    borderRadius: 7,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleInsertMath}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 7,
                    border: 'none',
                    background: 'var(--color-primary, #018556)',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sisipkan Rumus
                </button>
              </div>
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
      </div>
    )
  }
)

MarkdownTextarea.displayName = 'MarkdownTextarea'
export default MarkdownTextarea
