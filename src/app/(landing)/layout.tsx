import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../landing.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Metro Institute — Akselerasi Karir Digitalmu',
  description: 'Platform edukasi digital untuk mencetak talent teknologi berkualitas yang siap bersaing di industri global.',
  icons: {
    icon: '/icon.jpg',
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans">
        {children}
      </body>
    </html>
  )
}
