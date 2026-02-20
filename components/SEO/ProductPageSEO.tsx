'use client';

import { useEffect } from 'react';
import { ProductSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { Product } from '@/types';

interface ProductPageSEOProps {
  product: Product;
}

/**
 * Modular SEO Component for Product Pages
 * Adds structured data without modifying core functionality
 */
export function ProductPageSEO({ product }: ProductPageSEOProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com';
  const productUrl = `${baseUrl}/product/${product.id}`;
  
  // Update page metadata dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && product) {
      // Update title
      document.title = `${product.name} | thelv8`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', product.description.slice(0, 160));
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = product.description.slice(0, 160);
        document.head.appendChild(meta);
      }
      
      // Update Open Graph tags
      updateMetaTag('property', 'og:title', product.name);
      updateMetaTag('property', 'og:description', product.description.slice(0, 160));
      updateMetaTag('property', 'og:image', product.images[0] || '');
      updateMetaTag('property', 'og:url', productUrl);
      updateMetaTag('property', 'og:type', 'product');
      
      // Update Twitter Card tags
      updateMetaTag('name', 'twitter:title', product.name);
      updateMetaTag('name', 'twitter:description', product.description.slice(0, 160));
      updateMetaTag('name', 'twitter:image', product.images[0] || '');
      
      // Update canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', productUrl);
      } else {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        canonical.setAttribute('href', productUrl);
        document.head.appendChild(canonical);
      }
    }
  }, [product, productUrl]);
  
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

  // Determine stock availability
  const availability = product.stock > 0 ? 'InStock' as const : 'OutOfStock' as const;
  
  // Build breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Shop', url: `${baseUrl}/shop` },
  ];
  
  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `${baseUrl}/shop?category=${product.category.slug}`,
    });
  }
  
  breadcrumbItems.push({
    name: product.name,
    url: productUrl,
  });

  return (
    <>
      <ProductSchema
        name={product.name}
        description={product.description}
        image={product.images}
        price={product.price}
        availability={availability}
        sku={product.sku}
        url={productUrl}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
    </>
  );
}
