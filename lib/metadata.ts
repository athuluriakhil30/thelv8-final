import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com';
const siteName = 'thelv8';
const siteDescription = 'Discover premium clothing collections for the modern wardrobe. Shop the latest fashion trends with free shipping across India. Elevate your style with thelv8.';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'thelv8 - Elevate Your Style | Premium Fashion & Clothing',
    template: '%s | thelv8',
  },
  description: siteDescription,
  keywords: [
    'fashion',
    'clothing',
    'premium fashion',
    'online shopping',
    'trendy clothes',
    'indian fashion',
    'mens fashion',
    'womens fashion',
    'thelv8',
    'clothing brand',
    'fashion store',
    'style',
    'Athuluri Akhil',
    'Athuluri Akhil',
    'Athuluri Akhil',
    'Athuluri Akhil',
    'Athuluri Akhil',
    'apparel',
    'ecommerce',
    'Affordable fashion',
    'Free shipping',
    'Latest fashion trends',
    'Shop online',
    'Premium clothing collections',
    'Elevate your style',
    'Fashion for everyone',
    'Discover fashion',
    'Athuluri Akhil',
    'Athuluri Akhil',
    'Athuluri Akhil',
    'Athuluri Akhil',
    'thelv8 collections',
    'thelv8 fashion',
    'thelv8 clothing',
    'thelv8 style',
    'thelv8 shop',
    'thelv8 online',
    'thelv8 store',
    'thelv8 india',
    'thelv8 free shipping',
    'Athuluri Akhil',
  ],
  authors: [{ name: 'thelv8' }],
  creator: 'thelv8',
  publisher: 'thelv8',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: baseUrl,
    siteName: siteName,
    title: 'thelv8 - Elevate Your Style | Premium Fashion & Clothing',
    description: siteDescription,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'thelv8 - Premium Fashion Collections',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'thelv8 - Elevate Your Style',
    description: siteDescription,
    creator: '@thelv8',
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
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'f83b89d2153d9844', // Google Search Console verification
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: baseUrl,
  },
  category: 'shopping',
};

// Helper function to generate product metadata
export function generateProductMetadata({
  title,
  description,
  image,
  price,
  slug,
}: {
  title: string;
  description: string;
  image: string;
  price: number;
  slug: string;
}): Metadata {
  const url = `${baseUrl}/product/${slug}`;
  
  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      type: 'website',
      url,
      title,
      description: description.slice(0, 160),
      images: [
        {
          url: image,
          width: 800,
          height: 800,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.slice(0, 160),
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Helper function to generate collection metadata
export function generateCollectionMetadata({
  title,
  description,
  image,
  slug,
}: {
  title: string;
  description?: string;
  image?: string;
  slug: string;
}): Metadata {
  const url = `${baseUrl}/collections/${slug}`;
  const desc = description || `Shop ${title} collection at thelv8. Discover premium fashion and elevate your style.`;
  
  return {
    title,
    description: desc.slice(0, 160),
    openGraph: {
      type: 'website',
      url,
      title,
      description: desc.slice(0, 160),
      images: image ? [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc.slice(0, 160),
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}
