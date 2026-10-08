// @ts-nocheck
"use client";

import * as React from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { MenuToggle } from "@/components/ui/MenuToggle";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string
  href: string
  isHighlighted?: boolean
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { name: "Keunggulan", href: "#" },
  { name: "Program", href: "#" },
  { name: "Cara Kerja", href: "#" },
  { name: "Masuk", href: "/login", isHighlighted: true },
];

const EXPAND_SCROLL_THRESHOLD = 80;

const containerVariants = {
  expanded: {
    y: 0, opacity: 1, width: "auto",
    transition: {
      y: { type: "spring", damping: 18, stiffness: 250 },
      opacity: { duration: 0.3 },
      type: "spring", damping: 20, stiffness: 300,
      staggerChildren: 0.07, delayChildren: 0.2,
    },
  },
  collapsed: {
    y: 0, opacity: 1, width: "3rem",
    transition: {
      type: "spring", damping: 20, stiffness: 300,
      when: "afterChildren", staggerChildren: 0.05, staggerDirection: -1,
    },
  },
};

const logoVariants = {
  expanded: { opacity: 1, x: 0, rotate: 0, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -25, rotate: -180, transition: { duration: 0.3 } },
};

const itemVariants = {
  expanded: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } },
};

const collapsedIconVariants = {
  expanded: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  collapsed: {
    opacity: 1, scale: 1,
    transition: { type: "spring", damping: 15, stiffness: 300, delay: 0.15 },
  },
};

export function AnimatedNavFramer({ items = DEFAULT_NAV_ITEMS }: { items?: NavItem[] }) {
  const [isExpanded, setExpanded] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  // Start compact if window is small (mobile-first, SSR-safe)
  const [useCompactNav, setUseCompactNav] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });

  // Ghost ref: sibling element (no transform parent) → gives accurate natural width
  const ghostRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const check = () => {
      // Always compact on small screens regardless of ghost measurement
      if (window.innerWidth < 640) {
        setUseCompactNav(true);
        return;
      }
      if (ghostRef.current) {
        const navNaturalWidth = ghostRef.current.getBoundingClientRect().width;
        // Switch to compact when nav natural width + 32px margin exceeds viewport
        setUseCompactNav(navNaturalWidth + 32 > window.innerWidth);
      }
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [items]);

  const { scrollY } = useScroll();
  const lastScrollY = React.useRef(0);
  const scrollPositionOnCollapse = React.useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    if (isExpanded && latest > previous && latest > 150) {
      setExpanded(false);
      scrollPositionOnCollapse.current = latest;
    } else if (!isExpanded && latest < previous && (scrollPositionOnCollapse.current - latest > EXPAND_SCROLL_THRESHOLD)) {
      setExpanded(true);
    }
    lastScrollY.current = latest;
    if (mobileOpen) setMobileOpen(false);
  });

  const handleNavClick = (e: React.MouseEvent) => {
    if (!isExpanded) { e.preventDefault(); setExpanded(true); }
  };

  return (
    <>
      {/*
       * Ghost nav for accurate measurement.
       * Rendered as a sibling (no transform ancestor), position fixed at y=-9999
       * so it never appears on screen but gets accurate browser layout measurement.
       */}
      <div
        ref={ghostRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: -9999,
          left: 0,
          display: "flex",
          alignItems: "center",
          height: "3.5rem",
          whiteSpace: "nowrap",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", paddingLeft: "1.5rem", paddingRight: "1rem" }}>
          <img src="/logo-metro-clean.png" alt="" style={{ height: "2.5rem", width: "auto" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", paddingRight: "1.5rem" }}>
          {items.map((item) => (
            <span
              key={item.name}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "0.25rem 0.5rem",
                marginLeft: item.isHighlighted ? "1rem" : undefined,
              }}
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>

      {/* Actual nav */}
      <div className="fixed top-0 md:top-6 inset-x-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center w-full md:w-auto">
          <AnimatePresence mode="wait">
            {/* ── Desktop: full animated pill ──────────────────────── */}
          {!useCompactNav && (
            <motion.nav
              key="desktop-nav"
              initial={{ y: -80, opacity: 0 }}
              animate={isExpanded ? "expanded" : "collapsed"}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              variants={containerVariants}
              whileHover={!isExpanded ? { scale: 1.1 } : {}}
              whileTap={!isExpanded ? { scale: 0.95 } : {}}
              onClick={handleNavClick}
              className={cn(
                "flex items-center rounded-full border border-gray-200/50 bg-white/90 shadow-lg shadow-gray-200/50 backdrop-blur-md h-14",
                // overflow-hidden only when collapsed — when expanded, let nav take its natural width
                !isExpanded && "overflow-hidden cursor-pointer justify-center"
              )}
            >
              <motion.div variants={logoVariants} className="flex-shrink-0 flex items-center pl-6 pr-4">
                <img
                  src="/logo-metro-clean.png"
                  alt="Metro Institute"
                  className="h-10 w-auto"
                  style={{ filter: "brightness(0) saturate(100%) invert(14%) sepia(12%) saturate(2135%) hue-rotate(192deg) brightness(95%) contrast(90%)" }}
                />
              </motion.div>

              <motion.div
                className={cn("flex items-center gap-6 pr-6", !isExpanded && "pointer-events-none")}
              >
                {items.map((item) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    variants={itemVariants}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "text-[11px] font-bold tracking-[0.2em] uppercase transition-colors px-2 py-1 whitespace-nowrap",
                      item.isHighlighted
                        ? "text-[#22222E] hover:text-[#16161F] ml-4"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    {item.name}
                  </motion.a>
                ))}
              </motion.div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div variants={collapsedIconVariants} animate={isExpanded ? "expanded" : "collapsed"}>
                  <Menu className="h-5 w-5 text-gray-700" />
                </motion.div>
              </div>
            </motion.nav>
          )}

          {/* ── Compact: logo pill + animated dropdown ────────────── */}
          {useCompactNav && (
            <motion.div
              key="compact-nav"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.15 } }}
              className="flex flex-col items-center w-full"
            >
              <motion.div
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 18, stiffness: 250 }}
                className="flex items-center justify-between w-full h-16 px-6 bg-white/95 shadow-sm backdrop-blur-md border-b border-gray-200/50"
              >
                <img
                  src="/logo-metro-clean.png"
                  alt="Metro Institute"
                  className="h-7 w-auto object-contain"
                  style={{ filter: "brightness(0) saturate(100%) invert(14%) sepia(12%) saturate(2135%) hue-rotate(192deg) brightness(95%) contrast(90%)" }}
                />
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 -mr-2 flex items-center justify-center"
                >
                  <MenuToggle
                    open={mobileOpen}
                    onOpenChange={() => {}}
                    stroke="#374151"
                    strokeWidth={2.5}
                    className="w-6 h-6 pointer-events-none"
                  />
                </button>
              </motion.div>

              <AnimatePresence>
                {mobileOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200/50 overflow-hidden shadow-xl"
                  >
                    <div className="flex flex-col w-full py-2">
                      {items.map((item, i) => (
                        <motion.a
                          key={item.name}
                          href={item.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, type: "spring", damping: 15 }}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center px-6 py-4 text-[13px] font-bold tracking-[0.15em] uppercase transition-colors border-b border-gray-100 last:border-0",
                            item.isHighlighted
                              ? "text-[#22222E] bg-gray-50"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          {item.name}
                        </motion.a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
        </div>
      </div>
    </>
  );
}
