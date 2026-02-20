/**
 * EXAMPLE: Product Page with SEO Optimization
 * 
 * This is a reference implementation showing how to add SEO features to product pages.
 * Copy the relevant parts to your actual product page at: app/product/[slug]/page.tsx
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productService } from '@/services/product.service';
import { generateProductMetadata } from '@/lib/metadata';
import { ProductSchema, BreadcrumbSchema } from '@/components/StructuredData';

// Generate dynamic metadata for each product page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const product = await productService.getProductBySlug(params.slug);
    
    return generateProductMetadata({
      title: product.name,
      description: product.description,
      image: product.images[0] || '',
      price: product.price,
      slug: product.slug,
    });
  } catch (error) {
    return {
      title: 'Product Not Found',
    };
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  let product;
  
  try {
    product = await productService.getProductBySlug(params.slug);
  } catch (error) {
    notFound();
  }

  // Prepare structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com';
  const productUrl = `${baseUrl}/product/${product.slug}`;
  
  // Determine availability status
  const availability = product.stock > 0 ? 'InStock' as const : 'OutOfStock' as const;
  
  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Shop', url: `${baseUrl}/shop` },
  ];
  
  // Add category to breadcrumb if exists
  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `${baseUrl}/shop?category=${product.category.slug}`,
    });
  }
  
  // Add current product
  breadcrumbItems.push({
    name: product.name,
    url: productUrl,
  });

  return (
    <>
      {/* Product Structured Data */}
      <ProductSchema
        name={product.name}
        description={product.description}
        image={product.images}
        price={product.price}
        availability={availability}
        sku={product.sku}
        url={productUrl}
      />

      {/* Breadcrumb Structured Data */}
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Your existing product page JSX goes here */}
      <div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        {/* Rest of your product page content */}
      </div>
    </>
  );
}

/**
 * Example of what to add to an existing product page:
 * 
 * 1. Import the necessary functions and components:
 *    import { generateProductMetadata } from '@/lib/metadata';
 *    import { ProductSchema, BreadcrumbSchema } from '@/components/StructuredData';
 * 
 * 2. Add the generateMetadata function (before the component)
 * 
 * 3. Add the structured data components at the top of your JSX return:
 *    <ProductSchema {...} />
 *    <BreadcrumbSchema {...} />
 * 
 * That's it! Your product page will now have:
 * - Rich product snippets in search results
 * - Breadcrumb navigation in search results
 * - Proper Open Graph tags for social sharing
 * - Twitter Card support
 */
