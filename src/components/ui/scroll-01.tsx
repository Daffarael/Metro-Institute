import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from "framer-motion";

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
  const peak = total > 1 ? index / (total - 1) : 0.5;
  const distance = total > 1 ? 1 / (total - 1) : 1;
  const crossfadeHalf = distance * 0.25;

  const fadeInStart = peak - distance + crossfadeHalf;
  const fadeInEnd = peak - crossfadeHalf;
  const fadeOutStart = peak + crossfadeHalf;
  const fadeOutEnd = peak + distance - crossfadeHalf;

  const opacity = useTransform(
    progress,
    total > 1 ? [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] : [0, 0, 1, 1],
    total > 1 ? [0, 1, 1, 0] : [1, 1, 1, 1]
  );
  
  if (isImage) {
    return (
      <motion.img
        src={item.media}
        alt={item.title}
        style={{ opacity }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <motion.article
      style={{ opacity }}
      className="absolute inset-0 flex flex-col justify-center px-8"
    >
      <div className="text-center w-full bg-[#f7f7f9] bg-opacity-80 py-8 rounded-2xl backdrop-blur-sm">
        <h3 className="mb-2 text-2xl font-semibold text-gray-900">{item.title}</h3>
        <p className="text-sm font-semibold tracking-wider text-primary uppercase mb-3">{item.description}</p>
        {item.summary && <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">{item.summary}</p>}
      </div>
    </motion.article>
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
    <div ref={wrapperRef} className="relative w-full" style={{ height: `${items.length * 100}vh` }}>
      {/* Mobile: scroll-locked section — full viewport width, N*100svh tall */}
      <div
        className="block md:hidden relative z-30 -mt-[80px]"
        style={{ height: '100%' }}
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
                <ScrubbedItem key={`mob-img-${index}`} item={item} index={index} total={items.length} progress={scrollYProgress} isImage />
              ))}
            </div>

            {/* Crossfading text — fills remaining space */}
            <div className="relative flex-1 min-h-0 mt-4">
              {items.map((item, index) => (
                <motion.div
                  key={`mob-txt-${index}`}
                  className="absolute inset-0 flex flex-col items-center justify-start px-2"
                  animate={{ opacity: activeIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <h3 className="text-xl font-semibold text-gray-900 text-center">{item.title}</h3>
                  <p className="text-gray-500 text-sm text-center mt-2 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 flex-shrink-0 pb-2 mt-4">
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
      <div className="hidden md:block relative w-full h-full">
        {/* STICKY LAYER */}
        <div className="sticky top-[96px] w-full min-h-[calc(100vh-96px)] flex flex-col justify-center pointer-events-auto pb-16">
          
          {/* Header */}
          <div className="bg-[#f7f7f9] text-center px-4 pb-12 pt-8 w-full flex flex-col justify-center">
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
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-[3fr_2fr] gap-8 items-stretch w-full px-8 max-w-[1400px] mx-auto">
            {/* Left: Images */}
            <div className="relative w-full overflow-hidden rounded-[24px] shadow-xl bg-gray-100" style={{ aspectRatio: '16/10' }}>
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
          
        </div>
      </div>
    </div>
  );
}

export default Scroll01;
