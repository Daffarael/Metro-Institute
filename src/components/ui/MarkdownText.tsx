'use client'

import React, { useState } from 'react'
import katex from 'katex'
import {
  Copy,
  Check,
  Terminal,
  Maximize2,
  X,
  ExternalLink,
  Sigma,
  FileCode2,
  ZoomIn
} from 'lucide-react'

interface MarkdownTextProps {
  content?: string | null
  className?: string
  style?: React.CSSProperties
}

// ─── KaTeX Math Renderer ──────────────────────────────────────────────
function renderKatexHtml(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    })
  } catch {
    return `<span style="color:#ef4444;font-family:monospace;background:#fee2e2;padding:2px 6px;border-radius:4px;">${tex}</span>`
  }
}

// ─── Code Block Component with Syntax Highlighting & Copy ─────────────
interface CodeBlockProps {
  code: string
  language?: string
}

const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JAVASCRIPT',
  javascript: 'JAVASCRIPT',
  ts: 'TYPESCRIPT',
  typescript: 'TYPESCRIPT',
  py: 'PYTHON',
  python: 'PYTHON',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  sql: 'SQL',
  sh: 'BASH / SHELL',
  bash: 'BASH / SHELL',
  shell: 'BASH / SHELL',
  java: 'JAVA',
  kotlin: 'KOTLIN',
  dart: 'DART / FLUTTER',
  cpp: 'C++',
  c: 'C',
  cs: 'C#',
  csharp: 'C#',
  php: 'PHP',
  go: 'GO',
  rust: 'RUST',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  markdown: 'MARKDOWN',
  md: 'MARKDOWN',
}

function highlightSyntax(code: string, lang: string): React.ReactNode[] {
  const lines = code.split('\n')
  const l = lang.toLowerCase()

  // Token definition regex
  const isSql = l === 'sql'
  const isPython = l === 'py' || l === 'python'
  const isHtml = l === 'html' || l === 'xml'

  // Generic patterns
  const KEYWORD_REGEX = isSql
    ? /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|BY|ORDER|HAVING|LIMIT|CREATE|TABLE|ALTER|DROP|AND|OR|NOT|IN|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|PRIMARY|KEY|FOREIGN|REFERENCES|CASE|WHEN|THEN|ELSE|END|UNION|ALL|EXISTS|IS|NULL)\b/i
    : /\b(const|let|var|function|class|return|if|else|switch|case|for|while|do|async|await|import|export|from|default|new|this|try|catch|finally|throw|typeof|instanceof|interface|type|enum|public|private|protected|static|readonly|extends|implements|package|def|lambda|elif|except|with|yield|pass|raise|break|continue|nil|fn|mut|struct|impl|match)\b/

  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = []
    let cursor = 0
    let keyIdx = 0

    // Single-line comment check
    let commentIdx = -1
    if (isPython) {
      commentIdx = line.indexOf('#')
    } else if (isSql) {
      commentIdx = line.indexOf('--')
    } else {
      commentIdx = line.indexOf('//')
    }

    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line
    const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : ''

    // Tokenize strings, numbers, keywords in codePart
    const tokenRegex = /(".*?"|'.*?'|`.*?`|\b\d+(\.\d+)?\b|[a-zA-Z_$][a-zA-Z0-9_$]*|[+\-*/%=<>!&|^~]+|[()[\]{}.,;])/g
    let match: RegExpExecArray | null

    while ((match = tokenRegex.exec(codePart)) !== null) {
      if (match.index > cursor) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#abb2bf' }}>
            {codePart.slice(cursor, match.index)}
          </span>
        )
      }

      const val = match[0]

      // String literal
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'")) ||
        (val.startsWith('`') && val.endsWith('`'))
      ) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#98c379' }}>
            {val}
          </span>
        )
      }
      // Numeric literal
      else if (/^\d+(\.\d+)?$/.test(val)) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#d19a66' }}>
            {val}
          </span>
        )
      }
      // Keyword
      else if (KEYWORD_REGEX.test(val)) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#c678dd', fontWeight: 600 }}>
            {val}
          </span>
        )
      }
      // Boolean / Null / Undefined
      else if (/^(true|false|null|undefined|None|True|False|nil)$/i.test(val)) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#e5c07b', fontWeight: 600 }}>
            {val}
          </span>
        )
      }
      // Function call
      else if (
        match.index + val.length < codePart.length &&
        codePart[match.index + val.length] === '('
      ) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#61afef' }}>
            {val}
          </span>
        )
      }
      // Standard identifier / variable
      else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(val)) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#e06c75' }}>
            {val}
          </span>
        )
      }
      // Operators & punctuation
      else {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#56b6c2' }}>
            {val}
          </span>
        )
      }

      cursor = tokenRegex.lastIndex
    }

    if (cursor < codePart.length) {
      tokens.push(
        <span key={keyIdx++} style={{ color: '#abb2bf' }}>
          {codePart.slice(cursor)}
        </span>
      )
    }

    // Append comment if exists
    if (commentPart) {
      tokens.push(
        <span key={keyIdx++} style={{ color: '#5c6370', fontStyle: 'italic' }}>
          {commentPart}
        </span>
      )
    }

    return (
      <div
        key={lineIdx}
        style={{
          display: 'flex',
          lineHeight: '1.65',
          fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: '13px',
        }}
      >
        <span
          style={{
            userSelect: 'none',
            color: '#4b5263',
            minWidth: '32px',
            paddingRight: '16px',
            textAlign: 'right',
            flexShrink: 0,
            opacity: 0.7,
            fontSize: '12px',
          }}
        >
          {lineIdx + 1}
        </span>
        <span style={{ flex: 1, whiteSpace: 'pre' }}>
          {tokens.length > 0 ? tokens : ' '}
        </span>
      </div>
    )
  })
}

