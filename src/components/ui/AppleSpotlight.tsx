'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/ui.store';
import { ROUTES } from '@/lib/utils';
import {
  Home,
  Compass,
  Tent,
  GraduationCap,
  Zap,
  Trophy,
  Star,
  ScrollText,
  CreditCard,
  MessageCircle,
  ChevronRight,
  Files,
  Search
} from 'lucide-react';
import './apple-spotlight.css';

interface Shortcut {
  label: string;
  icon: React.ReactNode;
  link?: string;
  onClick?: (setSearchValue: (val: string) => void) => void;
}

interface SearchResult {
  icon: React.ReactNode;
  label: string;
  description: string;
  link: string;
}

const SVGFilter = () => {
  return (
    <svg width="0" height="0">
      <filter id="blob">
        <feGaussianBlur stdDeviation="10" in="SourceGraphic" />
        <feColorMatrix
          values="
      1 0 0 0 0
      0 1 0 0 0
      0 0 1 0 0
      0 0 0 18 -9
    "
          result="blob"
        />
        <feBlend in="SourceGraphic" in2="blob" />
      </filter>
    </svg>
  );
};

interface ShortcutButtonProps {
  icon: React.ReactNode;
  link?: string;
  onClick?: () => void;
}

const ShortcutButton = ({ icon, link, onClick }: ShortcutButtonProps) => {
  if (onClick) {
    return (
      <button onClick={onClick} type="button" className="as-shortcut-btn" style={{ border: 'none', outline: 'none', padding: 0 }}>
        <div className="as-shortcut-icon">{icon}</div>
      </button>
    );
  }
  return (
    <a href={link} target="_blank" rel="noreferrer" className="as-shortcut-btn">
      <div className="as-shortcut-icon">{icon}</div>
    </a>
  );
};

interface SpotlightPlaceholderProps {
  text: string;
  className?: string;
}

const SpotlightPlaceholder = ({ text, className = '' }: SpotlightPlaceholderProps) => {
  return (
    <motion.div
      layout
      className={`as-placeholder ${className}`}
    >
      <AnimatePresence mode="popLayout">
        <motion.p
          layoutId={`placeholder-${text}`}
          key={`placeholder-${text}`}
          initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ margin: 0 }}
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
};

interface SpotlightInputProps {
  placeholder: string;
  hidePlaceholder: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholderClassName?: string;
}

const SpotlightInput = ({
  placeholder,
  hidePlaceholder,
  value,
  onChange,
  placeholderClassName
}: SpotlightInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when the component mounts
    inputRef.current?.focus();
  }, []);

  return (
    <div className="as-input-container">
      <div>
        <Search />
      </div>
      <div className="as-input-wrapper">
        {!hidePlaceholder && (
          <SpotlightPlaceholder text={placeholder} className={placeholderClassName} />
        )}

        <input
          suppressHydrationWarning
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="as-input"
        />
      </div>
    </div>
  );
};

interface SearchResultCardProps extends SearchResult {
  isLast: boolean;
  onClick?: () => void;
}

const SearchResultCard = ({ icon, label, description, link, isLast, onClick }: SearchResultCardProps) => {
  return (
    <Link href={link} className="as-result-link group-card" onClick={onClick}>
      <div className={`as-result-card ${isLast ? 'is-last' : ''}`}>
        <div className="as-result-icon-container">
          {icon}
        </div>
        <div className="as-result-text-col">
          <p className="as-result-label">{label}</p>
          <p className="as-result-desc">{description}</p>
        </div>
        <div className="as-result-chevron">
          <ChevronRight style={{ width: '1.5rem', height: '1.5rem' }} />
        </div>
      </div>
    </Link>
  );
};

interface SearchResultsContainerProps {
  searchResults: SearchResult[];
  onHover: (index: number | null) => void;
  onResultClick: () => void;
}

