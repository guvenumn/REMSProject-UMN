// Path: /frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/Providers/ClientProviders';  // Use the correct component name

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'REMS - Real Estate Management System',
  description: 'Find your dream property with our comprehensive real estate management platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}