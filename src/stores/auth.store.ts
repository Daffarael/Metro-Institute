import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BadgeLevel =
  | 'METRO_ROOKIE'
  | 'METRO_EXPLORER'
  | 'METRO_ACHIEVER'
  | 'METRO_EXPERT'
  | 'METRO_MASTER'

export type Field = 'UI_UX' | 'FRONTEND' | 'BACKEND' | 'MOBILE'
export type Role = 'MENTEE' | 'SUPER_ADMIN' | 'ADMIN'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  photoUrl?: string
  role: Role
  isEmailVerified: boolean
  skillTestDone: boolean
  selectedField?: Field
  totalXp: number
  currentStreak: number
  badgeLevel: BadgeLevel
  bio?: string
  status?: string
  institution?: string
  googleId?: string
  passwordHash?: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  setToken: (token: string) => void
  logout: () => void
  updateUser: (partial: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setToken: (token) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('metro_access_token', token)
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('metro_access_token')
        }
        set({ user: null, isAuthenticated: false })
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'metro-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// ── Notification Badge Store ───────────────────────────────
interface NotifState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  increment: () => void
  reset: () => void
  /** Alias for reset — clears unread count */
  resetUnread: () => void
}

export const useNotifStore = create<NotifState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
  resetUnread: () => set({ unreadCount: 0 }),
}))
