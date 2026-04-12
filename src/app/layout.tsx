import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'RLG REPTILE — 即時競標平台',
    template: '%s | RLG REPTILE',
  },
  description: 'RLG REPTILE 即時線上競標平台，稀有爬蟲即時競標，快速出價，安全成交。',
  keywords: ['競標', '拍賣', '線上競標', 'auction', '即時競標', 'RLG', '爬蟲', 'reptile'],
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    siteName: 'RLG REPTILE',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0A0A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={inter.variable}>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#171717',
                color: '#FAFAFA',
                border: '1px solid #404040',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#E8FF00', secondary: '#0A0A0A' },
                duration: 3000,
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#FAFAFA' },
                duration: 4000,
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
