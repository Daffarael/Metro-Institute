"use client";
// @ts-nocheck

import { isValidElement, useLayoutEffect, useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CursorPointer01Icon,
  Download04Icon,
  Layers01Icon,
  Notification03Icon,
  PaintBoardIcon,
  Rocket01Icon,
  Settings02Icon,
  TextFontIcon
} from '@hugeicons/core-free-icons';
import './branched-menu.css';

const DEFAULT_ITEMS = [
  {
    label: 'Getting started',
    children: [
      { value: 'install', label: 'Installation', icon: Download04Icon },
      { value: 'quick', label: 'Quick start', icon: Rocket01Icon },
      { value: 'config', label: 'Configuration', icon: Settings02Icon },
      { value: 'theming', label: 'Theming', icon: PaintBoardIcon }
    ]
  },
  {
    label: 'Components',
    children: [
      { value: 'buttons', label: 'Buttons', icon: CursorPointer01Icon },
      { value: 'typography', label: 'Typography', icon: TextFontIcon },
      { value: 'overlays', label: 'Overlays', icon: Layers01Icon },
      { value: 'toasts', label: 'Toasts', icon: Notification03Icon }
    ]
  }
];
const PAD = 6;
const MARK = 16;

const renderIcon = (Icon) => {
  if (isValidElement(Icon)) return Icon;
  if (typeof Icon === 'function' || (typeof Icon === 'object' && '$$typeof' in Icon)) {
    return <Icon size={16} strokeWidth={1.8} />;
  }
  return <HugeiconsIcon icon={Icon} size={16} strokeWidth={1.8} />;
};
const toSet = open => new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);

