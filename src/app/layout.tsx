import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import SessionProvider from '@/components/providers/SessionProvider';
import { TranslationProvider } from '@/contexts/TranslationContext';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VIEAgent - AI Agent Platform',
  description: 'VIEAgent - Nền tảng AI Agent tiên tiến cho người dùng Việt Nam',
  keywords: ['VIEAgent', 'AI', 'Agent', 'Vietnamese', 'Platform', 'NextJS'],
  authors: [{ name: 'VIEAgent Team' }],
  creator: 'VIEAgent Team',
  publisher: 'VIEAgent',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/vieagent-logo-square.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'VIEAgent - AI Agent Platform',
    description: 'VIEAgent - Nền tảng AI Agent tiên tiến cho người dùng Việt Nam',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://vieagent.com',
    siteName: 'VIEAgent',
    images: [
      {
        url: '/images/vieagent-logo-horizontal.png',
        width: 1200,
        height: 630,
        alt: 'VIEAgent Logo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIEAgent - AI Agent Platform',
    description: 'VIEAgent - Nền tảng AI Agent tiên tiến cho người dùng Việt Nam',
    images: ['/images/vieagent-logo-horizontal.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='vi'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <TranslationProvider>
            {children}
            <Toaster
              position='top-right'
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                },
                success: {
                  style: {
                    background: '#065f46',
                    border: '1px solid #10b981',
                  },
                },
                error: {
                  style: {
                    background: '#7f1d1d',
                    border: '1px solid #ef4444',
                  },
                },
              }}
            />
          </TranslationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
