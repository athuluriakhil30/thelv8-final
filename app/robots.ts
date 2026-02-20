import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin/*',
          '/api/',
          '/api/*',
          '/account/',
          '/account/*',
          '/cart',
          '/checkout',
          '/checkout/*',
          '/order-success',
          '/order-success/*',
          '/wishlist',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/cart',
          '/checkout/',
          '/order-success/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/cart',
          '/checkout/',
          '/order-success/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