export default function BranchedMenu({
  items = DEFAULT_ITEMS,
  defaultOpen = 0,
  defaultActive = '',
  onSelect,
  onToggle,
  color = '#f5f5f5',
  accentColor = '#f5f5f5',
  lineColor = '#3f3f46',
  width = 240,
  rowHeight = 36,
  indent = 40,
  trunk = 14,
  radius = 10,
  lineWidth = 1.5,
  fontSize = 14,
  drawDuration = 400,
  foldDuration = 300,
  className = ''
}) {
  const [open, setOpen] = useState(() => toSet(defaultOpen));
  const [active, setActive] = useState(() => {
    if (defaultActive) return defaultActive;
    const first = items.find((it, i) => it.children && toSet(defaultOpen).has(i));
    return first?.children?.[0]?.value ?? '';
  });
  
  useEffect(() => {
    if (defaultActive) {
      setActive(defaultActive);
    }
  }, [defaultActive]);

  const [hoveredValue, setHoveredValue] = useState(null);
  const navRef = useRef(null);
  const heads = useRef([]);
  const markerRef = useRef(null);
  const latest = useRef({});
  latest.current = { onSelect, onToggle };

  const activeSection = items.findIndex(it => it.children?.some(kid => kid.value === active) || (it.value && it.value === active));
  const markerShown = activeSection >= 0 && (items[activeSection]?.children ? open.has(activeSection) : true);
  useLayoutEffect(() => {
    const place = glide => {
      const m = markerRef.current;
      const el = heads.current[activeSection];
      if (!m) return;
      const on = markerShown && el;
      if (!glide) m.style.transition = 'none';
      if (on) m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`;
      m.toggleAttribute('data-on', Boolean(on));
      if (!glide) {
        void m.offsetHeight;
        m.style.transition = '';
      }
    };
    place(true);
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      place(false);
    });
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [activeSection, markerShown, items, fontSize, rowHeight]);

  const select = (value, item) => {
    setActive(value);
    latest.current.onSelect?.(value, item);
  };
  const toggle = i => {
    setOpen(prev => {
      const next = new Set(prev);
      const isOpen = !next.has(i);
      if (isOpen) next.add(i);
      else next.delete(i);
      latest.current.onToggle?.(i, isOpen);
      return next;
    });
  };

  const r = Math.min(radius, rowHeight / 2 - 2);
  const endX = indent - 8;
  const rowY = k => PAD + k * rowHeight + rowHeight / 2;
  const branch = k => `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const reach = k => `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const length = k => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r);

  return (
    <nav
      ref={navRef}
      className={`branched-menu${className ? ` ${className}` : ''}`}
      style={{
        '--bm-w': `${width}px`,
        '--bm-ink': color,
        '--bm-accent': accentColor,
        '--bm-line': lineColor,
        '--bm-font': `${fontSize}px`,
        '--bm-row': `${rowHeight}px`,
        '--bm-indent': `${indent}px`,
        '--bm-line-w': lineWidth,
        '--bm-draw': `${drawDuration}ms`,
        '--bm-fold': `${foldDuration}ms`
      }}
    >
      <span ref={markerRef} className="branched-menu__marker" aria-hidden="true" />
      {items.map((item, i) => {
        const kids = item.children;
        const isOpen = kids ? open.has(i) : false;
        const leafValue = item.value ?? item.label;
        const leafActive = !kids && leafValue === active;
        const isSectionActive = kids ? kids.some(k => k.value === active) : leafActive;
        const bodyH = kids ? PAD * 2 + kids.length * rowHeight : 0;

        if (!kids) {
          const isHovered = hoveredValue === item.value;
          return (
            <div key={item.value ?? item.label} className="branched-menu__section" style={{ marginBottom: 8 }}>
              <button
                suppressHydrationWarning
                ref={el => {
                  heads.current[i] = el;
                }}
                type="button"
                className="branched-menu__item"
                style={{ position: 'relative', paddingLeft: 0, height: rowHeight }}
                aria-current={leafActive ? 'true' : undefined}
                data-active={leafActive ? '' : undefined}
                onClick={() => select(leafValue, item)}
                onMouseEnter={() => setHoveredValue(item.value)}
                onMouseLeave={() => setHoveredValue(null)}
              >
                {isHovered && !leafActive && (
                  <motion.div layoutId="branched-menu-hover-pill" style={{ position: 'absolute', inset: '2px 8px 2px -8px', background: 'rgba(128, 128, 128, 0.1)', borderRadius: 'var(--radius-md)', zIndex: 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.2 }} />
                )}
                {leafActive && (
                  <motion.div layoutId="branched-menu-active-pill" style={{ position: 'absolute', inset: '2px 8px 2px -8px', background: 'var(--color-primary-xlight)', borderRadius: 'var(--radius-md)', zIndex: 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                  {item.icon ? (
                    <span className="branched-menu__icon" aria-hidden="true">
                      {renderIcon(item.icon)}
                    </span>
                  ) : null}
                  <span className="branched-menu__label" style={{ fontWeight: 500 }}>{item.label}</span>
                </div>
              </button>
            </div>
          );
        }

        return (
          <div key={item.value ?? item.label} className="branched-menu__section" data-open={isOpen ? '' : undefined}>
            <button
              suppressHydrationWarning
              ref={el => {
                heads.current[i] = el;
              }}
              type="button"
              className="branched-menu__head"
              aria-expanded={isOpen}
              data-active={isSectionActive ? '' : undefined}
              onClick={() => toggle(i)}
            >
              {item.label}
            </button>
            {kids ? (
              <div className="branched-menu__body">
                <div className="branched-menu__fold">
                  <div className="branched-menu__tree" style={{ height: bodyH }}>
                    <svg className="branched-menu__lines" width={indent} height={bodyH} aria-hidden="true">
                      <path className="branched-menu__base" d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`} />
                      {kids.map((kid, k) => (
                        <path key={kid.value} className="branched-menu__base" d={branch(k)} />
                      ))}
                      {kids.map((kid, k) => (
                        <path
                          key={kid.value}
                          className="branched-menu__reach"
                          d={reach(k)}
                          style={{
                            strokeDasharray: length(k),
                            strokeDashoffset: kid.value === active ? 0 : length(k)
                          }}
                        />
                      ))}
                    </svg>
                    {kids.map(kid => {
                      const isActive = kid.value === active;
                      const isHovered = hoveredValue === kid.value;
                      return (
                      <button
                        suppressHydrationWarning
                        key={kid.value}
                        type="button"
                        className="branched-menu__item"
                        style={{ position: 'relative' }}
                        aria-current={isActive ? 'true' : undefined}
                        data-active={isActive ? '' : undefined}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => select(kid.value, kid)}
                        onMouseEnter={() => setHoveredValue(kid.value)}
                        onMouseLeave={() => setHoveredValue(null)}
                      >
                        {/* Hover Highlight (Abu-abu) */}
                        {isHovered && !isActive && (
                            <motion.div
                              layoutId="branched-menu-hover-pill"
                              style={{
                                position: 'absolute',
                                inset: '2px 8px 2px calc(var(--bm-indent) - 4px)',
                                background: 'rgba(128, 128, 128, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                zIndex: 0
                              }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                          />
                        )}

                        {/* Active Highlight (Hijau) */}
                        {isActive && (
                            <motion.div
                              layoutId="branched-menu-active-pill"
                              style={{
                                position: 'absolute',
                                inset: '2px 8px 2px calc(var(--bm-indent) - 4px)',
                                background: 'var(--color-primary-xlight)',
                                borderRadius: 'var(--radius-md)',
                                zIndex: 0
                              }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                          />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                          {kid.icon ? (
                            <span className="branched-menu__icon" aria-hidden="true">
                              {renderIcon(kid.icon)}
                            </span>
                          ) : null}
                          <span className="branched-menu__label">{kid.label}</span>
                        </div>
                      </button>
                    )})}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
