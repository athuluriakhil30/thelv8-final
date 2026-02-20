import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com').replace(/\/$/, '');
  
  // Static pages with high priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/new-arrivals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/custom-orders`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cancelation-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-conditions`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Fetch all published products
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('slug, updated_at')
    .eq('published', true);

  const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Fetch all published collections
  const { data: collections } = await supabaseAdmin
    .from('collections')
    .select('slug, updated_at')
    .eq('published', true);

  const collectionPages: MetadataRoute.Sitemap = (collections || []).map((collection) => ({
    url: `${baseUrl}/collections/${collection.slug}`,
    lastModified: collection.updated_at ? new Date(collection.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Fetch all categories
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('slug, updated_at');

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((category) => ({
    url: `${baseUrl}/shop?category=${category.slug}`,
    lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...collectionPages, ...categoryPages];
}
