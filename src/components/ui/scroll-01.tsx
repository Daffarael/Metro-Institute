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
};

export interface Scroll01Props {
  items: Scroll01Item[];
  title?: string;
  subtitle?: string;
}

function ScrollItem({
  item,
  index,
  setActive,
  isLast,
}: {
  item: Scroll01Item;
  index: number;
  setActive: Dispatch<SetStateAction<number>>;
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 580px", "start 247px"],
  });

  const opacityValues = index === 0 ? [1, 1, 1, 0] : isLast ? [0, 0, 1, 1] : [0, 1, 1, 0];
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.6, 1],
    opacityValues,
  );

  const isActive = useTransform(scrollYProgress, (v) => v > 0.3 && v < 0.75);

  useMotionValueEvent(isActive, "change", (v) => {
    if (v) {
      setActive((prev) => (prev === index ? prev : index));
    }
  });

  return (
    <motion.article
      ref={ref}
      style={{ opacity }}
      className="flex flex-col items-center"
    >
      <div className="text-center">
        <h3 className="mb-2 text-2xl font-semibold text-gray-900">{item.title}</h3>
        <p className="text-gray-500">{item.description}</p>
      </div>
    </motion.article>
  );
}

export function Scroll01({ items, title, subtitle }: Readonly<Scroll01Props>) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [dynamicPb, setDynamicPb] = useState(155);

  useEffect(() => {
    const calculatePb = () => {
      if (stickyRef.current) {
        const h = stickyRef.current.offsetHeight;
        // Formula: H - pt (290) - itemHeight (~64)
        const calculatedPb = h - 354;
        setDynamicPb(calculatedPb > 0 ? calculatedPb : 155);
      }
    };
    
    calculatePb();
    window.addEventListener('resize', calculatePb);
    return () => window.removeEventListener('resize', calculatePb);
  }, []);

  return (
    <div className="relative w-full">
      {/* Mobile view */}
      <div className="space-y-10 md:hidden">
        {title && (
          <div className="text-center px-4 pb-4">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-[1.15]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-500 mt-3 text-sm max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {items.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            className="flex flex-col items-start space-y-4"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-500">{item.description}</p>
            </div>
            <img
              src={item.media}
              alt={item.title}
              className="h-72 w-full rounded-2xl object-cover"
            />
          </article>
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block relative w-full">
        
        {/* STICKY LAYER: Contains both Header and Image so they scroll together */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div ref={stickyRef} className="sticky top-[96px] pointer-events-auto flex flex-col w-full">
            
            {/* Header */}
            {title && (
              <div className="bg-[#f7f7f9] text-center px-4 pb-8 relative w-full">
                <h2 className="text-[44px] font-black text-gray-900 tracking-tight leading-[1.15]">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-gray-500 mt-3 text-lg max-w-2xl mx-auto leading-relaxed">
                    {subtitle}
                  </p>
                )}
                <div className="absolute top-full inset-x-0 h-10 bg-gradient-to-b from-[#f7f7f9] to-transparent pointer-events-none" />
              </div>
            )}

            {/* Image Grid */}
            <div className="grid grid-cols-[3fr_2fr] gap-6 items-start w-full">
              <div className="relative w-full overflow-hidden rounded-[24px] shadow-xl bg-gray-100" style={{ aspectRatio: '16/10' }}>
                {items.map((item, index) => (
                  <motion.img
                    key={`${item.title}-${index}`}
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
              <div /> {/* Empty right column */}
            </div>

          </div>
        </div>

        {/* SCROLLING LAYER: Contains only the text */}
        <div className="grid grid-cols-[3fr_2fr] gap-6 items-start relative z-20 pointer-events-none w-full">
          <div /> {/* Empty left column */}
          
          <div className="pt-[290px] pointer-events-auto" style={{ paddingBottom: `${dynamicPb}px` }}>
            <div className="space-y-[220px]">
              {items.map((item, index) => (
                <ScrollItem
                  key={`${item.title}-${index}`}
                  item={item}
                  index={index}
                  setActive={setActiveIndex}
                  isLast={index === items.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Scroll01;
