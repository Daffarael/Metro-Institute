import { create } from 'zustand'

interface UIState {
  searchPlaceholder: string | null
  setSearchPlaceholder: (placeholder: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  searchPlaceholder: null,
  setSearchPlaceholder: (placeholder) => set({ searchPlaceholder: placeholder }),
}))
