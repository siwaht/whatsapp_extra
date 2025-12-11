import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/error-boundary';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1419' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'WhatsAppX - WhatsApp Management Dashboard',
    template: '%s | WhatsAppX',
  },
  description: 'Enterprise-grade WhatsApp management platform powered by Evolution API. Manage multiple WhatsApp instances, contacts, broadcasts, and AI agents in one place.',
  keywords: ['WhatsApp', 'Evolution API', 'WhatsApp Management', 'Business Messaging', 'WhatsApp Dashboard', 'WhatsApp Bot', 'AI Agent'],
  authors: [{ name: 'WhatsAppX Team' }],
  creator: 'WhatsAppX',
  publisher: 'WhatsAppX',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'WhatsAppX',
    title: 'WhatsAppX - WhatsApp Management Dashboard',
    description: 'Enterprise-grade WhatsApp management platform powered by Evolution API',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsAppX - WhatsApp Management Dashboard',
    description: 'Enterprise-grade WhatsApp management platform powered by Evolution API',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster position="top-right" richColors />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}