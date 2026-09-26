import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Metro Institute — Build Skills. Build Portfolio. Build Your Career.',
    template: '%s | Metro Institute',
  },
  description: 'Platform digital skills terlengkap untuk UI/UX Design, Frontend, Backend, dan Mobile App Development. Belajar bersama mentor berpengalaman dengan kurikulum terstruktur.',
  keywords: ['digital skills', 'bootcamp', 'ui/ux', 'frontend', 'backend', 'mobile', 'belajar online'],
  authors: [{ name: 'Metro Institute' }],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Metro Institute',
  },
  robots: 'index, follow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
