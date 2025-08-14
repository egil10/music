import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Spotify Wrapped Advanced',
  description: 'Your comprehensive Spotify listening analytics dashboard',
  keywords: ['spotify', 'wrapped', 'analytics', 'music', 'dashboard'],
  authors: [{ name: 'Spotify Wrapped Advanced' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Spotify Wrapped Advanced',
    description: 'Your comprehensive Spotify listening analytics dashboard',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spotify Wrapped Advanced',
    description: 'Your comprehensive Spotify listening analytics dashboard',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
