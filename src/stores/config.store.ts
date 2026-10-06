import { create } from 'zustand'

export interface GlobalField {
  value: string
  label: string
  color: string
}

export interface GlobalBadge {
  value: string
  label: string
  xp: number
}

export interface GlobalSidebarMenu {
  label: string
  icon?: string
  value?: string
  children?: { label: string; value: string; icon?: string }[]
}

export interface GlobalConfigState {
  fields: GlobalField[];
  badges: GlobalBadge[];
  sidebar: GlobalSidebarMenu[];
  setConfig: (config: { fields?: GlobalField[], badges?: GlobalBadge[], sidebar?: GlobalSidebarMenu[] }) => void;
}

export const useConfigStore = create<GlobalConfigState>((set) => ({
  fields: [],
  badges: [],
  sidebar: [],
  setConfig: (config) => set((state) => ({ ...state, ...config }))
}))
