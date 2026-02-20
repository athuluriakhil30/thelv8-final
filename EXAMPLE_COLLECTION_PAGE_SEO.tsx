/**
 * EXAMPLE: Collection Page with SEO Optimization
 * 
 * This is a reference implementation showing how to add SEO features to collection pages.
 * Copy the relevant parts to your actual collection page at: app/collections/[slug]/page.tsx
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { collectionService } from '@/services/collection.service';
import { generateCollectionMetadata } from '@/lib/metadata';
import { CollectionSchema, BreadcrumbSchema } from '@/components/StructuredData';

// Generate dynamic metadata for each collection page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const collection = await collectionService.getCollectionBySlug(params.slug);
    
    if (!collection) {
      return { title: 'Collection Not Found' };
    }
    
    return generateCollectionMetadata({
      title: collection.name,
      description: collection.description || undefined,
      image: collection.image_url || undefined,
      slug: collection.slug,
    });
  } catch (error) {
    return {
      title: 'Collection Not Found',
    };
  }
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  let collection;
  let products;
  
  try {
    collection = await collectionService.getCollectionBySlug(params.slug);
    
    if (!collection) {
      notFound();
    }
    
    products = await collectionService.getCollectionProducts(collection.id);
  } catch (error) {
    notFound();
  }

  // Prepare structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thelv8.com';
  const collectionUrl = `${baseUrl}/collections/${collection.slug}`;
  
  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Collections', url: `${baseUrl}/collections` },
    { name: collection.name, url: collectionUrl },
  ];

  return (
    <>
      {/* Collection Structured Data */}
      <CollectionSchema
        name={collection.name}
        description={collection.description || `Shop ${collection.name} collection at thelv8`}
        url={collectionUrl}
        numberOfItems={products.length}
      />

      {/* Breadcrumb Structured Data */}
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Your existing collection page JSX goes here */}
      <div>
        <h1>{collection.name}</h1>
        {collection.description && <p>{collection.description}</p>}
        {/* Rest of your collection page content */}
      </div>
    </>
  );
}

/**
 * Example of what to add to an existing collection page:
 * 
 * 1. Import the necessary functions and components:
 *    import { generateCollectionMetadata } from '@/lib/metadata';
 *    import { CollectionSchema, BreadcrumbSchema } from '@/components/StructuredData';
 * 
 * 2. Add the generateMetadata function (before the component)
 * 
 * 3. Add the structured data components at the top of your JSX return:
 *    <CollectionSchema {...} />
 *    <BreadcrumbSchema {...} />
 * 
 * That's it! Your collection page will now have:
 * - Rich collection snippets in search results
 * - Breadcrumb navigation in search results
 * - Proper Open Graph tags for social sharing
 * - Twitter Card support
 */
