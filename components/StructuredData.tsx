import React from 'react';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

export function OrganizationSchema({
  name = 'thelv8',
  url = (process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com').replace(/\/$/, ''),
  logo = `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com').replace(/\/$/, '')}/logo.png`,
  description = 'Premium clothing collections for the modern wardrobe',
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: [
        'https://www.instagram.com/the_lv8/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Telugu', 'English', 'Hindi'],
      areaServed: 'IN',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebsiteSchemaProps {
  name?: string;
  url?: string;
  description?: string;
}

export function WebsiteSchema({
  name = 'thelv8',
  url = (process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com').replace(/\/$/, ''),
  description = 'Discover premium clothing collections for the modern wardrobe. Shop the latest fashion trends.',
}: WebsiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductSchemaProps {
  name: string;
  description: string;
  image: string[];
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand?: string;
  sku?: string;
  url: string;
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  currency = 'INR',
  availability = 'InStock',
  brand = 'thelv8',
  sku,
  url,
}: ProductSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: brand,
      },
    },
    ...(sku && { sku }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface CollectionSchemaProps {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
}

export function CollectionSchema({
  name,
  description,
  url,
  numberOfItems,
}: CollectionSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    ...(numberOfItems && { numberOfItems }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
