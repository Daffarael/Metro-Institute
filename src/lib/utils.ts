
export const ROUTES = {
  // Public
  HOME: '/',
  VERIFY_CERT: (credentialId: string) => `/verify/${credentialId}`,

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Onboarding
  SKILL_TEST: '/skill-test',
  SKILL_TEST_RESULT: '/skill-test/result',

  // Mentee
  BASECAMP: '/mentee/basecamp',
  MY_COURSES: '/mentee/my-courses',
  PROFILE: (userId: string) => `/mentee/profile/${userId}`,
  SETTINGS: '/mentee/settings',
  NOTIFICATIONS: '/mentee/notifications',
  XP_ACTIVITY: '/mentee/xp-activity',
  LEADERBOARD: '/mentee/leaderboard',
  CERTIFICATES: '/mentee/certificates',
  WISHLIST: '/mentee/wishlist',
  TRANSACTIONS: '/mentee/transactions',

  // Catalog
  BOOTCAMP_LIST: '/mentee/bootcamp',
  BOOTCAMP_DETAIL: (id: string) => `/mentee/bootcamp/${id}`,
  COURSE_LIST: '/mentee/mini-course',
  COURSE_DETAIL: (id: string) => `/mentee/mini-course/${id}`,

  // Checkout
  CHECKOUT: (type: 'bootcamp' | 'mini-course', id: string) =>
    `/mentee/checkout/${type}/${id}`,
  CHECKOUT_SUCCESS: '/mentee/checkout/success',
  CHECKOUT_FAILED:  '/mentee/checkout/failed',

  // Catalog (alias)
  CATALOG:   '/mentee/mini-course',

  // Learn
  LEARN_BOOTCAMP: (id: string) => `/mentee/bootcamp/${id}`,
  LEARN_BOOTCAMP_SESSION: (bootcampId: string, sessionId: string) =>
    `/mentee/bootcamp/${bootcampId}/session/${sessionId}`,
  LEARN_COURSE: (id: string) => `/mentee/learn/mini-course/${id}`,
  LEARN_COURSE_SESSION: (courseId: string, sessionId: string) =>
    `/mentee/learn/mini-course/${courseId}/${sessionId}`,

  // Challenges
  CHALLENGES: '/mentee/challenges',
  CHALLENGE_DETAIL: (id: string) => `/mentee/challenges/${id}`,

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_MENTEES: '/admin/mentees',
  ADMIN_BOOTCAMP: '/admin/bootcamp',
  ADMIN_COURSE: '/admin/mini-course',
  ADMIN_ASSIGNMENTS: '/admin/assignments',
  ADMIN_CHALLENGES: '/admin/challenges',
  ADMIN_TRANSACTIONS: '/admin/transactions',
  ADMIN_VOUCHERS: '/admin/vouchers',
  ADMIN_LEADS: '/admin/leads',
  ADMIN_BROADCAST: '/admin/broadcast',
  ADMIN_XP_SETTINGS: '/admin/xp-settings',
  ADMIN_CERTIFICATES: '/admin/certificates',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_HOMEPAGE: '/admin/homepage-manager',
} as const

// ── Field Labels & Colors (hardcode fallback — nanti bisa di-extend dari DB) ──
export const FIELD_LABELS: Record<string, string> = {
  UI_UX: 'UI/UX Design',
  FRONTEND: 'Frontend Development',
  BACKEND: 'Backend Development',
  MOBILE: 'Mobile Apps Development',
}

export const FIELD_COLORS: Record<string, string> = {
  UI_UX: '#8B5CF6',
  FRONTEND: '#3B82F6',
  BACKEND: '#018556',
  MOBILE: '#F59E0B',
}

export const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  ELEMENTARY: 'Elementary',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
}

export const BADGE_LABELS: Record<string, string> = {
  METRO_ROOKIE: 'Metro Rookie',
  METRO_EXPLORER: 'Metro Explorer',
  METRO_ACHIEVER: 'Metro Achiever',
  METRO_EXPERT: 'Metro Expert',
  METRO_MASTER: 'Metro Master',
}

// ── Rupiah Formatter ───────────────────────────────────────
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Duration Formatter ─────────────────────────────────────
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}d`
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMin = minutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}j ${remainingMin}m`
}

// ── Date Formatters ────────────────────────────────────────
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} mnt lalu`
  if (diffHr < 24) return `${diffHr} jam lalu`
  if (diffDay < 7) return `${diffDay} hari lalu`
  return formatDateShort(dateStr)
}

// ── String utils ───────────────────────────────────────────
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '...'
}
