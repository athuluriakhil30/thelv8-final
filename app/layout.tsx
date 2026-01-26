import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { AppProviders } from '@/context/AppProviders';
import { Toaster } from '@/components/ui/toaster';
import { AnnouncementPopup } from '@/components/AnnouncementPopup';
import { SeasonalAnimation } from '@/components/SeasonalAnimation';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'thelv8 - Elevate Your Style',
  description: 'Premium clothing collections for the modern wardrobe',
  openGraph: {
    images: [
      {
        url: 'https://images.pexels.com/photos/6764040/pexels-photo-6764040.jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://images.pexels.com/photos/6764040/pexels-photo-6764040.jpeg',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className={spaceGrotesk.className}>
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
