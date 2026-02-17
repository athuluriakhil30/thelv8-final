-- Migration: Add Best Sellers Feature
-- Date: 2026-02-17
-- Description: Allows admins to manually select best sellers or auto-calculate from order data

-- 1. Create best_sellers table for manually curated products
CREATE TABLE IF NOT EXISTS public.best_sellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id)
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_best_sellers_product_id ON public.best_sellers(product_id);
CREATE INDEX IF NOT EXISTS idx_best_sellers_active ON public.best_sellers(is_active);
CREATE INDEX IF NOT EXISTS idx_best_sellers_order ON public.best_sellers(display_order ASC);

-- 3. Add RLS policies
ALTER TABLE public.best_sellers ENABLE ROW LEVEL SECURITY;

-- Allow public to read active best sellers
CREATE POLICY "Anyone can view active best sellers"
ON public.best_sellers FOR SELECT
USING (is_active = true);

-- Allow admins to manage best sellers
CREATE POLICY "Admins can manage best sellers"
ON public.best_sellers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 4. Create a function to auto-calculate best sellers from orders
CREATE OR REPLACE FUNCTION get_auto_best_sellers(limit_count INTEGER DEFAULT 8)
RETURNS TABLE (
    product_id UUID,
    total_quantity BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (oi->>'product_id')::UUID AS product_id,
        SUM((oi->>'quantity')::INTEGER) AS total_quantity,
        SUM((oi->>'price')::NUMERIC * (oi->>'quantity')::INTEGER) AS total_revenue
    FROM orders o,
    jsonb_array_elements(o.items) AS oi
    WHERE o.status NOT IN ('cancelled', 'refunded')
        AND o.payment_status = 'paid'
    GROUP BY (oi->>'product_id')::UUID
    ORDER BY total_quantity DESC, total_revenue DESC, product_id ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.best_sellers IS 'Manually curated best seller products displayed on homepage';
COMMENT ON FUNCTION get_auto_best_sellers IS 'Calculates top selling products based on order data';
