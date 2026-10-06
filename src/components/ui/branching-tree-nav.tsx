// @ts-nocheck
"use client";
import { useRouter } from "next/navigation";

import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ButtonHTMLAttributes,
  ComponentType,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface TreeItemData {
  id: string;
  label: string;
  icon?: LucideIcon | ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

interface TreeContextValue {
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

function useTreeContext() {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("Tree components must be rendered within a TreeView.");
  }

  return context;
}

interface TreeSvgLinesProps {
  offsets: number[];
  className?: string;
}

export function TreeSvgLines({ offsets, className }: TreeSvgLinesProps) {
  if (offsets.length === 0) {
    return null;
  }

  const lastOffset = offsets[offsets.length - 1];
  const totalHeight = lastOffset + 1;
  const lastV = lastOffset - 5;

  return (
    <svg
      aria-hidden="true"
      width="12"
      height={totalHeight}
      viewBox={`0 0 12 ${totalHeight}`}
      fill="none"
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: '12.5px',
        zIndex: 10,
        pointerEvents: 'none',
        userSelect: 'none',
        color: 'var(--color-border)'
      }}
    >
      <path
        d={`M0.5 0 V${lastV}`}
        stroke="currentColor"
        strokeWidth="1"
      />

      {offsets.map((y, index) => {
        const v = y - 5;
        return (
          <path
            key={index}
            d={`M0.5 ${v} Q0.5 ${y} 5.5 ${y} H11.5`}
            stroke="currentColor"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

export interface TreeListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function TreeList({ children, className, style, ...props }: TreeListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState<number[]>([]);
  const childrenCount = Children.count(children);

  const updateOffsets = useCallback(() => {
    if (!containerRef.current) return;
    const directChildren = Array.from(containerRef.current.children).filter((el) => el.tagName !== "svg") as HTMLElement[];
    const newOffsets = directChildren.map((child) => child.offsetTop + 16);
    setOffsets(newOffsets);
  }, []);

  useLayoutEffect(() => {
    updateOffsets();
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      updateOffsets();
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [childrenCount, updateOffsets]);

  return (
    <div
      ref={containerRef}
      role="group"
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        ...style
      }}
      {...props}
    >
      <TreeSvgLines offsets={offsets} />
      {children}
    </div>
  );
}

export interface TreeItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  label: string;
  icon?: LucideIcon | ComponentType<{ className?: string; size?: number }>;
  badge?: string;
  disabled?: boolean;
  href?: string;
  external?: boolean;
  isCollapsed?: boolean;
}

export const TreeItem = forwardRef<HTMLButtonElement, TreeItemProps>(
  ({ id, label, icon: Icon, badge, disabled, href, external, isCollapsed, className, onClick, style, ...props }, ref) => {
    const { selectedId, hoveredId, onSelect, onHover } = useTreeContext();
    const router = useRouter();

    const isSelected = selectedId === id;
    const isHovered = hoveredId === id;
    const isActiveBackground = hoveredId ? isHovered : isSelected;

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onSelect(id);
      onClick?.(event);
      if (href) {
        if (external) {
          window.open(href, '_blank');
        } else {
          router.push(href);
        }
      }
    };

    const handleMouseEnter = () => {
      if (!disabled) onHover(id);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!disabled) onSelect(id);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="treeitem"
        aria-selected={isSelected}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onKeyDown={handleKeyDown}
        className={className}
        style={{
          position: 'relative',
          display: 'flex',
          height: '32px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          borderRadius: 'var(--radius-md)',
          padding: '0 10px 0 32px',
          textAlign: 'left',
          fontSize: 'var(--text-sm)',
          outline: 'none',
          userSelect: 'none',
          opacity: disabled ? 0.4 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          fontWeight: isSelected ? 600 : 500,
          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          border: 'none',
          background: 'transparent',
          ...style
        }}
        {...props}
      >
        {isActiveBackground && (
          <motion.div
            layoutId="tree-pill"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              borderRadius: 'var(--radius-md)',
              background: isHovered ? 'var(--color-bg)' : 'var(--color-primary-xlight)',
              pointerEvents: 'none'
            }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', minWidth: 0, alignItems: 'center', gap: '8px' }}>
          {Icon && (
            <div style={{ flexShrink: 0, color: isSelected ? 'var(--color-primary)' : (isHovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'), transition: 'color 0.15s' }}>
              <Icon size={16} />
            </div>
          )}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isSelected ? 'var(--color-primary)' : (isHovered ? 'var(--color-text-primary)' : 'inherit'), transition: 'color 0.15s' }}>
            {label}
          </span>
        </div>

        {badge && (
          <span style={{
            position: 'relative', zIndex: 10, marginLeft: 'auto', flexShrink: 0,
            borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px',
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#3b82f6'
          }}>
            {badge}
          </span>
        )}
      </button>
    );
  }
);
TreeItem.displayName = "TreeItem";

export interface TreeFolderProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  label: string;
  icon?: LucideIcon | ComponentType<{ className?: string; size?: number }>;
  badge?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  disabled?: boolean;
}

export function TreeFolder({
  id,
  label,
  icon: CustomIcon,
  badge,
  defaultExpanded = false,
  children,
  disabled,
  className,
  style,
  ...props
}: TreeFolderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { hoveredId, onHover } = useTreeContext();
  const contentId = useId();

  const isHovered = hoveredId === id;
  const Icon = CustomIcon || (isExpanded ? FolderOpen : Folder);

  const handleToggle = () => {
    if (!disabled) setIsExpanded((prev) => !prev);
  };

  const handleMouseEnter = () => {
    if (!disabled) onHover(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    } else if (event.key === "ArrowRight" && !isExpanded) {
      event.preventDefault();
      setIsExpanded(true);
    } else if (event.key === "ArrowLeft" && isExpanded) {
      event.preventDefault();
      setIsExpanded(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', ...style }} className={className} {...props}>
      <button
        type="button"
        role="treeitem"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        disabled={disabled}
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          display: 'flex',
          height: '32px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          borderRadius: 'var(--radius-md)',
          padding: '0 10px 0 32px',
          textAlign: 'left',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          outline: 'none',
          userSelect: 'none',
          opacity: disabled ? 0.4 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          border: 'none',
          background: 'transparent'
        }}
      >
        {isHovered && (
          <motion.div
            layoutId="tree-hover-pill"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
              pointerEvents: 'none'
            }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', minWidth: 0, alignItems: 'center', gap: '8px' }}>
          <div style={{ flexShrink: 0, color: isHovered ? 'var(--color-text-primary)' : 'inherit', transition: 'color 0.15s' }}>
             <Icon size={16} />
          </div>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isHovered ? 'var(--color-text-primary)' : 'inherit', transition: 'color 0.15s' }}>
            {label}
          </span>
        </div>

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {badge && (
            <span style={{
              flexShrink: 0, borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px',
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#3b82f6'
            }}>
              {badge}
            </span>
          )}
          <div style={{
            flexShrink: 0, color: isHovered ? 'var(--color-text-primary)' : 'inherit',
            transition: 'transform 0.2s, color 0.15s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>
             <ChevronRight size={14} />
          </div>
        </div>
      </button>

      <div
        id={contentId}
        aria-hidden={!isExpanded}
        style={{
          display: 'grid',
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: 'grid-template-rows 0.3s ease-in-out, opacity 0.3s ease-in-out',
          paddingLeft: '16px'
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <TreeList>{children}</TreeList>
        </div>
      </div>
    </div>
  );
}

export interface TreeSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TreeSection({
  title,
  defaultExpanded = true,
  children,
  className,
  style
}: TreeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { onHover } = useTreeContext();
  const contentId = useId();

  const handleToggle = () => setIsExpanded((prev) => !prev);
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', ...style }} className={className}>
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        style={{
          display: 'flex', width: '100%', cursor: 'pointer', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 'var(--radius-md)', padding: '6px 8px', textAlign: 'left', outline: 'none',
          background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget.style.color = 'var(--color-text-primary)');
          onHover(`section-${title}`);
        }}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'color 0.15s' }}>
          {title}
        </span>
        <div style={{
          transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
        }}>
           <ChevronDown size={14} />
        </div>
      </button>

      <div
        id={contentId}
        aria-hidden={!isExpanded}
        style={{
          display: 'grid',
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: 'grid-template-rows 0.3s ease-in-out, opacity 0.3s ease-in-out'
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <TreeList>{children}</TreeList>
        </div>
      </div>
    </div>
  );
}

export interface TreeViewProps extends HTMLAttributes<HTMLElement> {
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  children: ReactNode;
}

export function TreeView({
  selectedId: controlledSelectedId,
  defaultSelectedId,
  onSelect: controlledOnSelect,
  children,
  className,
  style,
  ...props
}: TreeViewProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(defaultSelectedId || null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;

  const handleSelect = useCallback(
    (id: string) => {
      if (controlledSelectedId === undefined) setInternalSelectedId(id);
      controlledOnSelect?.(id);
    },
    [controlledSelectedId, controlledOnSelect]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  const contextValue = useMemo(
    () => ({ selectedId, hoveredId, onSelect: handleSelect, onHover: setHoveredId }),
    [selectedId, hoveredId, handleSelect]
  );

  return (
    <TreeContext.Provider value={contextValue}>
      <LayoutGroup id="branching-tree-nav">
        <nav
          role="tree"
          aria-orientation="vertical"
          onMouseLeave={handleMouseLeave}
          className={className}
          style={{
            display: 'flex', width: '100%', flexDirection: 'column', gap: '2px',
            padding: '0 4px', userSelect: 'none', ...style
          }}
          {...props}
        >
          {children}
        </nav>
      </LayoutGroup>
    </TreeContext.Provider>
  );
}
