import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, MotionValue } from "framer-motion";
import Link from "next/link";
import { PopButton } from "@/components/ui/PopButton";

type Scroll01Item = {
  title: string;
  description: string;
  media: string;
  summary?: string;
  author?: string;
  role?: string;
  tag?: string;
  avatar?: string;
};

export interface Scroll01Props {
  items: Scroll01Item[];
  title?: string;
  subtitle?: string;
}

// Calculate opacity value for a given scroll progress — pure JS, no WAAPI
function calcOpacity(v: number, index: number, total: number): number {
  if (total <= 1) return 1;
  const peak = index / (total - 1);
  const distance = 1 / (total - 1);
  const crossfadeHalf = distance * 0.25;
  const fadeInStart  = peak - distance + crossfadeHalf;
  const fadeInEnd    = peak - crossfadeHalf;
  const fadeOutStart = peak + crossfadeHalf;
  const fadeOutEnd   = peak + distance - crossfadeHalf;

  if (v <= fadeInStart)  return 0;
  if (v <= fadeInEnd)    return (v - fadeInStart) / (fadeInEnd - fadeInStart || 1);
  if (v <= fadeOutStart) return 1;
  if (v <= fadeOutEnd)   return 1 - (v - fadeOutStart) / (fadeOutEnd - fadeOutStart || 1);
  return 0;
}

const INDONESIAN_AVATARS = [
  "/avatars/avatar-4.jpg", // Ilham (Indonesian young man)
  "/avatars/avatar-2.jpg", // Siti (Indonesian young woman with hijab)
  "/avatars/avatar-1.jpg", // Andi (Indonesian young man with glasses)
];

function parsePortfolioItem(item: Scroll01Item, index: number = 0) {
  let author = item.author || "";
  let role = item.role || "";
  let summary = item.summary || "";
  let avatar = item.avatar || "";

  if (item.description) {
    const desc = item.description.trim();
    if (desc.toLowerCase().startsWith("oleh ")) {
      const match = desc.match(/oleh\s+([^(]+)(?:\(([^)]+)\))?(?:\s*-\s*(.*))?/i);
      if (match) {
        if (!author) author = match[1]?.trim() || "";
        if (!role) role = match[2]?.trim() || "";
        if (!summary && match[3]) summary = match[3].trim();
      }
    } else if (!summary) {
      if (desc.includes(" - ")) {
        const parts = desc.split(" - ");
        if (!author) author = parts[0].trim();
        summary = parts.slice(1).join(" - ").trim();
      } else {
        summary = desc;
      }
    }
  }

  // Capstone project involves multi-discipline (UI/UX, Backend, Frontend), so simplify role
  if (role) {
    const batchMatch = role.match(/batch\s*\d+/i);
    if (batchMatch) {
      const bStr = batchMatch[0];
      role = `Alumni ${bStr.charAt(0).toUpperCase() + bStr.slice(1)}`;
    } else {
      role = "Alumni Mentee";
    }
  }

  // Indonesian avatar resolution: check author or fallback cyclically
  if (!avatar) {
    const lower = (author || "").toLowerCase();
    if (lower.includes("siti") || lower.includes("anisa") || lower.includes("putri") || lower.includes("nur")) {
      avatar = "/avatars/avatar-2.jpg";
    } else if (lower.includes("andi") || lower.includes("budi") || lower.includes("reza") || lower.includes("bayu")) {
      avatar = "/avatars/avatar-1.jpg";
    } else if (lower.includes("ilham") || lower.includes("fajar") || lower.includes("dimas") || lower.includes("rizky")) {
      avatar = "/avatars/avatar-4.jpg";
    } else {
      avatar = INDONESIAN_AVATARS[index % INDONESIAN_AVATARS.length];
    }
  }

  // Prevent awkward hyphenation line breaks (like "E-" and "Commerce" on separate lines)
  // by replacing hyphens within words with Unicode Non-Breaking Hyphen (U+2011)
  const displayTitle = (item.title || "").replace(/(\w)-(\w)/g, '$1\u2011$2');

  return {
    title: displayTitle,
    author: author || "Mentee Metro Institute",
    role: role || "Alumni Batch 1",
    avatar,
    summary: summary || item.description || "Hasil karya capstone project industri selama program mentoring Metro Institute.",
  };
}

