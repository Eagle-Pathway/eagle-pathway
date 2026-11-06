import type { Metadata, Viewport } from 'next';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://web.eaglespathway.com'),
  title: 'Eagle Pathway | Scholarships, 1-on-1 Tutoring & University Guidance',
  description:
    'Eagle Pathway empowers students with international scholarships, verified expert tutors, career counseling packages, and seamless application tracking.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/brand/icon-light.png',
  },
  openGraph: {
    title: 'Eagle Pathway',
    description: 'Scholarships, 1-on-1 Tutoring & University Guidance',
    url: 'https://web.eaglespathway.com',
    siteName: 'Eagle Pathway',
    images: [
      {
        url: '/brand/og-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Eagle Pathway',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0B2A5B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-[#C9A84C]/30 selection:text-[#0B2A5B]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

