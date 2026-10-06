'use client'

import { useRef } from 'react'
import { useConfigStore } from '@/stores/config.store'

export function GlobalConfigInitializer({ config }: { config: Record<string, string> }) {
  const initialized = useRef(false)
  
  if (!initialized.current) {
    let fields = []
    let badges = []
    let sidebar = []
    
    try {
      if (config['global_fields']) fields = JSON.parse(config['global_fields'])
    } catch {}
    
    try {
      if (config['global_badges']) badges = JSON.parse(config['global_badges'])
    } catch {}
    
    try {
      if (config['global_sidebar']) sidebar = JSON.parse(config['global_sidebar'])
    } catch {}
    
    useConfigStore.setState({ fields, badges, sidebar })
    initialized.current = true
  }
  
  return null
}
