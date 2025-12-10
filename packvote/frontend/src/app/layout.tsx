import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cohere - Travel Together, Decide Together',
  description: 'Plan group trips, vote on destinations, and make decisions together.',
  keywords: ['travel', 'trip planning', 'group travel', 'AI recommendations', 'voting'],
  authors: [{ name: 'Cohere Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b', // zinc-950
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${instrumentSerif.variable} ${inter.variable} font-body antialiased bg-background text-foreground min-h-screen selection:bg-zinc-800 selection:text-zinc-100`}>
        <Providers>
          {/* Global Background Effects */}
          <div className="fixed inset-0 z-[-1] bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background opacity-80" />
            <div className="noise-overlay opacity-[0.03]" />
          </div>

          {children}

          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#18181b', // zinc-900
                color: '#f4f4f5', // zinc-100
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.875rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981', // emerald-500
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444', // red-500
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}