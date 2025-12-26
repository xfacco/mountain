import type { Metadata } from 'next';
import './globals.css';
import SeasonProvider from '@/components/providers/SeasonProvider';
import { Outfit, Inter } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.alpematch.com'),
  title: {
    default: 'Alpe Match - Find Your Ideal Mountain - The Smart Mountain Comparator',
    template: '%s | Alpe Match'
  },
  description: 'Compare the best ski and mountain resorts. Discover features, services, prices, and seasonality for your perfect Alpine holiday.',
  keywords: ['mountain', 'ski', 'trekking', 'dolomites', 'alps', 'comparator', 'holidays', 'tourism', 'alpe match'],
  authors: [{ name: 'Alpe Match Team' }],
  creator: 'Alpe Match',
  publisher: 'Alpe Match',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Alpe Match - Find Your Ideal Mountain - The Smart Mountain Comparator',
    description: 'Analyze and compare hundreds of mountain destinations. Updated data on facilities, hospitality, and activities.',
    siteName: 'Alpe Match',
    images: [
      {
        url: '/alpematch_logo_social.png',
        width: 1200,
        height: 630,
        alt: 'Alpe Match Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpe Match - The Alpine Comparator',
    description: 'Compare mountain destinations for every season.',
    images: ['/alpematch_logo_social.png'],
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
import JsonLd from '@/components/seo/JsonLd';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Alpe Match',
    'url': 'https://www.alpematch.com',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': 'https://www.alpematch.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Alpe Match',
    'url': 'https://www.alpematch.com',
    'logo': 'https://www.alpematch.com/alpematch_logo_social.png',
    'sameAs': [
      // Add social links here if available
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <JsonLd data={websiteSchema} />
        <JsonLd data={organizationSchema} />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FWTMGB9GWC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-FWTMGB9GWC');
          `}
        </Script>
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