function CodeBlock({ code, language = 'plaintext' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const cleanCode = code.trimEnd()
  const displayLang = LANGUAGE_LABELS[language.toLowerCase()] || (language ? language.toUpperCase() : 'CODE')

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        margin: '18px 0',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #1e293b',
        background: '#0d1117',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* Code Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: '#161b22',
          borderBottom: '1px solid #21262d',
        }}
      >
        {/* Left: Window Dots & Language Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#8b949e',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Terminal size={12} strokeWidth={2.2} />
            {displayLang}
          </span>
        </div>

        {/* Right: Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: copied ? 'rgba(39, 201, 63, 0.15)' : '#21262d',
            color: copied ? '#27c93f' : '#c9d1d9',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!copied) e.currentTarget.style.borderColor = '#8b949e'
          }}
          onMouseLeave={(e) => {
            if (!copied) e.currentTarget.style.borderColor = '#30363d'
          }}
        >
          {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} strokeWidth={2.2} />}
          <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
        </button>
      </div>

      {/* Code Body */}
      <div
        style={{
          padding: '14px 16px',
          overflowX: 'auto',
          maxHeight: 520,
        }}
      >
        {highlightSyntax(cleanCode, language)}
      </div>
    </div>
  )
}

// ─── Mathematical Equation Display Block ──────────────────────────────
interface MathBlockProps {
  equation: string
}

