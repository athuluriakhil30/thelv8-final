'use client';

import { useEffect } from 'react';
import { CollectionSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { Collection } from '@/types';

interface CollectionPageSEOProps {
  collection: Collection;
  productCount: number;
}

/**
 * Modular SEO Component for Collection Pages
 * Adds structured data without modifying core functionality
 */
export function CollectionPageSEO({ collection, productCount }: CollectionPageSEOProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com';
  const collectionUrl = `${baseUrl}/collections/${collection.slug}`;
  const description = collection.description || `Shop ${collection.name} collection at thelv8. Discover premium fashion and elevate your style.`;
  
  // Update page metadata dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && collection) {
      // Update title
      document.title = `${collection.name} Collection | thelv8`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description.slice(0, 160));
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description.slice(0, 160);
        document.head.appendChild(meta);
      }
      
      // Update Open Graph tags
      updateMetaTag('property', 'og:title', `${collection.name} Collection`);
      updateMetaTag('property', 'og:description', description.slice(0, 160));
      if (collection.image_url) {
        updateMetaTag('property', 'og:image', collection.image_url);
      }
      updateMetaTag('property', 'og:url', collectionUrl);
      updateMetaTag('property', 'og:type', 'website');
      
      // Update Twitter Card tags
      updateMetaTag('name', 'twitter:title', `${collection.name} Collection`);
      updateMetaTag('name', 'twitter:description', description.slice(0, 160));
      if (collection.image_url) {
        updateMetaTag('name', 'twitter:image', collection.image_url);
      }
      
      // Update canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', collectionUrl);
      } else {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        canonical.setAttribute('href', collectionUrl);
        document.head.appendChild(canonical);
      }
    }
  }, [collection, description, collectionUrl]);
  
  // Helper to update or create meta tags
  function updateMetaTag(attribute: string, attributeValue: string, content: string) {
    let meta = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
    if (meta) {
      meta.setAttribute('content', content);
    } else {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, attributeValue);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    }
  }

  // Build breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Collections', url: `${baseUrl}/collections` },
    { name: collection.name, url: collectionUrl },
  ];

  return (
    <>
      <CollectionSchema
        name={collection.name}
        description={description}
        url={collectionUrl}
        numberOfItems={productCount}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
    </>
  );
}
