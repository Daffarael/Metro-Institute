"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Award, Heart } from "lucide-react";

export const INTERACTIVE_LINKS = [
  {
    heading: "Bootcamp",
    subheading: "Program komprehensif 12 minggu siap kerja dari nol.",
    imgSrc: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
    category: "Intensif Siap Kerja",
    tag1: "12 Minggu",
    tag2: "Portofolio Industri",
    buttonText: "Jelajahi Bootcamp",
    href: "/login",
  },
  {
    heading: "Mini Course",
    subheading: "Kuasai skill teknologi spesifik dalam waktu singkat.",
    imgSrc: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
    category: "Skill Spesifik",
    tag1: "Akses Fleksibel",
    tag2: "E-Sertifikat Resmi",
    buttonText: "Jelajahi Mini Course",
    href: "/login",
  },
  {
    heading: "Webinar & Workshop",
    subheading: "Sesi live interaktif langsung bersama praktisi top industri.",
    imgSrc: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=800",
    category: "Live Session",
    tag1: "Q&A Interaktif",
    tag2: "Insight Expert",
    buttonText: "Jelajahi Webinar",
    href: "/login",
  },
];

const SERVICE_DEFAULTS: Record<string, {
  imgSrc: string;
  category: string;
  tag1: string;
  tag2: string;
  buttonText: string;
}> = {
  bootcamp: {
    imgSrc: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
    category: "Intensif Siap Kerja",
    tag1: "12 Minggu",
    tag2: "Portofolio Industri",
    buttonText: "Jelajahi Bootcamp",
  },
  "mini course": {
    imgSrc: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
    category: "Skill Spesifik",
    tag1: "Akses Fleksibel",
    tag2: "E-Sertifikat Resmi",
    buttonText: "Jelajahi Mini Course",
  },
  webinar: {
    imgSrc: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=800",
    category: "Live Session",
    tag1: "Q&A Interaktif",
    tag2: "Insight Expert",
    buttonText: "Jelajahi Webinar",
  },
};

export interface InteractiveHoverLinksProps {
  links?: any[];
  title?: string;
  subtitle?: string;
  onSelectService?: (serviceHeading: string) => void;
}

export function InteractiveHoverLinks({
  links = INTERACTIVE_LINKS,
  title = "Eksplorasi Layanan Kami",
  subtitle = "Pilih jalur akselerasi karir yang paling pas dengan gaya dan kebutuhan belajarmu.",
  onSelectService,
}: InteractiveHoverLinksProps) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="bg-white py-20 md:py-28 px-4 sm:px-6 lg:px-8 w-full">
      <div className="mx-auto max-w-7xl">
        {/* Section Header (Centered) */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight"
          >
            {title}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-gray-500 text-base md:text-lg mt-3 mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* 3-Column Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {links.map((item, idx) => {
            const headingLower = (item.heading || "").toLowerCase();
            let defaults = SERVICE_DEFAULTS.bootcamp;
            if (headingLower.includes("mini")) {
              defaults = SERVICE_DEFAULTS["mini course"];
            } else if (headingLower.includes("webinar") || headingLower.includes("workshop")) {
              defaults = SERVICE_DEFAULTS.webinar;
            }

            const imgSrc = item.imgSrc || defaults.imgSrc;
            const category = item.category || defaults.category;
            const tag1 = item.tag1 || defaults.tag1;
            const tag2 = item.tag2 || defaults.tag2;
            const buttonText = item.buttonText || defaults.buttonText;
            const isFav = !!favorites[item.heading || idx];

            return (
              <motion.div
                key={item.heading || idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="bg-white rounded-[32px] p-4 sm:p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  {/* Card Image Banner (No badge pill) */}
                  <div className="w-full h-[220px] sm:h-[235px] rounded-[24px] overflow-hidden relative mb-5 bg-gray-100">
                    <img
                      src={imgSrc}
                      alt={item.heading}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="px-1">
                    <h3 className="text-[22px] font-extrabold text-gray-900 tracking-tight group-hover:text-[#018556] transition-colors">
                      {item.heading}
                    </h3>
                    <span className="text-[12.5px] font-medium text-gray-400 mt-0.5 block">
                      {category}
                    </span>
                    <p className="text-[13.5px] text-gray-600 mt-2.5 leading-relaxed line-clamp-2">
                      {item.subheading}
                    </p>

                    {/* Metadata Tags Row (Reference Style: from $240 / SFO) */}
                    <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100 text-[12.5px] font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-gray-400" />
                        <span>{tag1}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-gray-400" />
                        <span>{tag2}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Row */}
                <div className="flex items-center gap-3 mt-6 pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectService) {
                        onSelectService(item.heading);
                      } else if (item.href) {
                        window.location.href = item.href;
                      }
                    }}
                    className="flex-1 py-3 px-5 rounded-full bg-[#111827] hover:bg-[#018556] text-white text-[13.5px] font-semibold text-center transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <span>{buttonText}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.heading || String(idx));
                    }}
                    className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 active:scale-90 ${
                      isFav
                        ? "bg-red-50 border-red-200 text-red-500 shadow-sm"
                        : "border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-500"
                    }`}
                    aria-label="Simpan Layanan"
                    title="Simpan ke Favorit"
                  >
                    <Heart className={`w-5 h-5 transition-transform duration-200 ${isFav ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
