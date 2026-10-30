"use client";

import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import React, { useRef } from "react";
import { ArrowRight } from "lucide-react";

export const INTERACTIVE_LINKS = [
  {
    heading: "Bootcamp",
    subheading: "Program komprehensif 12 minggu siap kerja dari nol.",
    imgSrc: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
    href: "/login",
  },
  {
    heading: "Mini Course",
    subheading: "Kuasai skill teknologi spesifik dalam waktu singkat.",
    imgSrc: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
    href: "/login",
  },
  {
    heading: "Webinar & Workshop",
    subheading: "Sesi live interaktif langsung bersama praktisi top industri.",
    imgSrc: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=800",
    href: "/login",
  },
];

interface InteractiveHoverLinksProps {
  links?: typeof INTERACTIVE_LINKS;
  title?: string;
  subtitle?: string;
}

export function InteractiveHoverLinks({
  links = INTERACTIVE_LINKS,
  title = 'Eksplorasi Layanan Kami',
  subtitle = 'Pilih jalur akselerasi karir yang paling pas dengan gaya dan kebutuhan belajarmu.',
}: InteractiveHoverLinksProps) {
  return (
    <section className="bg-background pt-16 md:pt-24 pb-16 px-4 md:px-8 w-full">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{title}</h2>
          <p className="text-gray-500 mt-2">{subtitle}</p>
        </div>
        {links.map((link) => (
          <HoverLink key={link.heading} {...link} />
        ))}
      </div>
    </section>
  );
}

interface LinkProps {
  heading: string;
  imgSrc: string;
  subheading: string;
  href: string;
}

function HoverLink({ heading, imgSrc, subheading, href }: LinkProps) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const top = useTransform(mouseYSpring, [0.5, -0.5], ["40%", "60%"]);
  const left = useTransform(mouseXSpring, [0.5, -0.5], ["60%", "40%"]);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  return (
    <motion.a
      href={href}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      initial="initial"
      whileHover="whileHover"
      className="group relative flex items-center justify-between border-b border-gray-200 py-6 transition-colors duration-500 hover:border-[#03764F] md:py-8"
    >
      <div>
        <motion.span
          variants={{
            initial: { x: 0 },
            whileHover: { x: -16 },
          }}
          transition={{
            type: "spring",
            staggerChildren: 0.075,
            delayChildren: 0.25,
          }}
          className="relative z-10 block text-3xl font-bold text-gray-400 transition-colors duration-500 group-hover:text-[#03764F] md:text-5xl"
        >
          {heading.split("").map((l, i) => (
            <motion.span
              variants={{
                initial: { x: 0 },
                whileHover: { x: 16 },
              }}
              transition={{ type: "spring" }}
              className="inline-block"
              key={i}
            >
              {l === " " ? "\u00A0" : l}
            </motion.span>
          ))}
        </motion.span>
        <span className="relative z-10 mt-2 block text-sm md:text-base text-gray-500 transition-colors duration-500 group-hover:text-gray-900">
          {subheading}
        </span>
      </div>

      {imgSrc ? (
        <motion.img
          style={{
            top,
            left,
            translateX: "-10%",
            translateY: "-50%",
          }}
          variants={{
            initial: { scale: 0, rotate: "-12.5deg" },
            whileHover: { scale: 1, rotate: "12.5deg" },
          }}
          transition={{ type: "spring" }}
          src={imgSrc}
          className="absolute z-0 h-24 w-32 rounded-lg object-cover shadow-2xl md:h-48 md:w-64 pointer-events-none"
          alt={`Image representing ${heading}`}
        />
      ) : null}
      
      <div className="overflow-hidden">
        <motion.div
          variants={{
            initial: {
              x: "100%",
              opacity: 0,
            },
            whileHover: {
              x: "0%",
              opacity: 1,
            },
          }}
          transition={{ type: "spring" }}
          className="relative z-10 p-2 md:p-4"
        >
          <ArrowRight className="size-6 text-[#03764F] md:size-10" />
        </motion.div>
      </div>
    </motion.a>
  );
}
