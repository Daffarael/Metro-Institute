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
  ChevronRight,
  Search
} from 'lucide-react';
import './apple-spotlight.css';

interface SearchResult {
  icon: React.ReactNode;
  label: string;
  description: string;
  link: string;
}

interface SpotlightPlaceholderProps {
  text: string;
}

const SpotlightPlaceholder = ({ text }: SpotlightPlaceholderProps) => {
  return (
    <div
      className="as-placeholder"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        pointerEvents: 'none',
      }}
    >
      <p
        style={{
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          maxWidth: '100%',
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem',
        }}
      >
        {text}
      </p>
    </div>
  );
};

interface SpotlightInputProps {
  placeholder: string;
  hidePlaceholder: boolean;
  value: string;
  onChange: (value: string) => void;
}

const SpotlightInput = ({
  placeholder,
  hidePlaceholder,
  value,
  onChange,
}: SpotlightInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="as-input-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Search />
      </div>
      <div className="as-input-wrapper">
        {!hidePlaceholder && (
          <SpotlightPlaceholder text={placeholder} />
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
          <ChevronRight style={{ width: '1.25rem', height: '1.25rem' }} />
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
              delay: index * 0.04,
              duration: 0.15,
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
  shortcuts?: any[];
  isOpen?: boolean;
  handleClose?: () => void;
}

const AppleSpotlight = ({
  isOpen = true,
  handleClose = () => {}
}: AppleSpotlightProps) => {
  const [hoveredSearchResult, setHoveredSearchResult] = useState<number | null>(null);
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
  const isExpanded = Boolean(searchValue && searchResults.length > 0);

  return (
    <div className="as-overlay" ref={wrapperRef}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="as-main-wrapper group"
      >
        <div className={`as-search-box ${isExpanded ? 'is-focused' : ''}`}>
          <SpotlightInput
            placeholder={
              searchPlaceholder
                ? searchPlaceholder
                : currentPageLabel
            }
            hidePlaceholder={Boolean(searchValue)}
            value={searchValue}
            onChange={handleSearchValueChange}
          />
        </div>

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
    </div>
  );
};

export { AppleSpotlight };
