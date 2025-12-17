import type { Metadata } from 'next';
import './globals.css';
import SeasonProvider from '@/components/providers/SeasonProvider';
import { Outfit, Inter } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://mountain-comparator.vercel.app'),
  title: {
    default: 'MountComp - Il Comparatore di Località Montane',
    template: '%s | MountComp'
  },
  description: 'Confronta le migliori località sciistiche e montane. Scopri caratteristiche, servizi, prezzi e stagionalità per la tua vacanza perfetta sulle Alpi.',
  keywords: ['montagna', 'sci', 'trekking', 'dolomiti', 'alpi', 'comparatore', 'vacanze', 'turismo', 'trentino', 'alto adige'],
  authors: [{ name: 'MountComp Team' }],
  creator: 'MountComp',
  publisher: 'MountComp',
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: '/',
    title: 'MountComp - Trova la tua Montagna Ideale',
    description: 'Analizza e confronta centinaia di destinazioni montane. Dati aggiornati su impianti, ospitalità e attività.',
    siteName: 'MountComp',
    images: [
      {
        url: '/og-image.jpg', // Ensure this file exists or will exist in public/
        width: 1200,
        height: 630,
        alt: 'MountComp Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MountComp - Il Comparatore Alpino',
    description: 'Confronta destinazioni montane per ogni stagione.',
    images: ['/og-image.jpg'],
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

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

// ... (imports)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <SeasonProvider>
            {children}
            <Footer />
          </SeasonProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
