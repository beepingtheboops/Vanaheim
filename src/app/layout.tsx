import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Vanaheim',
  description: 'Willson Family Command Center',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
