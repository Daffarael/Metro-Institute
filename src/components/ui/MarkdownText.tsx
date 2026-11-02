'use client'

import React from 'react'

interface MarkdownTextProps {
  content?: string | null
  className?: string
  style?: React.CSSProperties
}

/**
 * Parses inline Markdown formatting:
 * - `code`
 * - ***bold italic***
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - ~~strikethrough~~
 * - [link](url)
 */
function parseInline(text: string): React.ReactNode[] {
  if (!text) return []

  // Token regex for inline styles
  const regex = /(`[^`]+`)|(\*\*\*[^*]+\*\*\*|___[^_]+___)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*]+\*|_[^_]+_)|(~~[^~]+~~)|(\[[^\]]+\]\([^)]+\))/g

  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<React.Fragment key={key++}>{text.slice(lastIndex, match.index)}</React.Fragment>)
    }

    const val = match[0]

    if (val.startsWith('`') && val.endsWith('`')) {
      nodes.push(
        <code
          key={key++}
          style={{
            background: 'rgba(0, 0, 0, 0.05)',
            padding: '2px 5px',
            borderRadius: 4,
            fontSize: '0.9em',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: 'var(--color-text-primary, #0f172a)',
          }}
        >
          {val.slice(1, -1)}
        </code>
      )
    } else if ((val.startsWith('***') && val.endsWith('***')) || (val.startsWith('___') && val.endsWith('___'))) {
      nodes.push(
        <strong key={key++} style={{ fontWeight: 700 }}>
          <em>{parseInline(val.slice(3, -3))}</em>
        </strong>
      )
    } else if ((val.startsWith('**') && val.endsWith('**')) || (val.startsWith('__') && val.endsWith('__'))) {
      nodes.push(
        <strong key={key++} style={{ fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
          {parseInline(val.slice(2, -2))}
        </strong>
      )
    } else if ((val.startsWith('*') && val.endsWith('*')) || (val.startsWith('_') && val.endsWith('_'))) {
      nodes.push(
        <em key={key++} style={{ fontStyle: 'italic' }}>
          {parseInline(val.slice(1, -1))}
        </em>
      )
    } else if (val.startsWith('~~') && val.endsWith('~~')) {
      nodes.push(
        <del key={key++} style={{ textDecoration: 'line-through', opacity: 0.75 }}>
          {parseInline(val.slice(2, -2))}
        </del>
      )
    } else if (val.startsWith('[') && val.includes('](') && val.endsWith(')')) {
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

/**
 * Parses block-level Markdown formatting:
 * - Headings (#, ##, ###)
 * - Blockquotes (>)
 * - Unordered lists (-, *, •)
 * - Ordered lists (1., 2.)
 * - Paragraphs with preserved linebreaks
 */
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

    // Headings: # H1, ## H2, ### H3
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      if (level === 1) {
        blocks.push(
          <h3 key={key++} style={{ fontSize: '16px', fontWeight: 700, margin: '12px 0 6px', color: 'var(--color-text-primary, #0f172a)' }}>
            {parseInline(text)}
          </h3>
        )
      } else if (level === 2) {
        blocks.push(
          <h4 key={key++} style={{ fontSize: '14.5px', fontWeight: 700, margin: '10px 0 4px', color: 'var(--color-text-primary, #0f172a)' }}>
            {parseInline(text)}
          </h4>
        )
      } else {
        blocks.push(
          <h5 key={key++} style={{ fontSize: '13.5px', fontWeight: 600, margin: '8px 0 4px', color: 'var(--color-text-primary, #0f172a)' }}>
            {parseInline(text)}
          </h5>
        )
      }
      i++
      continue
    }

    // Blockquote: > quote
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
            margin: '8px 0',
            padding: '6px 12px',
            borderLeft: '3px solid var(--color-primary, #018556)',
            background: 'rgba(1, 133, 86, 0.04)',
            borderRadius: '0 8px 8px 0',
            color: 'var(--color-text-secondary, #475569)',
            fontSize: '0.95em',
            fontStyle: 'italic',
          }}
        >
          {quoteLines.map((ql, qIdx) => (
            <div key={qIdx}>{parseInline(ql)}</div>
          ))}
        </blockquote>
      )
      continue
    }

    // Unordered List: line starts with - or * or • followed by space
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
            margin: '6px 0',
            paddingLeft: '20px',
            listStyleType: 'disc',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {listItems.map((item, idx) => (
            <li key={idx} style={{ lineHeight: 1.55 }}>
              {parseInline(item)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered List: line starts with 1. or 2. etc.
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
            margin: '6px 0',
            paddingLeft: '20px',
            listStyleType: 'decimal',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {listItems.map((item, idx) => (
            <li key={idx} style={{ lineHeight: 1.55 }}>
              {parseInline(item)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Regular Paragraph: gather consecutive non-empty lines until blank line or other block type
    const pLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].match(/^(#{1,3})\s+/) &&
      !lines[i].startsWith('> ') &&
      !lines[i].match(/^(\s*)([-*•])\s+/) &&
      !lines[i].match(/^(\s*)\d+\.\s+/)
    ) {
      pLines.push(lines[i])
      i++
    }

    blocks.push(
      <div key={key++} style={{ margin: '6px 0', lineHeight: 1.6 }}>
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
    <div className={className} style={{ wordBreak: 'break-word', ...style }}>
      {parseBlocks(content)}
    </div>
  )
}

