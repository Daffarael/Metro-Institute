'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const INDICATOR = {
  type: 'spring',
  stiffness: 620,
  damping: 42,
  mass: 0.35,
} as const

const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

const PANEL = {
  type: 'spring',
  stiffness: 460,
  damping: 38,
  mass: 0.8,
} as const

export type TabItem = {
  value: string
  label: string
  disabled?: boolean
}

export type TabsActivation = 'automatic' | 'manual'

export type UseTabsOptions = {
  items: TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  activation?: TabsActivation
}

export function useTabs({
  items,
  value: controlled,
  defaultValue,
  onValueChange,
  activation = 'automatic',
}: UseTabsOptions) {
  const base = useId()
  const nodes = useRef(new Map<string, HTMLButtonElement>())
  const direction = useRef(1)

  const [internal, setInternal] = useState(
    () =>
      defaultValue ??
      items.find((i) => !i.disabled)?.value ??
      items[0]?.value ??
      ''
  )

  const value = controlled ?? internal

  const emit = useRef(onValueChange)
  emit.current = onValueChange

  const select = useCallback(
    (next: string) => {
      if (next === value) return
      const from = items.findIndex((i) => i.value === value)
      const to = items.findIndex((i) => i.value === next)
      direction.current = to < from ? -1 : 1
      if (controlled === undefined) setInternal(next)
      emit.current?.(next)
    },
    [controlled, items, value]
  )

  const focusAt = useCallback(
    (i: number) => {
      const item = items[i]
      if (!item) return
      nodes.current.get(item.value)?.focus()
    },
    [items]
  )

  const nextEnabled = useCallback(
    (from: number, dir: number) => {
      const n = items.length
      let i = from < 0 ? 0 : from
      for (let k = 0; k < n; k += 1) {
        i = (i + dir + n) % n
        if (!items[i].disabled) return i
      }
      return from
    },
    [items]
  )

  const endStop = useCallback(
    (dir: number) => {
      const n = items.length
      if (dir > 0) {
        for (let i = 0; i < n; i += 1) if (!items[i].disabled) return i
      } else {
        for (let i = n - 1; i >= 0; i -= 1) if (!items[i].disabled) return i
      }
      return 0
    },
    [items]
  )

  const getTabProps = useCallback(
    (item: TabItem, index: number) => ({
      id: `${base}-tab-${item.value}`,
      role: 'tab' as const,
      type: 'button' as const,
      'aria-selected': item.value === value,
      'aria-controls': `${base}-panel-${item.value}`,
      'aria-disabled': item.disabled ? (true as const) : undefined,
      tabIndex: item.value === value ? 0 : -1,
      ref: (node: HTMLButtonElement | null) => {
        if (node) nodes.current.set(item.value, node)
        else nodes.current.delete(item.value)
      },
      onClick: () => {
        if (!item.disabled) select(item.value)
      },
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          const to = nextEnabled(index, e.key === 'ArrowRight' ? 1 : -1)
          focusAt(to)
          if (activation === 'automatic') select(items[to].value)
          return
        }
        if (e.key === 'Home' || e.key === 'End') {
          e.preventDefault()
          const to = endStop(e.key === 'Home' ? 1 : -1)
          focusAt(to)
          if (activation === 'automatic') select(items[to].value)
          return
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!item.disabled) select(item.value)
        }
      },
    }),
    [activation, base, endStop, focusAt, items, nextEnabled, select, value]
  )

  const getPanelProps = useCallback(
    (panelValue: string) => ({
      id: `${base}-panel-${panelValue}`,
      role: 'tabpanel' as const,
      'aria-labelledby': `${base}-tab-${panelValue}`,
      tabIndex: 0,
    }),
    [base]
  )

  const tabListProps = {
    role: 'tablist' as const,
    'aria-orientation': 'horizontal' as const,
  }

  return {
    value,
    select,
    direction: direction.current,
    tabListProps,
    getTabProps,
    getPanelProps,
  }
}

export type UseTabsReturn = ReturnType<typeof useTabs>

// ── Simple underline-style AnimatedTabs (for Bootcamp/Mini Course) ──────────
export interface AnimatedTabsProps {
  items: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}

