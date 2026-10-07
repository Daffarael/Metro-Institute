// @ts-nocheck
"use client";

import * as React from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string
  href: string
  isHighlighted?: boolean
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { name: "Program", href: "#programs" },
  { name: "Achievement", href: "#achievements" },
  { name: "Ebook", href: "#ebook" },
  { name: "About Us", href: "#footer" },
  { name: "Sign In", href: "/login", isHighlighted: true },
];

const EXPAND_SCROLL_THRESHOLD = 80;

export function AnimatedNavFramer({ items = DEFAULT_NAV_ITEMS }: { items?: NavItem[] }) {
  const [isExpanded, setExpanded] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
  });

  // Close mobile menu when scrolling
  React.useEffect(() => {
    const handleScroll = () => setMobileMenuOpen(false);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ── Desktop Nav ─────────────────────────────────────────── */}
      <div className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={isExpanded ? {
            y: 0, opacity: 1, width: "auto",
            transition: { type: "spring", damping: 18, stiffness: 250 }
          } : {
            y: 0, opacity: 1, width: "3rem",
            transition: { type: "spring", damping: 20, stiffness: 300 }
          }}
          whileHover={!isExpanded ? { scale: 1.1 } : {}}
          whileTap={!isExpanded ? { scale: 0.95 } : {}}
          onClick={() => { if (!isExpanded) setExpanded(true); }}
          className={cn(
            "flex items-center overflow-hidden rounded-full border border-gray-200/50 bg-white/90 shadow-lg shadow-gray-200/50 backdrop-blur-md h-14",
            !isExpanded && "cursor-pointer justify-center"
          )}
        >
          {/* Logo */}
          <motion.div
            animate={isExpanded ? { opacity: 1, x: 0 } : { opacity: 0, x: -25 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 flex items-center pl-6 pr-4"
          >
            <img
              src="/logo-metro-clean.png"
              alt="Metro Institute"
              className="h-8 md:h-10 w-auto"
              style={{ filter: "brightness(0) saturate(100%) invert(14%) sepia(12%) saturate(2135%) hue-rotate(192deg) brightness(95%) contrast(90%)" }}
            />
          </motion.div>

          {/* Nav Items */}
          <motion.div
            animate={isExpanded ? { opacity: 1 } : { opacity: 0 }}
            className={cn("flex items-center gap-2 lg:gap-6 pr-6", !isExpanded && "pointer-events-none")}
          >
            {items.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "text-[11px] font-bold tracking-[0.2em] uppercase transition-colors px-2 py-1 whitespace-nowrap",
                  item.isHighlighted
                    ? "text-[#22222E] hover:text-[#16161F] ml-2"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {item.name}
              </a>
            ))}
          </motion.div>

          {/* Collapsed icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={isExpanded ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </motion.div>
          </div>
        </motion.nav>
      </div>

      {/* ── Mobile Nav ──────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50">
        {/* Mobile Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img
              src="/logo-metro-clean.png"
              alt="Metro Institute"
              className="h-8 w-auto"
              style={{ filter: "brightness(0) saturate(100%) invert(14%) sepia(12%) saturate(2135%) hue-rotate(192deg) brightness(95%) contrast(90%)" }}
            />
          </a>

          {/* Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-700" />
            ) : (
              <Menu className="h-5 w-5 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full inset-x-0 bg-white/98 backdrop-blur-md border-b border-gray-100 shadow-lg"
            >
              <div className="flex flex-col py-2">
                {items.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "px-6 py-4 text-[13px] font-semibold tracking-wide border-b border-gray-50 transition-colors",
                      item.isHighlighted
                        ? "text-[#22222E] bg-gray-50 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {item.name}
                    {item.isHighlighted && (
                      <span className="ml-2 text-[10px] bg-[#22222E] text-white px-2 py-0.5 rounded-full">
                        Masuk
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