function MathBlock({ equation }: MathBlockProps) {
  const [copied, setCopied] = useState(false)
  const cleanEq = equation.trim()
  const html = renderKatexHtml(cleanEq, true)

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanEq)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        margin: '18px 0',
        padding: '16px 20px',
        borderRadius: 12,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflowX: 'auto',
      }}
    >
      {/* Top right label & copy */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-primary, #018556)',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Sigma size={13} strokeWidth={2.5} />
          PERSAMAAN MATEMATIKA / RUMUS
        </span>
        <button
          type="button"
          onClick={handleCopy}
          title="Salin sintaks rumus LaTeX"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: copied ? 'var(--color-primary, #018556)' : '#64748b',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {copied ? <Check size={11} strokeWidth={3} /> : <Copy size={11} strokeWidth={2} />}
          <span>{copied ? 'Tersalin' : 'Salin Rumus'}</span>
        </button>
      </div>

      {/* Rendered Equation */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          textAlign: 'center',
          padding: '8px 0',
          fontSize: '17px',
          color: '#0f172a',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

// ─── Image Figure with Click-to-Zoom Lightbox Modal ───────────────────
interface ImageBlockProps {
  src: string
  alt?: string
  caption?: string
}

function ImageBlock({ src, alt = '', caption = '' }: ImageBlockProps) {
  const [isOpen, setIsOpen] = useState(false)
  const displayCaption = caption || alt

  return (
    <>
      <figure
        style={{
          margin: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          onClick={() => setIsOpen(true)}
          style={{
            position: 'relative',
            maxWidth: '100%',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            cursor: 'zoom-in',
            background: '#f8fafc',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || 'Gambar materi pembelajaran'}
            loading="lazy"
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: 520,
              objectFit: 'contain',
              margin: '0 auto',
            }}
          />
          {/* Hover Overlay Hint */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              pointerEvents: 'none',
            }}
          >
            <ZoomIn size={12} />
            <span>Perbesar</span>
          </div>
        </div>

        {displayCaption && (
          <figcaption
            style={{
              marginTop: 8,
              fontSize: '12.5px',
              color: '#64748b',
              fontStyle: 'italic',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            📷 {displayCaption}
          </figcaption>
        )}
      </figure>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Top Bar with Close button */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              right: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <ExternalLink size={13} />
              Buka Tab Baru
            </a>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#0f172a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Full Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || 'Pratinjau gambar'}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
            }}
          />

          {displayCaption && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                marginTop: 14,
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 500,
                textAlign: 'center',
                maxWidth: '80%',
              }}
            >
              {displayCaption}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ─── Inline Markdown & Inline Math Parser ─────────────────────────────
/**
 * Parses inline Markdown formatting:
 * - Math equations: `$formula$` and `\(formula\)`
 * - Inline code: `code`
 * - Bold / Italic: ***bold italic***, **bold**, *italic*
 * - Strikethrough: ~~strikethrough~~
 * - Links: [text](url)
 * - Images inline: ![alt](url)
 */
function parseInline(text: string): React.ReactNode[] {
  if (!text) return []

  // Regex tokens
  // 1: Inline Math $...$ (ensure not just currency like $100)
  // 2: Inline code `...`
  // 3: Inline image ![...](...)
  // 4: Bold italic ***...*** or ___...___
  // 5: Bold **...** or __...__
  // 6: Italic *...* or _..._
  // 7: Strikethrough ~~...~~
  // 8: Link [...] (...)
  const regex = /(\$(?:\\\$|[^\$])+\$)|(`[^`]+`)|(!\[([^\]]*)\]\(([^)]+)\))|(\*\*\*[^*]+\*\*\*|___[^_]+___)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*]+\*|_[^_]+_)|(~~[^~]+~~)|(\[[^\]]+\]\([^)]+\))/g

  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<React.Fragment key={key++}>{text.slice(lastIndex, match.index)}</React.Fragment>)
    }

    const val = match[0]

    // 1. Inline Math: $...$
    if (val.startsWith('$') && val.endsWith('$') && val.length > 2) {
      const tex = val.slice(1, -1)
      const isPureCurrency = /^\d+(,\d+)*(\.\d+)?$/.test(tex.trim())
      if (isPureCurrency) {
        // Tampilkan sebagai nilai mata uang biasa jika hanya angka seperti $100
        nodes.push(<React.Fragment key={key++}>{val}</React.Fragment>)
      } else {
        const html = renderKatexHtml(tex, false)
        nodes.push(
          <span
            key={key++}
            className="inline-equation"
            style={{
              padding: '0 3px',
              display: 'inline-block',
              verticalAlign: 'baseline',
              fontSize: '1.05em',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      }
    }
    // 2. Inline Code: `...`
    else if (val.startsWith('`') && val.endsWith('`')) {
      nodes.push(
        <code
          key={key++}
          style={{
            background: 'rgba(15, 23, 42, 0.06)',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: '0.88em',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            color: '#0f172a',
            border: '1px solid rgba(15, 23, 42, 0.08)',
          }}
        >
          {val.slice(1, -1)}
        </code>
      )
    }
    // 3. Inline Image: ![alt](url)
    else if (val.startsWith('![') && val.includes('](') && val.endsWith(')')) {
      const imgMatch = val.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
      if (imgMatch) {
        const alt = imgMatch[1]
        const rawUrl = imgMatch[2]
        const [url, ...titleParts] = rawUrl.split(/\s+"([^"]+)"/)
        const title = titleParts[0] || ''
        nodes.push(<ImageBlock key={key++} src={url.trim()} alt={alt} caption={title} />)
      } else {
        nodes.push(<React.Fragment key={key++}>{val}</React.Fragment>)
      }
    }
    // 4. Bold Italic: ***...***
    else if ((val.startsWith('***') && val.endsWith('***')) || (val.startsWith('___') && val.endsWith('___'))) {
      nodes.push(
        <strong key={key++} style={{ fontWeight: 700 }}>
          <em>{parseInline(val.slice(3, -3))}</em>
        </strong>
      )
    }
    // 5. Bold: **...**
    else if ((val.startsWith('**') && val.endsWith('**')) || (val.startsWith('__') && val.endsWith('__'))) {
      nodes.push(
        <strong key={key++} style={{ fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
          {parseInline(val.slice(2, -2))}
        </strong>
      )
    }
    // 6. Italic: *...*
    else if ((val.startsWith('*') && val.endsWith('*')) || (val.startsWith('_') && val.endsWith('_'))) {
      nodes.push(
        <em key={key++} style={{ fontStyle: 'italic' }}>
          {parseInline(val.slice(1, -1))}
        </em>
      )
    }
    // 7. Strikethrough: ~~...~~
    else if (val.startsWith('~~') && val.endsWith('~~')) {
      nodes.push(
        <del key={key++} style={{ textDecoration: 'line-through', opacity: 0.75 }}>
          {parseInline(val.slice(2, -2))}
        </del>
      )
    }
    // 8. Link: [text](url)
    else if (val.startsWith('[') && val.includes('](') && val.endsWith(')')) {
      const linkMatch = val.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        nodes.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-primary, #018556)',
              textDecoration: 'underline',
              fontWeight: 600,
              wordBreak: 'break-all',
            }}
          >
            {linkMatch[1]}
          </a>
        )
      } else {
        nodes.push(<React.Fragment key={key++}>{val}</React.Fragment>)
      }
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(<React.Fragment key={key++}>{text.slice(lastIndex)}</React.Fragment>)
  }

  return nodes
}

// ─── Block-Level Markdown Parser ──────────────────────────────────────
function parseBlocks(content: string): React.ReactNode[] {
  if (!content) return []

  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let key = 0
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line
    if (!line.trim()) {
      i++
      continue
    }

    // 1. Fenced Code Block: ```[lang] ... ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++ // consume closing ```
      }
      blocks.push(<CodeBlock key={key++} code={codeLines.join('\n')} language={lang} />)
      continue
    }

    // 2. Block Mathematical Equation: $$ ... $$
    if (line.trim().startsWith('$$')) {
      const trimmed = line.trim()
      if (trimmed.endsWith('$$') && trimmed.length > 4) {
        // Single line $$formula$$
        const eq = trimmed.slice(2, -2)
        blocks.push(<MathBlock key={key++} equation={eq} />)
        i++
        continue
      } else {
        // Multi-line $$ ... $$
        const eqLines: string[] = []
        i++
        while (i < lines.length && !lines[i].trim().endsWith('$$')) {
          eqLines.push(lines[i])
          i++
        }
        if (i < lines.length && lines[i].trim().endsWith('$$')) {
          const last = lines[i].trim().slice(0, -2)
          if (last) eqLines.push(last)
          i++
        }
        blocks.push(<MathBlock key={key++} equation={eqLines.join('\n')} />)
        continue
      }
    }

    // 3. Standalone Image: ![alt](url "optional caption")
    const standaloneImgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (standaloneImgMatch) {
      const alt = standaloneImgMatch[1]
      const rawUrl = standaloneImgMatch[2]
      const [url, ...titleParts] = rawUrl.split(/\s+"([^"]+)"/)
      const title = titleParts[0] || ''
      blocks.push(<ImageBlock key={key++} src={url.trim()} alt={alt} caption={title} />)
      i++
      continue
    }

    // 4. Horizontal Rule: --- or *** or ___
    if (line.trim().match(/^([-*_]){3,}$/)) {
      blocks.push(
        <hr
          key={key++}
          style={{
            border: 'none',
            borderTop: '1px solid #e2e8f0',
            margin: '24px 0',
          }}
        />
      )
      i++
      continue
    }

    // 5. Headings: # H1, ## H2, ### H3, #### H4
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      if (level === 1) {
        blocks.push(
          <h2
            key={key++}
            style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: '26px 0 12px',
              color: '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: 8,
            }}
          >
            {parseInline(text)}
          </h2>
        )
      } else if (level === 2) {
        blocks.push(
          <h3
            key={key++}
            style={{
              fontSize: '19px',
              fontWeight: 700,
              margin: '22px 0 10px',
              color: '#0f172a',
              letterSpacing: '-0.01em',
              lineHeight: 1.35,
            }}
          >
            {parseInline(text)}
          </h3>
        )
      } else {
        blocks.push(
          <h4
            key={key++}
            style={{
              fontSize: '16.5px',
              fontWeight: 700,
              margin: '18px 0 8px',
              color: '#0f172a',
              lineHeight: 1.4,
            }}
          >
            {parseInline(text)}
          </h4>
        )
      }
      i++
      continue
    }

    // 6. Blockquote: > quote
    if (line.startsWith('> ') || line === '>') {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push(
        <blockquote
          key={key++}
          style={{
            margin: '14px 0',
            padding: '10px 18px',
            borderLeft: '4px solid var(--color-primary, #018556)',
            background: 'rgba(1, 133, 86, 0.04)',
            borderRadius: '0 8px 8px 0',
            color: '#334155',
            fontSize: '14.5px',
            lineHeight: 1.65,
          }}
        >
          {quoteLines.map((ql, qIdx) => (
            <div key={qIdx}>{parseInline(ql)}</div>
          ))}
        </blockquote>
      )
      continue
    }

    // 7. Unordered List: - or *
    const ulMatch = line.match(/^(\s*)([-*•])\s+(.*)$/)
    if (ulMatch) {
      const listItems: string[] = []
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^(\s*)([-*•])\s+(.*)$/)
        if (itemMatch) {
          listItems.push(itemMatch[3])
          i++
        } else {
          break
        }
      }
      blocks.push(
        <ul
          key={key++}
          style={{
            margin: '8px 0 16px',
            paddingLeft: '24px',
            listStyleType: 'disc',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            color: '#334155',
          }}
        >
          {listItems.map((item, idx) => (
            <li key={idx} style={{ lineHeight: 1.7, fontSize: '14.5px' }}>
              {parseInline(item)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    // 8. Ordered List: 1. or 2.
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/)
    if (olMatch) {
      const listItems: string[] = []
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^(\s*)\d+\.\s+(.*)$/)
        if (itemMatch) {
          listItems.push(itemMatch[2])
          i++
        } else {
          break
        }
      }
      blocks.push(
        <ol
          key={key++}
          style={{
            margin: '8px 0 16px',
            paddingLeft: '24px',
            listStyleType: 'decimal',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            color: '#334155',
          }}
        >
          {listItems.map((item, idx) => (
            <li key={idx} style={{ lineHeight: 1.7, fontSize: '14.5px' }}>
              {parseInline(item)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    // 9. Regular Paragraph
    const pLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('$$') &&
      !lines[i].trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/) &&
      !lines[i].trim().match(/^([-*_]){3,}$/) &&
      !lines[i].match(/^(#{1,6})\s+/) &&
      !lines[i].startsWith('> ') &&
      !lines[i].match(/^(\s*)([-*•])\s+/) &&
      !lines[i].match(/^(\s*)\d+\.\s+/)
    ) {
      pLines.push(lines[i])
      i++
    }

    blocks.push(
      <div
        key={key++}
        style={{
          margin: '8px 0 16px',
          lineHeight: 1.8,
          fontSize: '14.5px',
          color: '#334155',
        }}
      >
        {pLines.map((pl, plIdx) => (
          <React.Fragment key={plIdx}>
            {plIdx > 0 && <br />}
            {parseInline(pl)}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return blocks
}

export default function MarkdownText({ content, className, style }: MarkdownTextProps) {
  if (!content) return null

  return (
    <div
      className={`markdown-content ${className || ''}`}
      style={{
        wordBreak: 'break-word',
        fontFamily: 'inherit',
        ...style,
      }}
    >
      {parseBlocks(content)}
    </div>
  )
}
