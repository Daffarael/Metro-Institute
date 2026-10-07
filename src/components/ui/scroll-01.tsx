"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { useRef, useState, useEffect, Dispatch, SetStateAction } from "react";

type Scroll01Item = {
  title: string;
  description: string;
  media: string;
  summary?: string;
};

export interface Scroll01Props {
  items: Scroll01Item[];
  title?: string;
  subtitle?: string;
}

export function Scroll01({ items, title, subtitle }: Readonly<Scroll01Props>) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const mobileWrapperRef = useRef<HTMLDivElement>(null);
  const desktopWrapperRef = useRef<HTMLDivElement>(null);

  // Mobile: track scroll progress within the tall wrapper to drive activeIndex
  const { scrollYProgress: mobileProgress } = useScroll({
    target: mobileWrapperRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(mobileProgress, "change", (v) => {
    if (window.innerWidth < 768) {
      const idx = Math.min(Math.floor(v * items.length), items.length - 1);
      setActiveIndex(idx);
    }
  });

  // Desktop: track scroll progress
  const { scrollYProgress: desktopProgress } = useScroll({
    target: desktopWrapperRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(desktopProgress, "change", (v) => {
    if (window.innerWidth >= 768) {
      const idx = Math.min(Math.floor(v * items.length), items.length - 1);
      setActiveIndex(idx);
    }
  });

  return (
    <div className="relative w-full">
      {/* Mobile: scroll-locked section — full viewport width, N×100svh tall */}
      <div
        ref={mobileWrapperRef}
        className="block md:hidden relative z-30 -mt-[80px]"
        style={{ height: `${items.length * 100}vh` }}
      >
        <div
          className="sticky top-0 overflow-hidden bg-[#f7f7f9]"
          style={{ height: '100vh' }}
        >
          {/* Fake previous section bottom to lock the curve on screen */}
          <div className="absolute top-0 inset-x-0 h-[80px] bg-white z-0 pointer-events-none">
            <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 w-full h-[40px] transform translate-y-[1px]">
              <path d="M0 100 V 50 C 360 50, 600 0, 720 0 C 840 0, 1080 50, 1440 50 V 100 H 0 Z" fill="#f7f7f9" />
            </svg>
          </div>

          <div className="relative z-10 h-full flex flex-col pt-[96px] px-4 pb-6 gap-3">

            {/* Header Space (always reserved) */}
            <div className="text-center pt-3 pb-1 flex-shrink-0 min-h-[90px] flex flex-col justify-center">
              {title && (
                <h2 className="text-[28px] font-black text-gray-900 tracking-tight leading-[1.15]">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-gray-500 mt-1 text-sm max-w-xs mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Crossfading image — fixed height */}
            <div className="relative w-full overflow-hidden rounded-2xl shadow-xl bg-gray-100 flex-shrink-0" style={{ aspectRatio: '16/10' }}>
              {items.map((item, index) => (
                <motion.img
                  key={`mob-img-${index}`}
                  src={item.media}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  animate={{ opacity: activeIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              ))}
            </div>

            {/* Crossfading text — fills remaining space */}
            <div className="relative flex-1 min-h-0">
              {items.map((item, index) => (
                <motion.div
                  key={`mob-txt-${index}`}
                  className="absolute inset-0 flex flex-col items-center justify-start pt-6 px-2"
                  animate={{ opacity: activeIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <h3 className="text-xl font-semibold text-gray-900 text-center">{item.title}</h3>
                  <p className="text-gray-500 text-sm text-center mt-2 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 flex-shrink-0 pb-2">
              {items.map((_, index) => (
                <motion.div
                  key={index}
                  className="rounded-full bg-gray-400"
                  animate={{
                    width: activeIndex === index ? 20 : 6,
                    opacity: activeIndex === index ? 1 : 0.35,
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
      <div 
        ref={desktopWrapperRef}
        className="hidden md:block relative w-full"
        style={{ height: `${items.length * 100}vh` }}
      >
        <div className="sticky top-[96px] w-full flex flex-col pointer-events-auto" style={{ height: 'calc(100vh - 96px)' }}>
            
          {/* Header */}
          <div className="bg-[#f7f7f9] text-center px-4 pb-8 relative w-full flex-shrink-0 flex flex-col justify-center min-h-[130px]">
            {title && (
              <h2 className="text-[44px] font-black text-gray-900 tracking-tight leading-[1.15]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-500 mt-3 text-lg max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
            <div className="absolute top-full inset-x-0 h-10 bg-gradient-to-b from-[#f7f7f9] to-transparent pointer-events-none" />
          </div>

          {/* Image and Text Grid */}
          <div className="grid grid-cols-[3fr_2fr] gap-12 items-center w-full flex-1 min-h-0 pb-16">
            
            {/* Image Layer */}
            <div className="relative w-full h-full max-h-[65vh] overflow-hidden rounded-[24px] shadow-xl bg-gray-100 flex-shrink-0">
              {items.map((item, index) => (
                <motion.img
                  key={`desk-img-${index}`}
                  src={item.media}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ opacity: index === 0 ? 1 : 0 }}
                  animate={{
                    opacity: activeIndex === index ? 1 : 0,
                    willChange: "opacity",
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Text Layer (Sticky Crossfade) */}
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {items.map((item, index) => (
                <motion.div
                  key={`desk-txt-${index}`}
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  initial={{ opacity: index === 0 ? 1 : 0, y: index === 0 ? 0 : 20 }}
                  animate={{ 
                    opacity: activeIndex === index ? 1 : 0,
                    y: activeIndex === index ? 0 : 20
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <div className="text-center pointer-events-auto">
                    <h3 className="mb-2 text-2xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm font-semibold tracking-wider text-primary uppercase mb-3">{item.description}</p>
                    {item.summary && <p className="text-gray-600 max-w-lg mx-auto">{item.summary}</p>}
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Scroll01;
