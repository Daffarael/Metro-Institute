import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '../landing.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Metro Institute - Akselerasi Digitalmu',
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body suppressHydrationWarning className="font-sans">
        {children}
      </body>
    </html>
  )
}