export function AnimatedTabs({ items, activeId, onChange }: AnimatedTabsProps) {
  const tabItems: TabItem[] = items.map((i) => ({ value: i.id, label: i.label }))
  const reduced = useReducedMotion()
  const rowRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [plateau, setPlateau] = useState({ x: 0, width: 0, ready: false })

  const selectedIndex = tabItems.findIndex((item) => item.value === activeId)

  useIsoLayoutEffect(() => {
    const node = tabRefs.current[selectedIndex]
    if (!node) return
    const read = () => {
      setPlateau((prev) =>
        prev.x === node.offsetLeft && prev.width === node.offsetWidth && prev.ready
          ? prev
          : { x: node.offsetLeft, width: node.offsetWidth, ready: true }
      )
    }
    read()
    const row = rowRef.current
    if (!row) return
    const observer = new ResizeObserver(read)
    observer.observe(row)
    return () => observer.disconnect()
  }, [selectedIndex])

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-6)' }}>
      <div
        ref={rowRef}
        role="tablist"
        aria-orientation="horizontal"
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {tabItems.map((item, index) => {
          const selected = item.value === activeId
          return (
            <button
              key={item.value}
              ref={(node) => { tabRefs.current[index] = node }}
              role="tab"
              type="button"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.value)}
              style={{
                position: 'relative',
                padding: '8px 18px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                color: selected
                  ? 'var(--color-primary)'
                  : 'var(--color-text-secondary)',
                transition: 'color 0.15s ease',
              }}
            >
              {/* Invisible bold copy to prevent layout shift on weight change */}
              <span style={{ display: 'grid', placeItems: 'center' }}>
                <span style={{ visibility: 'hidden', fontWeight: 600, gridColumn: 1, gridRow: 1 }} aria-hidden>
                  {item.label}
                </span>
                <span style={{ gridColumn: 1, gridRow: 1, fontWeight: selected ? 600 : 400 }}>
                  {item.label}
                </span>
              </span>
            </button>
          )
        })}

        {/* Single sliding underline */}
        <motion.span
          aria-hidden
          animate={reduced ? false : { left: plateau.x, width: plateau.width }}
          initial={false}
          transition={INDICATOR}
          style={{
            position: 'absolute',
            bottom: -1,
            height: 2,
            background: 'var(--color-primary)',
            borderRadius: '2px 2px 0 0',
            pointerEvents: 'none',
            opacity: plateau.ready ? 1 : 0,
          }}
        />
      </div>
    </div>
  )
}