function ScrubbedItem({
  item,
  index,
  total,
  progress,
  isImage = false,
}: {
  item: Scroll01Item;
  index: number;
  total: number;
  progress: MotionValue<number>;
  isImage?: boolean;
}) {
  const [opacity, setOpacity] = useState(() => calcOpacity(0, index, total));

  useMotionValueEvent(progress, "change", (v) => {
    setOpacity(calcOpacity(v, index, total));
  });

  const parsed = parsePortfolioItem(item, index);

  if (isImage) {
    return (
      <img
        src={item.media}
        alt={item.title}
        style={{
          opacity,
          position: "absolute",
          inset: 0,
          height: "100%",
          width: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      />
    );
  }

  const isVisible = opacity > 0.05;

  return (
    <article
      style={{
        opacity,
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        pointerEvents: opacity > 0.5 ? "auto" : "none",
        zIndex: opacity > 0.5 ? 10 : 0,
        visibility: isVisible ? "visible" : "hidden",
      }}
    >
      <div className="w-full bg-white p-6 sm:p-7 lg:p-8 rounded-[28px] md:rounded-[32px] border border-gray-200 flex flex-col justify-between text-left transition-all">
        {/* Title: Solid Deep Forest Green (#063D2A) */}
        <h3 className="text-lg sm:text-xl lg:text-[22px] font-black text-[#063D2A] tracking-tight leading-snug mb-3 [text-wrap:balance]">
          {parsed.title}
        </h3>

        {/* Author Info - Clean row with real Indonesian profile photo */}
        <div className="flex items-center gap-3.5 my-3">
          <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#063D2A]/10 shadow-sm shrink-0 border border-gray-100 bg-gray-100">
            <img
              src={parsed.avatar}
              alt={parsed.author}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#063D2A] leading-tight truncate">
              {parsed.author}
            </p>
            <p className="text-xs font-black text-[#063D2A] leading-tight mt-0.5 truncate tracking-wide">
              {parsed.role}
            </p>
          </div>
        </div>

        {/* Description: Solid Charcoal (#1F2937), High Contrast, Never Faded */}
        <p className="text-[#1F2937] text-xs sm:text-sm font-medium leading-relaxed my-2 line-clamp-3">
          {parsed.summary}
        </p>

        {/* Footer / Action */}
        <div className="pt-4 mt-3 border-t border-dashed border-gray-200 flex items-center justify-end">
          <PopButton asChild color="yellow" size="default">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-black shadow-sm shrink-0 px-5"
            >
              <span>Lihat Proyek</span>
            </Link>
          </PopButton>
        </div>
      </div>
    </article>
  );
}

export function Scroll01({ items, title, subtitle }: Readonly<Scroll01Props>) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(Math.floor(v * items.length), items.length - 1);
    setActiveIndex(idx);
  });

  return (
    <div ref={wrapperRef} className="relative w-full" style={{ height: `${items.length * 60}vh` }}>
      {/* Mobile: scroll-locked section — full viewport width, N*60svh tall */}
      <div
        className="block md:hidden relative z-30 -mt-[80px]"
        style={{ height: '100%' }}
      >
        <div
          className="sticky top-0 overflow-hidden bg-white"
          style={{ height: '100vh' }}
        >
          {/* Fake previous section bottom to lock the curve on screen */}
          <div className="absolute top-0 inset-x-0 h-[80px] bg-white z-0 pointer-events-none">
            <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 w-full h-[40px] transform translate-y-[1px]">
              <path d="M0 100 V 50 C 360 50, 600 0, 720 0 C 840 0, 1080 50, 1440 50 V 100 H 0 Z" fill="white" />
            </svg>
          </div>

          <div className="relative z-10 h-full flex flex-col pt-[96px] px-4 pb-6 gap-3">

            {/* Header Space (always reserved) */}
            <div className="text-center pt-1 pb-1 flex-shrink-0 min-h-[70px] flex flex-col items-center justify-center">
              {title && (
                <h2 className="text-[26px] font-black text-[#063D2A] tracking-tight leading-[1.15]">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-[#1F2937] mt-1 text-xs max-w-xs mx-auto leading-relaxed font-medium">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Crossfading image — fixed height */}
            <div className="relative w-full overflow-hidden rounded-[24px] border border-gray-200 shadow-md bg-[#063D2A] flex-shrink-0" style={{ aspectRatio: '16/10' }}>
              {items.map((item, index) => (
                <ScrubbedItem key={`mob-img-${index}`} item={item} index={index} total={items.length} progress={scrollYProgress} isImage />
              ))}
            </div>

            {/* Crossfading text — fills remaining space */}
            <div className="relative flex-1 min-h-0 mt-3">
              {items.map((item, index) => {
                const parsed = parsePortfolioItem(item, index);
                return (
                  <motion.div
                    key={`mob-txt-${index}`}
                    className="absolute inset-0 flex flex-col items-center justify-start px-2 text-center"
                    animate={{
                      opacity: activeIndex === index ? 1 : 0,
                      pointerEvents: activeIndex === index ? 'auto' : 'none',
                    }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    <h3 className="text-base sm:text-lg font-black text-[#063D2A] text-center leading-snug [text-wrap:balance]">{parsed.title}</h3>
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-200">
                        <img src={parsed.avatar} alt={parsed.author} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-black text-[#063D2A]">{parsed.author} · {parsed.role}</p>
                    </div>
                    <p className="text-[#1F2937] text-xs text-center mt-2 leading-relaxed line-clamp-3 font-medium">{parsed.summary}</p>
                    <div className="mt-3">
                      <PopButton asChild color="yellow" size="default">
                        <Link
                          href="/login"
                          className="text-xs sm:text-sm font-black shadow-sm shrink-0 px-5"
                        >
                          <span>Lihat Proyek</span>
                        </Link>
                      </PopButton>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 flex-shrink-0 pb-2 mt-3">
              {items.map((_, index) => (
                <motion.div
                  key={index}
                  className={`rounded-full transition-colors ${activeIndex === index ? 'bg-[#063D2A]' : 'bg-gray-300'}`}
                  animate={{
                    width: activeIndex === index ? 24 : 6,
                    opacity: activeIndex === index ? 1 : 0.6,
                  }}
                  style={{ height: 6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:block relative w-full h-full">
        {/* STICKY LAYER */}
        <div className="sticky top-[80px] w-full min-h-[calc(100vh-80px)] flex flex-col justify-start pt-4 pointer-events-auto pb-16">
          
          {/* Header */}
          <div className="bg-white text-center px-4 pb-8 pt-0 w-full flex flex-col items-center justify-center">
            {title && (
              <h2 className="text-[44px] font-black text-[#063D2A] tracking-tight leading-[1.15]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[#1F2937] mt-2.5 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-[1.25fr_1fr] gap-8 items-stretch w-full max-w-[1240px] mx-auto">
            {/* Left: Images */}
            <div className="relative w-full overflow-hidden rounded-[28px] md:rounded-[32px] border border-gray-200 bg-[#063D2A]" style={{ aspectRatio: '16/10' }}>
              {items.map((item, index) => (
                <ScrubbedItem key={`img-${index}`} item={item} index={index} total={items.length} progress={scrollYProgress} isImage />
              ))}
            </div>
            
            {/* Right: Text */}
            <div className="relative w-full h-full">
              {items.map((item, index) => (
                <ScrubbedItem key={`txt-${index}`} item={item} index={index} total={items.length} progress={scrollYProgress} />
              ))}
            </div>
          </div>

          {/* Progress Indicators (Dots) */}
          <div className="flex items-center justify-center gap-2.5 mt-12 md:mt-16 pb-6">
            {items.map((_, index) => (
              <div
                key={index}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeIndex === index ? 'w-9 bg-[#063D2A]' : 'w-2.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Scroll01;
