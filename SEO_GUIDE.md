# SEO Optimization Guide for thelv8

This guide explains the SEO optimization files created for your e-commerce website and how to configure them for maximum visibility.

## Files Created

### 1. **app/sitemap.ts** - Dynamic Sitemap Generator
Automatically generates a sitemap with all your website pages:
- Static pages (home, shop, collections, etc.)
- Dynamic product pages (from database)
- Dynamic collection pages (from database)
- Category pages

**Features:**
- Automatically updates hourly (revalidate: 3600 seconds)
- Includes priority and change frequency for better crawling
- Fetches data directly from Supabase

### 2. **app/robots.txt** (app/robots.ts) - Crawler Control
Controls which pages search engines can crawl:
- Allows: Public pages, products, collections
- Disallows: Admin pages, API routes, checkout, user accounts
- Includes sitemap reference

### 3. **public/manifest.json** - PWA Manifest
Enables Progressive Web App features:
- Better mobile experience
- Add to home screen capability
- Improved SEO for mobile searches

### 4. **lib/metadata.ts** - Enhanced Metadata Configuration
Centralized metadata management with:
- Default metadata for all pages
- Helper functions for products and collections
- Open Graph and Twitter Card support
- Rich keyword targeting

### 5. **components/StructuredData.tsx** - Schema.org Structured Data
JSON-LD structured data components for:
- Organization schema (company info)
- Website schema (search functionality)
- Product schema (rich product snippets)
- Breadcrumb schema (navigation)
- Collection schema (category pages)

## Configuration Steps

### 1. Environment Variables
Add to your `.env.local`:

```env
# Your website URL (required for sitemap and structured data)
NEXT_PUBLIC_SITE_URL=https://thelv8.com
```

### 2. Create Required Images

Create the following images in the `public/` folder:

- **favicon.ico** (32x32 px) - Browser tab icon
- **icon-192x192.png** (192x192 px) - PWA icon
- **icon-512x512.png** (512x512 px) - PWA icon
- **apple-touch-icon.png** (180x180 px) - iOS home screen icon
- **og-image.jpg** (1200x630 px) - Social sharing image
- **logo.png** - Your company logo

### 3. Google Search Console Setup

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (website)
3. Verify ownership using one of these methods:
   - HTML file upload
   - Meta tag (add verification code to `lib/metadata.ts`)
   - Google Analytics
4. Submit your sitemap: `https://yourdomain.com/sitemap.xml`

### 4. Add Verification Codes

Update `lib/metadata.ts` with your verification codes:

```typescript
verification: {
  google: 'your-google-verification-code',
  yandex: 'your-yandex-verification-code', // Optional
  bing: 'your-bing-verification-code',     // Optional
},
```

### 5. Update Social Media Links

In `components/StructuredData.tsx`, add your social media profiles:

```typescript
sameAs: [
  'https://www.instagram.com/the_lv8/',
],
```

### 6. Add Structured Data to Product Pages

Update your product page (`app/product/[slug]/page.tsx`):

