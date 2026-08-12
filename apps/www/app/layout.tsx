import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';

import { appName, googleAnalyticsId, siteUrl } from '@/lib/shared';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  // Without this, Next resolves OG and Twitter image URLs against
  // http://localhost:3000 in a production build — the links render, they just
  // point nowhere. NEXT_PUBLIC_SITE_URL is what makes it the real domain rather
  // than the per-deployment Vercel URL.
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} — liquid glass components for React`,
    template: `%s — ${appName}`,
  },
  description:
    'Liquid glass components for React, built on Base UI. Surfaces that refract what is behind them, installed as source through the shadcn CLI.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
      {/*
        Only in a production build: `next dev` would otherwise report every
        local page view into the same property, and localhost traffic is not
        traffic. The component loads gtag.js after hydration, so it costs
        nothing on first paint.
      */}
      {process.env.NODE_ENV === 'production' && <GoogleAnalytics gaId={googleAnalyticsId} />}
    </html>
  );
}
