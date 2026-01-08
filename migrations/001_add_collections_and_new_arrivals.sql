-- Migration: Add Collections and New Arrivals Features
-- Date: 2025-12-25
-- Description: Creates collections table, collection_products junction table, and adds new_arrival flag to products

-- 1. Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create collection_products junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.collection_products (
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (collection_id, product_id)
);

-- 3. Add new_arrival column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS new_arrival BOOLEAN DEFAULT false;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_published ON public.collections(published);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections(featured);
CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id ON public.collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON public.collection_products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON public.products(new_arrival);

-- 5. Enable Row Level Security (RLS) on collections and collection_products
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for collections

-- Anyone can view published collections
CREATE POLICY "Anyone can view published collections" 
ON public.collections FOR SELECT 
USING (published = true);

-- Only admins can insert collections
CREATE POLICY "Admins can insert collections" 
ON public.collections FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only admins can update collections
CREATE POLICY "Admins can update collections" 
ON public.collections FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete collections
CREATE POLICY "Admins can delete collections" 
ON public.collections FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 7. RLS Policies for collection_products

-- Anyone can view collection_products
CREATE POLICY "Anyone can view collection products" 
ON public.collection_products FOR SELECT 
USING (true);

-- Only admins can insert collection_products
CREATE POLICY "Admins can insert collection products" 
ON public.collection_products FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only admins can update collection_products
CREATE POLICY "Admins can update collection products" 
ON public.collection_products FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete collection_products
CREATE POLICY "Admins can delete collection products" 
ON public.collection_products FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 8. Create updated_at trigger for collections
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION update_collections_updated_at();

-- 9. Grant necessary permissions
GRANT SELECT ON public.collections TO anon, authenticated;
GRANT SELECT ON public.collection_products TO anon, authenticated;
GRANT ALL ON public.collections TO authenticated;
GRANT ALL ON public.collection_products TO authenticated;

-- Migration complete!
-- Next steps:
-- 1. Run this migration in your Supabase SQL Editor
-- 2. The collections and new arrivals features are now ready to use
-- 3. Admin can create collections and mark products as new arrivals
-- 4. Users can browse /collections and /new-arrivals pages
