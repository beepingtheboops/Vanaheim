import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'HomeBase — Family Command Center',
  description: 'Secure family home automation dashboard',
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