```typescript
import { ProductSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { generateProductMetadata } from '@/lib/metadata';

// Generate dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await productService.getProductBySlug(params.slug);
  
  return generateProductMetadata({
    title: product.name,
    description: product.description,
    image: product.images[0],
    price: product.price,
    slug: product.slug,
  });
}

// Add in the component return
return (
  <>
    <ProductSchema
      name={product.name}
      description={product.description}
      image={product.images}
      price={product.price}
      availability={product.stock > 0 ? 'InStock' : 'OutOfStock'}
      sku={product.sku}
      url={`${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`}
    />
    <BreadcrumbSchema
      items={[
        { name: 'Home', url: process.env.NEXT_PUBLIC_SITE_URL! },
        { name: 'Shop', url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop` },
        { name: product.category?.name || 'Products', url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop?category=${product.category?.slug}` },
        { name: product.name, url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}` },
      ]}
    />
    {/* Your existing JSX */}
  </>
);
```

### 7. Add Structured Data to Collection Pages

Update your collection page (`app/collections/[slug]/page.tsx`):

```typescript
import { CollectionSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { generateCollectionMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await collectionService.getCollectionBySlug(params.slug);
  
  return generateCollectionMetadata({
    title: collection.name,
    description: collection.description,
    image: collection.image_url,
    slug: collection.slug,
  });
}
```

## SEO Best Practices

### 1. Content Optimization
- **Unique Titles**: Each page should have a unique, descriptive title (50-60 characters)
- **Meta Descriptions**: Write compelling descriptions (150-160 characters)
- **Heading Structure**: Use H1, H2, H3 tags properly
- **Alt Text**: Add descriptive alt text to all images
- **Internal Links**: Link related products and collections

### 2. Technical SEO
- **Mobile-Friendly**: Already optimized with responsive design
- **Fast Loading**: Use Next.js Image optimization
- **HTTPS**: Ensure your site uses HTTPS
- **Clean URLs**: Use descriptive slugs (already implemented)

### 3. Product SEO
- **Unique Descriptions**: Write unique descriptions for each product
- **Quality Images**: Use high-quality, optimized images
- **Reviews**: Add customer reviews (future enhancement)
- **Availability**: Keep stock status updated
- **Pricing**: Keep prices accurate

### 4. Content Marketing
- **Blog Section**: Consider adding a blog for content marketing
- **Product Guides**: Create buying guides
- **Size Guides**: Add size charts
- **FAQ Section**: Already implemented

## Monitoring & Analytics

### Google Analytics (Already Integrated)
Your site already includes Google Analytics tracking via the `GoogleAnalytics` component.

### Google Search Console Monitoring
Check regularly:
- Search performance
- Coverage issues
- Mobile usability
- Core Web Vitals
- Sitemap status

### Key Metrics to Track
1. **Organic Traffic**: Monitor growth over time
2. **Click-Through Rate (CTR)**: Optimize titles/descriptions
3. **Bounce Rate**: Improve user engagement
4. **Page Load Speed**: Keep under 3 seconds
5. **Mobile Performance**: Ensure 90+ mobile score
6. **Conversion Rate**: Track sales from organic traffic

## Testing Tools

### Test Your SEO Setup

1. **Sitemap**: Visit `https://yourdomain.com/sitemap.xml`
2. **Robots.txt**: Visit `https://yourdomain.com/robots.txt`
3. **Structured Data**: Use [Google Rich Results Test](https://search.google.com/test/rich-results)
4. **Mobile-Friendly**: Use [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
5. **Page Speed**: Use [PageSpeed Insights](https://pagespeed.web.dev/)
6. **SEO Audit**: Use [Lighthouse](https://developers.google.com/web/tools/lighthouse) (built into Chrome DevTools)

### Chrome DevTools Lighthouse
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "SEO" category
4. Run audit
5. Fix any issues

## Next Steps

1. ✅ **Set Environment Variable**: Add `NEXT_PUBLIC_SITE_URL`
2. ✅ **Create Images**: Add all required images to `public/`
3. ✅ **Verify Domain**: Set up Google Search Console
4. ✅ **Submit Sitemap**: Submit to Google Search Console
5. ✅ **Add Structured Data**: Update product and collection pages
6. ✅ **Update Social Links**: Add your social media profiles
7. ✅ **Test Everything**: Run all testing tools
8. ⏳ **Monitor Performance**: Check Search Console weekly

## Additional Enhancements (Optional)

### 1. Add Blog for Content Marketing
Create a `/app/blog` directory with article pages.

### 2. Add Customer Reviews
Implement product reviews with schema markup for rich snippets.

### 3. Add FAQ Schema
Add FAQ schema to your FAQ page for rich results.

### 4. Add Local Business Schema
If you have a physical store, add LocalBusiness schema.

### 5. Add Video Content
If you have product videos, add VideoObject schema.

## Common Issues & Solutions

### Sitemap Not Updating
- Clear Next.js cache: `npm run build`
- Check `revalidate` setting in `sitemap.ts`
- Verify Supabase connection

### Structured Data Errors
- Test with [Google Rich Results Test](https://search.google.com/test/rich-results)
- Ensure all required properties are present
- Check JSON-LD syntax

### Pages Not Being Indexed
- Check `robots.txt` isn't blocking
- Verify sitemap is submitted
- Check Google Search Console for coverage issues
- Ensure pages are published and accessible

### Low Rankings
- Optimize content quality
- Build backlinks
- Improve page speed
- Increase engagement metrics
- Add more unique content

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
- [Schema.org Documentation](https://schema.org/)
- [Web.dev SEO Guide](https://web.dev/learn/seo/)
- [Moz Beginner's Guide to SEO](https://moz.com/beginners-guide-to-seo)

---

**Need Help?**
If you encounter any issues with SEO implementation, refer to the Next.js documentation or the resources listed above.
