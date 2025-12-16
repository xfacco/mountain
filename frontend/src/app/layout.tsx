import type { Metadata } from 'next';
import './globals.css';
import SeasonProvider from '@/components/providers/SeasonProvider';
import { Outfit, Inter } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Mountain Service Comparator',
  description: 'Compare mountain resorts across seasons.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <SeasonProvider>
          {children}
          <Footer />
        </SeasonProvider>
      </body>
    </html>
  );
}
