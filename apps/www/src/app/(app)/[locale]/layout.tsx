import type { Metadata } from 'next';
import { Cinzel, Geist, Geist_Mono } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { ThemeProvider } from '@/app/context/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import '../../globals.css';
import Script from 'next/script';
import { analytics } from '@/config/analytics';
import QueryProvider from '@/app/context/query-provider';

const DEFAULT_GOOGLE_VERIFICATION = 'Y6qftxiqfFQbxtKIv9fzWhdNfWIinLmAVuCLxjHPn4I';
import { Locale, routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  // Usamos 400 para cuerpos largos y 700 para títulos.
  weight: ['400', '700'],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Las Flores de la Imprenta',
  description: 'Flores frescas y arreglos florales. Envío a domicilio en Bahía Blanca.',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || DEFAULT_GOOGLE_VERIFICATION,
  },
  openGraph: {
    title: 'Las Flores de la Imprenta',
    description: 'Flores frescas y arreglos florales. Envío a domicilio en Bahía Blanca.',
    url: BASE_URL,
    siteName: 'Las Flores de la Imprenta',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Las Flores de la Imprenta',
    description: 'Flores frescas y arreglos florales. Envío a domicilio en Bahía Blanca.',
  },
};
export async function generateStaticParams() {
  const countries = ['ar', 'us'];

  const params = [];

  for (const locale of routing.locales) {
    for (const countryCode of countries) {
      params.push({
        locale,
        countryCode,
      });
    }
  }

  return params;
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  const analyticsEnabled = analytics.enabled;
  const googleAdsId = analytics.googleAdsId ?? 'AW-17907094471';
  const facebookPixelId = analytics.facebookPixelId ?? '1579891879827288';
  const ga4Id = analytics.ga4MeasurementId;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased font-sans`}
      >
        {analyticsEnabled && googleAdsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAdsId}');
                ${ga4Id ? `gtag('config', '${ga4Id}');` : ''}
              `}
            </Script>
          </>
        )}

        {analyticsEnabled && facebookPixelId && (
          <>
            <Script id="facebook-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${facebookPixelId}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${facebookPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

        {analyticsEnabled && ga4Id && !googleAdsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}');
              `}
            </Script>
          </>
        )}

        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <NuqsAdapter>
              <QueryProvider>{children}</QueryProvider>
            </NuqsAdapter>
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