const SearchResultsContainer = ({ searchResults, onHover, onResultClick }: SearchResultsContainerProps) => {
  return (
    <div
      onMouseLeave={() => onHover(null)}
      className="as-results-container"
    >
      {searchResults.map((result, index) => {
        return (
          <motion.div
            key={`search-result-${index}`}
            onMouseEnter={() => onHover(index)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.2,
              ease: 'easeOut'
            }}
          >
            <SearchResultCard
              icon={result.icon}
              label={result.label}
              description={result.description}
              link={result.link}
              isLast={index === searchResults.length - 1}
              onClick={onResultClick}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

interface AppleSpotlightProps {
  shortcuts?: Shortcut[];
  isOpen?: boolean;
  handleClose?: () => void;
}

const AppleSpotlight = ({
  shortcuts = [
    {
      label: 'Clipboard',
      icon: <Files />,
      onClick: async (setSearchValue) => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            setSearchValue(text);
          }
        } catch (err) {
          console.error("Gagal membaca clipboard:", err);
        }
      }
    }
  ],
  isOpen = true,
  handleClose = () => {}
}: AppleSpotlightProps) => {
  const [hovered, setHovered] = useState(false);
  const [hoveredSearchResult, setHoveredSearchResult] = useState<number | null>(null);
  const [hoveredShortcut, setHoveredShortcut] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const { searchPlaceholder } = useUIStore();
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setSearchValue('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchValueChange = (value: string) => {
    setSearchValue(value);
    setHoveredSearchResult(null);
  };

  const allPages: SearchResult[] = [
    { label: 'Basecamp', description: 'Kembali ke halaman utama', link: ROUTES.BASECAMP, icon: <Home /> },
    { label: 'Mini Course', description: 'Jelajahi berbagai kelas mini', link: ROUTES.COURSE_LIST, icon: <Compass /> },
    { label: 'Bootcamp', description: 'Daftar program intensif', link: ROUTES.BOOTCAMP_LIST, icon: <Tent /> },
    { label: 'Kelas Saya', description: 'Kursus yang sedang Anda ikuti', link: ROUTES.MY_COURSES, icon: <GraduationCap /> },
    { label: 'Challenge Bank', description: 'Kumpulan tantangan koding', link: ROUTES.CHALLENGES, icon: <Zap /> },
    { label: 'Papan Peringkat', description: 'Lihat peringkat siswa terbaik', link: ROUTES.LEADERBOARD, icon: <Trophy /> },
    { label: 'Aktivitas XP', description: 'Riwayat pendapatan XP', link: ROUTES.XP_ACTIVITY, icon: <Star /> },
    { label: 'Sertifikat Saya', description: 'Koleksi sertifikat kelulusan', link: ROUTES.CERTIFICATES, icon: <ScrollText /> },
    { label: 'Riwayat Transaksi', description: 'Catatan pembelian kursus', link: ROUTES.TRANSACTIONS, icon: <CreditCard /> },
  ];

  const searchResults = searchValue
    ? allPages.filter((page) =>
        page.label.toLowerCase().startsWith(searchValue.toLowerCase())
      )
    : [];

  const currentPageLabel = allPages.find((page) => page.link === pathname)?.label || 'Search';

  return (
    <div className="as-overlay" ref={wrapperRef}>
          <SVGFilter />

          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
              setHovered(false);
              setHoveredShortcut(null);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ filter: 'url(#blob)' }}
            className="as-main-wrapper group"
          >
            <AnimatePresence>
              <div className="as-search-box">
                <SpotlightInput
                  placeholder={
                    searchPlaceholder ? searchPlaceholder :
                    hoveredShortcut !== null
                      ? shortcuts[hoveredShortcut].label
                      : hoveredSearchResult !== null
                      ? searchResults[hoveredSearchResult]?.label ?? currentPageLabel
                      : currentPageLabel
                  }
                  placeholderClassName={
                    hoveredSearchResult !== null ? 'as-placeholder-active' : ''
                  }
                  hidePlaceholder={!(hoveredSearchResult !== null || !searchValue)}
                  value={searchValue}
                  onChange={handleSearchValueChange}
                />

                {searchValue && searchResults.length > 0 && (
                  <SearchResultsContainer
                    searchResults={searchResults}
                    onHover={setHoveredSearchResult}
                    onResultClick={() => {
                      setSearchValue('');
                      setHoveredSearchResult(null);
                    }}
                  />
                )}
              </div>
              {hovered &&
                !searchValue &&
                shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={`shortcut-${index}`}
                    onMouseEnter={() => setHoveredShortcut(index)}
                    layout
                    initial={{ scale: 0.7, x: -1 * (64 * (index + 1)) }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{
                      scale: 0.7,
                      x:
                        1 *
                        (16 * (shortcuts.length - index - 1) + 64 * (shortcuts.length - index - 1))
                    }}
                    transition={{
                      duration: 0.3,
                      ease: 'easeOut',
                      delay: index * 0.05
                    }}
                    style={{ borderRadius: '9999px', cursor: 'pointer' }}
                  >
                    <ShortcutButton 
                      icon={shortcut.icon} 
                      link={shortcut.link} 
                      onClick={shortcut.onClick ? () => shortcut.onClick?.(setSearchValue) : undefined} 
                    />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>
  );
};

export { AppleSpotlight };