// ── Full Tabs with panel animation ───────────────────────────────────────────
export type TabsProps = {
  items: TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  activation?: TabsActivation
  renderPanel?: (value: string) => ReactNode
  label?: string
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  activation = 'automatic',
  renderPanel,
  label = 'Tabs',
}: TabsProps) {
  const tabs = useTabs({ items, value, defaultValue, onValueChange, activation })
  const reduced = useReducedMotion()
  const rowRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [plateau, setPlateau] = useState({ x: 0, width: 0, ready: false })
  const selectedIndex = items.findIndex((item) => item.value === tabs.value)

  useIsoLayoutEffect(() => {
    const node = tabRefs.current[selectedIndex]
    if (!node) return
    const read = () => {
      setPlateau((prev) =>
        prev.x === node.offsetLeft && prev.width === node.offsetWidth && prev.ready
          ? prev
          : { x: node.offsetLeft, width: node.offsetWidth, ready: true }
      )
    }
    read()
    const row = rowRef.current
    if (!row) return
    const observer = new ResizeObserver(read)
    observer.observe(row)
    return () => observer.disconnect()
  }, [selectedIndex, items])

  return (
    <div>
      <div
        {...tabs.tabListProps}
        ref={rowRef}
        aria-label={label}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {items.map((item, index) => {
          const selected = item.value === tabs.value
          return (
            <button
              key={item.value}
              {...tabs.getTabProps(item, index)}
              ref={(node) => { tabRefs.current[index] = node }}
              style={{
                position: 'relative',
                padding: '8px 18px',
                background: 'none',
                border: 'none',
                cursor: item.disabled ? 'default' : 'pointer',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                color: item.disabled
                  ? 'var(--color-text-tertiary)'
                  : selected
                    ? 'var(--color-primary)'
                    : 'var(--color-text-secondary)',
                transition: 'color 0.15s ease',
              }}
            >
              <span style={{ display: 'grid', placeItems: 'center' }}>
                <span style={{ visibility: 'hidden', fontWeight: 600, gridColumn: 1, gridRow: 1 }} aria-hidden>
                  {item.label}
                </span>
                <span style={{ gridColumn: 1, gridRow: 1, fontWeight: selected ? 600 : 400 }}>
                  {item.label}
                </span>
              </span>
            </button>
          )
        })}

        <motion.span
          layout
          aria-hidden
          animate={reduced ? false : { left: plateau.x, width: plateau.width }}
          initial={false}
          transition={INDICATOR}
          style={{
            position: 'absolute',
            bottom: -1,
            height: 2,
            background: 'var(--color-primary)',
            borderRadius: '2px 2px 0 0',
            pointerEvents: 'none',
            opacity: plateau.ready ? 1 : 0,
          }}
        />
      </div>

      {renderPanel && (
        <motion.div
          key={tabs.value}
          custom={tabs.direction}
          {...tabs.getPanelProps(tabs.value)}
          initial={reduced ? false : { opacity: 0, x: tabs.direction * 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reduced ? { duration: 0 } : PANEL}
          style={{ outline: 'none' }}
        >
          {renderPanel(tabs.value)}
        </motion.div>
      )}
    </div>
  )
}

export default Tabs

// ── CardTabs (browser-tab style, like reference image) ────────────────────────
export interface CardTabsProps {
  items: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
  children: ReactNode
}

export function CardTabs({ items, activeId, onChange, children }: CardTabsProps) {
  const reduced = useReducedMotion()
  const rowRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [plateau, setPlateau] = useState({ x: 0, width: 0, height: 0, ready: false })

  const selectedIndex = items.findIndex((i) => i.id === activeId)

  useIsoLayoutEffect(() => {
    const node = tabRefs.current[selectedIndex]
    if (!node) return
    const read = () => {
      setPlateau((prev) =>
        prev.x === node.offsetLeft && prev.width === node.offsetWidth && prev.ready
          ? prev
          : { x: node.offsetLeft, width: node.offsetWidth, height: node.offsetHeight, ready: true }
      )
    }
    read()
    const row = rowRef.current
    if (!row) return
    const observer = new ResizeObserver(read)
    observer.observe(row)
    return () => observer.disconnect()
  }, [selectedIndex])

  return (
    <div style={{
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 12,
      overflow: 'hidden',
      background: 'var(--color-surface)',
    }}>
      {/* Tab row */}
      <div
        ref={rowRef}
        role="tablist"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 2,
          padding: '6px 6px 0',
          background: 'color-mix(in srgb, var(--color-border) 18%, var(--color-bg))',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Sliding card indicator */}
        <motion.div
          aria-hidden
          animate={reduced ? false : {
            left: plateau.x + 6,  // account for padding
            width: plateau.width,
            opacity: plateau.ready ? 1 : 0,
          }}
          initial={false}
          transition={INDICATOR}
          style={{
            position: 'absolute',
            top: 6,
            height: plateau.height,
            background: 'var(--color-surface)',
            borderRadius: '8px 8px 0 0',
            border: '1px solid var(--color-border-subtle)',
            borderBottom: '1px solid var(--color-surface)',  // merge with content below
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {items.map((item, index) => {
          const selected = item.id === activeId
          return (
            <button
              key={item.id}
              ref={(node) => { tabRefs.current[index] = node }}
              role="tab"
              type="button"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                borderRadius: '8px 8px 0 0',
                color: selected ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                transition: 'color 0.15s ease',
              }}
            >
              <span style={{ display: 'grid', placeItems: 'center' }}>
                <span style={{ visibility: 'hidden', fontWeight: 600, gridColumn: 1, gridRow: 1 }} aria-hidden>
                  {item.label}
                </span>
                <span style={{ gridColumn: 1, gridRow: 1, fontWeight: selected ? 600 : 400 }}>
                  {item.label}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  )
}
