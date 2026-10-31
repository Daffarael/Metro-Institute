'use client'

/**
 * @author: @dorianbaffier (adapted for Metro Institute)
 * @description: Tear Button - destructive confirmation component
 * @license: MIT (kokonutUI)
 */

import React, {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const HEIGHT = 68
const BODY_WIDTH = 236
const STUB_WIDTH = 76
// How far (deg) the stub swings, about the foot of the perforation, before the last fibre gives.
const TEAR_ANGLE = 34
// The perforation tears hole by hole: each one holds for a moment, then gives.
const HOLES = 7
const HOLD = 0.55
const HOLD_SHARE = 0.3
// Spring settings
const SWING_STIFFNESS = 900
const SWING_DAMPING = 42
const RETURN_STIFFNESS = 520
const RETURN_DAMPING = 22
// Flight physics
const GRAVITY = 2600
const FALL_DISTANCE = 220
const STEP = 1 / 120
// Ragged edge offsets
const FIBRES = [
  1.6, 0.4, 2.2, 0.9, 1.8, 0.2, 2.4, 1.1, 0.5, 2, 1.4, 0.3, 2.3, 0.8, 1.7, 0.1,
  2.1, 1.2, 0.6, 1.9,
]
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

type Phase = 'idle' | 'tearing' | 'flying' | 'torn'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function haptic(ms: number) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(ms)
    } catch {
      // ignore
    }
  }
}

function stickSlip(pull: number) {
  const scaled = clamp(pull, 0, 1) * HOLES
  const hole = Math.min(Math.floor(scaled), HOLES - 1)
  const f = scaled - hole
  const given =
    f < HOLD
      ? (f / HOLD) * HOLD_SHARE
      : HOLD_SHARE + ((f - HOLD) / (1 - HOLD)) * (1 - HOLD_SHARE)
  return (hole + given) / HOLES
}

