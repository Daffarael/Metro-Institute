"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const INDICATOR = {
  type: "spring",
  stiffness: 620,
  damping: 42,
  mass: 0.35,
} as const;

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const PANEL = {
  type: "spring",
  stiffness: 460,
  damping: 38,
  mass: 0.8,
} as const;

export type TabItem = {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
};

export type TabsActivation = "automatic" | "manual";
export type UseTabsOptions = {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activation?: TabsActivation;
};

export function useTabs({
  items,
  value: controlled,
  defaultValue,
  onValueChange,
  activation = "automatic",
}: UseTabsOptions) {
  const base = useId();
  const nodes = useRef(new Map<string, HTMLButtonElement>());
  const direction = useRef(1);

  const [internal, setInternal] = useState(
    () =>
      defaultValue ??
      items.find((i) => !i.disabled)?.value ??
      items[0]?.value ??
      ""
  );

  const value = controlled ?? internal;

  const emit = useRef(onValueChange);
  emit.current = onValueChange;

  const select = useCallback(
    (next: string) => {
      if (next === value) return;
      const from = items.findIndex((i) => i.value === value);
      const to = items.findIndex((i) => i.value === next);
      direction.current = to < from ? -1 : 1;
      if (controlled === undefined) setInternal(next);
      emit.current?.(next);
    },
    [controlled, items, value]
  );

  const focusAt = useCallback(
    (i: number) => {
      const item = items[i];
      if (!item) return;
      nodes.current.get(item.value)?.focus();
    },
    [items]
  );

  const nextEnabled = useCallback(
    (from: number, dir: number) => {
      const n = items.length;
      let i = from < 0 ? 0 : from;
      for (let k = 0; k < n; k += 1) {
        i = (i + dir + n) % n;
        if (!items[i].disabled) return i;
      }
      return from;
    },
    [items]
  );

  const endStop = useCallback(
    (dir: number) => {
      const n = items.length;
      if (dir > 0) {
        for (let i = 0; i < n; i += 1) if (!items[i].disabled) return i;
      } else {
        for (let i = n - 1; i >= 0; i -= 1) if (!items[i].disabled) return i;
      }
      return 0;
    },
    [items]
  );

  const getTabProps = useCallback(
    (item: TabItem, index: number) => ({
      id: `${base}-tab-${item.value}`,
      role: "tab" as const,
      type: "button" as const,
      "aria-selected": item.value === value,
      "aria-controls": `${base}-panel-${item.value}`,
      "aria-disabled": item.disabled ? (true as const) : undefined,
      tabIndex: item.value === value ? 0 : -1,
      ref: (node: HTMLButtonElement | null) => {
        if (node) nodes.current.set(item.value, node);
        else nodes.current.delete(item.value);
      },
      onClick: () => {
        if (!item.disabled) select(item.value);
      },
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const to = nextEnabled(index, e.key === "ArrowRight" ? 1 : -1);
          focusAt(to);
          if (activation === "automatic") select(items[to].value);
          return;
        }
        if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          const to = endStop(e.key === "Home" ? 1 : -1);
          focusAt(to);
          if (activation === "automatic") select(items[to].value);
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!item.disabled) select(item.value);
        }
      },
    }),
    [activation, base, endStop, focusAt, items, nextEnabled, select, value]
  );

  const getPanelProps = useCallback(
    (panelValue: string) => ({
      id: `${base}-panel-${panelValue}`,
      role: "tabpanel" as const,
      "aria-labelledby": `${base}-tab-${panelValue}`,
      tabIndex: 0,
    }),
    [base]
  );

  const tabListProps = {
    role: "tablist" as const,
    "aria-orientation": "horizontal" as const,
  };

  return {
    value,
    select,
    direction: direction.current,
    tabListProps,
    getTabProps,
    getPanelProps,
  };
}

export type UseTabsReturn = ReturnType<typeof useTabs>;

export type SlidingTabsProps = {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activation?: TabsActivation;
  renderPanel?: (value: string) => ReactNode;
  label?: string;
};

export function SlidingTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  activation = "automatic",
  renderPanel,
  label = "Tabs",
}: SlidingTabsProps) {
  const tabs = useTabs({ items, value, defaultValue, onValueChange, activation });
  const reduced = useReducedMotion();

  const rowRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [plateau, setPlateau] = useState({ x: 0, width: 0, ready: false });

  const selectedIndex = items.findIndex((item) => item.value === tabs.value);

  useIsoLayoutEffect(() => {
    const node = tabRefs.current[selectedIndex];
    if (!node) return;
    const read = () => {
      setPlateau((prev) =>
        prev.x === node.offsetLeft &&
        prev.width === node.offsetWidth &&
        prev.ready
          ? prev
          : { x: node.offsetLeft, width: node.offsetWidth, ready: true }
      );
    };
    read();
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(read);
    observer.observe(row);
    return () => observer.disconnect();
  }, [selectedIndex, items]);

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {/* Tab list */}
      <div
        {...tabs.tabListProps}
        ref={rowRef}
        aria-label={label}
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          gap: 4,
          borderBottom: '1px solid var(--color-border-subtle)',
          background: 'var(--color-bg)',
          padding: '4px 4px 0',
        }}
      >
        {/* Sliding indicator — the white "card" */}
        <motion.span
          layout
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -1,
            top: 4,
            left: plateau.x,
            width: plateau.width,
            opacity: plateau.ready ? 1 : 0,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            background: 'var(--color-surface)',
            zIndex: 1,
          }}
          transition={reduced ? { duration: 0 } : INDICATOR}
        >
          {/* Border on the floating card */}
          <motion.span
            layout
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              border: '1px solid var(--color-border)',
              borderBottom: 'none',
            }}
            transition={reduced ? { duration: 0 } : INDICATOR}
          />
        </motion.span>

        {items.map((item, index) => {
          const selected = item.value === tabs.value;
          return (
            <button
              key={item.value}
              suppressHydrationWarning
              {...tabs.getTabProps(item, index)}
              ref={(node) => { tabRefs.current[index] = node; }}
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                padding: '0 14px',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: selected ? 600 : 400,
                color: selected
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-tertiary)',
                cursor: item.disabled ? 'default' : 'pointer',
                transition: 'color 0.15s',
                outline: 'none',
                whiteSpace: 'nowrap',
                opacity: item.disabled ? 0.4 : 1,
              }}
            >
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span style={{
                  fontSize: '11px',
                  color: selected ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
                  fontWeight: 400,
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      {renderPanel && (
        <motion.div
          key={tabs.value}
          custom={tabs.direction}
          {...tabs.getPanelProps(tabs.value)}
          initial={reduced ? false : { opacity: 0, x: tabs.direction * 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reduced ? { duration: 0 } : PANEL}
          style={{ outline: 'none' }}
        >
          {renderPanel(tabs.value)}
        </motion.div>
      )}
    </div>
  );
}

export default SlidingTabs;
