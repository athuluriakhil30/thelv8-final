import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { AppProviders } from '@/context/AppProviders';
import { Toaster } from '@/components/ui/toaster';
import { AnnouncementPopup } from '@/components/AnnouncementPopup';
import { SeasonalAnimation } from '@/components/SeasonalAnimation';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { WebViewRedirect } from '@/components/WebViewRedirect';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OrganizationSchema, WebsiteSchema } from '@/components/StructuredData';
import { defaultMetadata } from '@/lib/metadata';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body className={spaceGrotesk.className}>
        <GoogleAnalytics />
        <WebViewRedirect />
        <AppProviders>
          <SeasonalAnimation />
          <Navigation />
          {children}
          <Footer />
          <Toaster />
          <AnnouncementPopup />
          <Analytics />
          <SpeedInsights />
        </AppProviders>
      </body>
    </html>
  );
}
