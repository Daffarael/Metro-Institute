import type { Metadata } from 'next'
import { Inter, Reggae_One, Geist } from 'next/font/google'
import '../globals.css'
import { Providers } from '@/components/providers'
import { GlobalConfigInitializer } from '@/components/GlobalConfigInitializer'
import { Toaster } from 'sonner'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const reggaeOne = Reggae_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-reggae-one',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Metro Institute — Build Skills. Build Portfolio. Build Your Career.',
    template: '%s | Metro Institute',
  },
  icons: {
    icon: '/icon.png',
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

async function getHomepageData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/homepage`, { next: { revalidate: 60 } })
    if (!res.ok) return { config: {} }
    const json = await res.json()
    return json.data ?? { config: {} }
  } catch {
    return { config: {} }
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const data = await getHomepageData()

  return (
    <html lang="id" className={cn(inter.variable, reggaeOne.variable, "font-sans", geist.variable)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GlobalConfigInitializer config={data.config} />
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
