import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';

import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');

  return {
    title: {
      default: t('appName'),
      template: `%s · ${t('appName')}`,
    },
    description: t('tagline'),
  };
}

export const viewport: Viewport = {
  themeColor: '#111113',
  width: 'device-width',
  initialScale: 1,
  // The Capture textarea grows a lot; let people zoom out to see it all.
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved server-side from the locale cookie, so the first paint is already
  // in the right language — no flash of untranslated content.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