function tornEdge(tip: number, width: number, side: 1 | -1) {
  const points: string[] = []
  const edge = side === 1 ? width : 0
  const far = side === 1 ? 0 : width
  points.push(`${far}px 0px`)
  const rows = Math.ceil((tip / HEIGHT) * FIBRES.length)
  for (let k = 0; k <= rows; k++) {
    const y = Math.min((k / FIBRES.length) * HEIGHT, tip)
    const x = edge - side * FIBRES[k % FIBRES.length]
    points.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`)
  }
  points.push(`${edge}px ${tip.toFixed(1)}px`, `${edge}px ${HEIGHT}px`)
  points.push(`${far}px ${HEIGHT}px`)
  return `polygon(${points.join(',')})`
}

// Ticket notches
const NOTCH = 7
const bodyMask = `radial-gradient(circle at 100% 0, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) top / 100% 51% no-repeat, radial-gradient(circle at 100% 100%, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) bottom / 100% 51% no-repeat`
const stubMask = `radial-gradient(circle at 0 0, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) top / 100% 51% no-repeat, radial-gradient(circle at 0 100%, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) bottom / 100% 51% no-repeat`

export const TEAR_TONES = {
  danger: {
    paper: 'bg-red-600 text-white shadow-lg shadow-red-600/30',
    chip: 'bg-white/20 text-white',
    chipDone: 'bg-white text-red-600',
    sub: 'text-white/80',
    stub: 'text-white/90',
    perforation: 'border-white/40',
  },
  default: {
    paper: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
    chip: 'bg-white/10 dark:bg-zinc-900/10',
    chipDone: 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white',
    sub: 'text-white/55 dark:text-zinc-900/55',
    stub: 'text-white/60 dark:text-zinc-900/60',
    perforation: 'border-white/30 dark:border-zinc-900/30',
  },
  muted: {
    paper: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
    chip: 'bg-zinc-900/5 dark:bg-white/10',
    chipDone: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900',
    sub: 'text-zinc-500 dark:text-zinc-400',
    stub: 'text-zinc-500 dark:text-zinc-400',
    perforation: 'border-zinc-900/20 dark:border-white/25',
  },
} as const

export interface TearButtonProps {
  tone?: keyof typeof TEAR_TONES
  icon?: ReactNode
  label?: string
  description?: string
  stubLabel?: string
  confirmedLabel?: string
  confirmedDescription?: string
  onConfirm?: () => void
  resetAfter?: number
  className?: string
  disabled?: boolean
}

export default function TearButton({
  tone = 'danger',
  icon,
  label = 'Hapus',
  description = 'Sobek tiket untuk menghapus',
  stubLabel = 'Tear',
  confirmedLabel = 'Dihapus',
  confirmedDescription = 'Sedang memproses...',
  onConfirm,
  resetAfter = 0,
  className,
  disabled = false,
}: TearButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [generation, setGeneration] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const stubRef = useRef<HTMLButtonElement>(null)

  const sim = useRef({
    angle: 0,
    speed: 0,
    target: 0,
    held: false,
    grabAngle: 0,
    hole: 0,
    raf: 0,
    last: 0,
    carry: 0,
    // Free flight, once torn.
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    spin: 0,
    // The hand's recent movement, for the throw.
    px: 0,
    py: 0,
    pt: 0,
    pvx: 0,
    pvy: 0,
    auto: 0,
    flying: false,
    reduceMotion: false,
    startPx: 0,
    startPy: 0,
    startTime: 0,
  })

  const latest = useRef({ onConfirm })
  latest.current = { onConfirm }

  const hinge = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect()
    return rect
      ? { x: rect.left + BODY_WIDTH, y: rect.top + HEIGHT }
      : { x: 0, y: 0 }
  }, [])

  const drawTear = useCallback(() => {
    const s = sim.current
    const tip = clamp(s.angle / TEAR_ANGLE, 0, 1) * HEIGHT
    const stub = stubRef.current
    const body = bodyRef.current
    if (body) {
      body.style.clipPath = tip > 0.5 ? tornEdge(tip, BODY_WIDTH, 1) : ''
    }
    if (stub) {
      stub.style.clipPath = tip > 0.5 ? tornEdge(tip, STUB_WIDTH, -1) : ''
      stub.style.transform = `rotate(${s.angle.toFixed(2)}deg)`
    }
  }, [])

  const drawFlight = useCallback(() => {
    const s = sim.current
    const stub = stubRef.current
    if (!stub) return
    const fade = clamp(
      1 - (s.y - FALL_DISTANCE * 0.5) / (FALL_DISTANCE * 0.5),
      0,
      1
    )
    stub.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) rotate(${s.angle.toFixed(1)}deg)`
    stub.style.opacity = fade.toFixed(3)
  }, [])

  const detach = useCallback(() => {
    const s = sim.current
    s.held = false
    haptic(14)
    const rad = (s.angle * Math.PI) / 180
    const tangential = ((s.speed * Math.PI) / 180) * HEIGHT
    s.x = 0
    s.y = 0
    s.vx = Math.cos(rad) * tangential + clamp(s.pvx, -900, 900) * 0.6 + 90
    s.vy = Math.sin(rad) * tangential + clamp(s.pvy, -900, 900) * 0.6 - 120
    s.spin = s.speed * 0.6 + 140
    s.flying = true
    if (stubRef.current) {
      stubRef.current.style.transition = 'none'
    }
    setPhase('flying')
    latest.current.onConfirm?.()
  }, [])

  const stepSwing = useCallback(() => {
    const s = sim.current
    const stiffness = s.held || s.auto ? SWING_STIFFNESS : RETURN_STIFFNESS
    const damping = s.held || s.auto ? SWING_DAMPING : RETURN_DAMPING
    const force = (s.target - s.angle) * stiffness - s.speed * damping
    s.speed += force * STEP
    s.angle += s.speed * STEP
    const hole = Math.floor(clamp(s.angle / TEAR_ANGLE, 0, 1) * HOLES)
    if (hole > s.hole) {
      haptic(3)
    }
    s.hole = hole
    return s.angle >= TEAR_ANGLE * 0.995
  }, [])

  const stepFlight = useCallback(() => {
    const s = sim.current
    s.vy += GRAVITY * STEP
    s.x += s.vx * STEP
    s.y += s.vy * STEP
    s.angle += s.spin * STEP
    return s.y > FALL_DISTANCE
  }, [])

  const advance = useCallback(
    (elapsed: number) => {
      const s = sim.current
      s.carry += elapsed
      let finished = false
      while (s.carry >= STEP && !finished) {
        s.carry -= STEP
        if (s.flying) {
          finished = stepFlight()
        } else if (s.auto) {
          s.target = Math.min(s.target + STEP * 60, TEAR_ANGLE * 1.05)
          finished = stepSwing()
        } else {
          finished = stepSwing() && s.held
        }
      }
      return finished
    },
    [stepFlight, stepSwing]
  )

  const tick = useCallback(
    (now: number) => {
      const s = sim.current
      s.raf = 0
      const elapsed = s.last ? Math.min((now - s.last) / 1000, 0.05) : STEP
      s.last = now
      const { flying } = s
      const finished = advance(elapsed)
      if (flying) {
        drawFlight()
        if (finished) {
          s.last = 0
          setPhase('torn')
          return
        }
        s.raf = requestAnimationFrame(tick)
        return
      }
      drawTear()
      if (finished) {
        s.auto = 0
        detach()
        s.raf = requestAnimationFrame(tick)
        return
      }
      const resting =
        !(s.held || s.auto) &&
        Math.abs(s.angle) < 0.02 &&
        Math.abs(s.speed) < 0.05
      if (!resting) {
        s.raf = requestAnimationFrame(tick)
        return
      }
      s.angle = 0
      s.speed = 0
      s.last = 0
      drawTear()
      setPhase('idle')
    },
    [advance, detach, drawFlight, drawTear]
  )

  const wake = useCallback(() => {
    const s = sim.current
    if (!s.raf) {
      s.raf = requestAnimationFrame(tick)
    }
  }, [tick])

  useEffect(() => {
    const s = sim.current
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    s.reduceMotion = query.matches
    const onChange = () => {
      s.reduceMotion = query.matches
    }
    query.addEventListener('change', onChange)
    return () => {
      query.removeEventListener('change', onChange)
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  useEffect(() => {
    if (phase !== 'torn' || !resetAfter) return
    const id = window.setTimeout(() => {
      const s = sim.current
      s.angle = 0
      s.speed = 0
      s.target = 0
      s.hole = 0
      s.flying = false
      setGeneration((g) => g + 1)
      setPhase('idle')
    }, resetAfter)
    return () => window.clearTimeout(id)
  }, [phase, resetAfter])

  useEffect(() => {
    if (phase !== 'flying' || !sim.current.reduceMotion) return
    const s = sim.current
    cancelAnimationFrame(s.raf)
    s.raf = 0
    s.last = 0
    const stub = stubRef.current
    if (stub) {
      stub.style.transition = `opacity 180ms ${EASE_OUT}`
      stub.style.opacity = '0'
    }
    const id = window.setTimeout(() => setPhase('torn'), 180)
    return () => window.clearTimeout(id)
  }, [phase])

  const triggerAutoTear = () => {
    if (disabled || phase !== 'idle') return
    const s = sim.current
    s.auto = 1
    s.target = 0
    setPhase('tearing')
    wake()
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) return
    const s = sim.current
    if (phase === 'flying' || phase === 'torn') return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {}
    const h = hinge()
    s.grabAngle =
      (Math.atan2(event.clientY - h.y, event.clientX - h.x) * 180) / Math.PI -
      s.angle
    s.held = true
    s.px = event.clientX
    s.py = event.clientY
    s.pt = event.timeStamp
    s.startPx = event.clientX
    s.startPy = event.clientY
    s.startTime = event.timeStamp
    s.pvx = 0
    s.pvy = 0
    setPhase('tearing')
    wake()
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current
    if (!s.held) return
    const dt = event.timeStamp - s.pt
    if (dt > 0) {
      s.pvx = s.pvx * 0.5 + ((event.clientX - s.px) / dt) * 500
      s.pvy = s.pvy * 0.5 + ((event.clientY - s.py) / dt) * 500
    }
    s.px = event.clientX
    s.py = event.clientY
    s.pt = event.timeStamp
    const h = hinge()
    const raw =
      (Math.atan2(event.clientY - h.y, event.clientX - h.x) * 180) / Math.PI -
      s.grabAngle
    const pull = raw < 0 ? raw * 0.15 : raw
    s.target =
      pull >= TEAR_ANGLE
        ? TEAR_ANGLE * 1.05
        : stickSlip(Math.max(pull, 0) / TEAR_ANGLE) * TEAR_ANGLE +
          Math.min(pull, 0)
    wake()
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current
    if (!s.held) return
    s.held = false

    // If it was a quick tap or click with almost no drag, auto-tear for convenience
    const dist = Math.hypot(event.clientX - s.startPx, event.clientY - s.startPy)
    const duration = event.timeStamp - s.startTime
    if (dist < 8 && duration < 350) {
      s.auto = 1
      wake()
      return
    }

    s.target = 0
    wake()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    triggerAutoTear()
  }

  const done = phase === 'flying' || phase === 'torn'
  const colors = TEAR_TONES[tone]

  return (
    <div
      className={cn(
        'relative select-none',
        disabled && 'opacity-60 pointer-events-none cursor-not-allowed',
        className
      )}
      ref={rootRef}
      style={{ width: BODY_WIDTH + STUB_WIDTH, height: HEIGHT }}
    >
      {/* Ticket Body */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 flex items-center gap-3 rounded-l-2xl px-4 transition-colors duration-200',
          colors.paper
        )}
        ref={bodyRef}
        style={{ width: BODY_WIDTH, mask: bodyMask, WebkitMask: bodyMask }}
      >
        {/* Left Chip / Icon */}
        <span
          aria-hidden="true"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ease-out',
            done ? colors.chipDone : colors.chip
          )}
        >
          {done ? (
            <Check className="size-4 stroke-[2.5]" />
          ) : (
            icon || <Trash2 className="size-4 stroke-[2]" />
          )}
        </span>

        {/* Text Area */}
        <span className="relative grid min-w-0 flex-1">
          {[
            { key: 'ask', on: !done, title: label, sub: description },
            {
              key: 'done',
              on: done,
              title: confirmedLabel,
              sub: confirmedDescription,
            },
          ].map((line) => (
            <span
              aria-hidden={!line.on}
              className={cn(
                'col-start-1 row-start-1 min-w-0 transition-[opacity,filter,translate] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity',
                line.on
                  ? 'translate-y-0 opacity-100 blur-0'
                  : 'pointer-events-none translate-y-1 opacity-0 blur-[3px]'
              )}
              key={line.key}
            >
              <span className="block truncate font-bold text-sm tracking-tight">
                {line.title}
              </span>
              <span className={cn('block truncate text-xs font-normal', colors.sub)}>
                {line.sub}
              </span>
            </span>
          ))}
        </span>
      </div>

      {/* Perforated Stub */}
      {phase === 'torn' ? null : (
        <button
          aria-label={`${label}: ${description}`}
          className={cn(
            'absolute inset-y-0 flex touch-none flex-col items-center justify-center gap-1 rounded-r-2xl outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',
            colors.paper,
            colors.stub,
            'transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
            phase === 'tearing' ? 'cursor-grabbing' : 'cursor-grab'
          )}
          key={generation}
          onDoubleClick={triggerAutoTear}
          onKeyDown={handleKeyDown}
          onLostPointerCapture={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={stubRef}
          style={{
            left: BODY_WIDTH,
            width: STUB_WIDTH,
            mask: stubMask,
            WebkitMask: stubMask,
            transformOrigin: '0 100%',
          }}
          type="button"
        >
          {/* Perforation Line */}
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-y-2.5 left-0 border-l-2 border-dotted',
              colors.perforation
            )}
          />
          {/* Tear Arrow */}
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.2}
            viewBox="0 0 24 24"
          >
            <path d="M6 6c6 0 12 3 12 11M14 14l4 4 4-4" />
          </svg>
          <span className="font-bold text-xs tracking-wider uppercase">{stubLabel}</span>
        </button>
      )}

      <span aria-live="polite" className="sr-only">
        {done ? confirmedLabel : ''}
      </span>
    </div>
  )
}
