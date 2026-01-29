-- Migration: Add Advanced Coupon Rules System
-- Date: 2026-01-29
-- Description: Extends coupon system with advanced rule-based discounts (Buy X Get Y, Category-based, New Arrival-based)
-- Backward Compatible: Existing coupons continue to work as before

-- ============================================
-- COUPON RULE TABLES
-- ============================================

-- 1. Add optional rule configuration to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS allow_stacking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_applications_per_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

COMMENT ON COLUMN public.coupons.allow_stacking IS 'Whether this coupon can be stacked with other coupons';
COMMENT ON COLUMN public.coupons.max_applications_per_order IS 'How many times this coupon can apply in a single order';
COMMENT ON COLUMN public.coupons.priority IS 'Priority for coupon evaluation (higher = evaluated first)';

-- 2. Create coupon_rules table for advanced rule definitions
CREATE TABLE IF NOT EXISTS public.coupon_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    rule_priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- SOURCE CONDITIONS (What customer must buy)
    source_type TEXT NOT NULL CHECK (source_type IN ('category', 'new_arrival', 'category_new_arrival', 'any')),
    source_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    source_new_arrival_required BOOLEAN,
    source_min_quantity INTEGER NOT NULL DEFAULT 1,
    source_min_amount NUMERIC(10, 2) DEFAULT 0,
    
    -- TARGET BENEFIT (What discount they receive)
    benefit_type TEXT NOT NULL CHECK (benefit_type IN ('free_items', 'fixed_discount', 'percentage_discount', 'bundle_price')),
    
    -- For free_items benefit
    target_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    target_new_arrival_required BOOLEAN,
    free_quantity INTEGER DEFAULT 1,
    free_item_selection TEXT DEFAULT 'cheapest' CHECK (free_item_selection IN ('cheapest', 'most_expensive', 'customer_choice')),
    free_discount_percentage NUMERIC(5, 2) DEFAULT 100.00,
    
    -- For discount benefits
    discount_amount NUMERIC(10, 2),
    discount_percentage NUMERIC(5, 2),
    discount_target_type TEXT DEFAULT 'source' CHECK (discount_target_type IN ('source', 'target', 'cart')),
    discount_target_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    discount_target_new_arrival BOOLEAN,
    
    -- For bundle pricing
    bundle_fixed_price NUMERIC(10, 2),
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_rules_coupon_id ON public.coupon_rules(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_rules_source_category ON public.coupon_rules(source_category_id);
CREATE INDEX IF NOT EXISTS idx_coupon_rules_target_category ON public.coupon_rules(target_category_id);
CREATE INDEX IF NOT EXISTS idx_coupon_rules_active ON public.coupon_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_rules_priority ON public.coupon_rules(rule_priority DESC);

-- 4. Create coupon_applications tracking table (for usage analytics)
CREATE TABLE IF NOT EXISTS public.coupon_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    order_id UUID,
    user_id UUID,
    rule_id UUID REFERENCES public.coupon_rules(id) ON DELETE SET NULL,
    
    -- Applied discount details
    discount_amount NUMERIC(10, 2) NOT NULL,
    original_amount NUMERIC(10, 2) NOT NULL,
    final_amount NUMERIC(10, 2) NOT NULL,
    
    -- Rule application details
    source_items JSONB, -- Array of product IDs that satisfied source condition
    target_items JSONB, -- Array of product IDs that received benefit
    rule_description TEXT,
    
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_applications_coupon_id ON public.coupon_applications(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_applications_order_id ON public.coupon_applications(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_applications_user_id ON public.coupon_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_applications_applied_at ON public.coupon_applications(applied_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.coupon_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_applications ENABLE ROW LEVEL SECURITY;

-- Coupon Rules Policies
CREATE POLICY "Anyone can view active coupon rules"
ON public.coupon_rules FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage coupon rules"
ON public.coupon_rules FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Coupon Applications Policies
CREATE POLICY "Users can view their own coupon applications"
ON public.coupon_applications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all coupon applications"
ON public.coupon_applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "System can insert coupon applications"
ON public.coupon_applications FOR INSERT
WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coupon_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for coupon_rules updated_at
DROP TRIGGER IF EXISTS update_coupon_rules_updated_at_trigger ON public.coupon_rules;
CREATE TRIGGER update_coupon_rules_updated_at_trigger
    BEFORE UPDATE ON public.coupon_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_coupon_rules_updated_at();

-- ============================================
-- EXAMPLE DATA (COMMENTED OUT)
-- ============================================

-- Example 1: Buy 1 Get 1 Free from same category
-- INSERT INTO public.coupon_rules (
--     coupon_id, rule_name, source_type, source_category_id, source_min_quantity,
--     benefit_type, target_category_id, free_quantity, free_item_selection,
--     description
-- ) VALUES (
--     '<coupon-uuid>', 'Buy 1 Get 1 Free T-Shirts', 'category', '<tshirts-category-uuid>', 1,
--     'free_items', '<tshirts-category-uuid>', 1, 'cheapest',
--     'Buy 1 T-Shirt, Get 1 Free (cheapest item)'
-- );

-- Example 2: Buy 2 from category, get 1 free from new arrivals
-- INSERT INTO public.coupon_rules (
--     coupon_id, rule_name, source_type, source_category_id, source_min_quantity,
--     benefit_type, target_new_arrival_required, free_quantity, free_item_selection,
--     description
-- ) VALUES (
--     '<coupon-uuid>', 'Buy 2 Get New Arrival Free', 'category', '<category-uuid>', 2,
--     'free_items', true, 1, 'cheapest',
--     'Buy 2 items from category, get 1 new arrival free'
-- );

-- Example 3: Buy 3 new arrivals, get ₹100 off
-- INSERT INTO public.coupon_rules (
--     coupon_id, rule_name, source_type, source_new_arrival_required, source_min_quantity,
--     benefit_type, discount_amount, discount_target_type,
--     description
-- ) VALUES (
--     '<coupon-uuid>', 'New Arrival Discount', 'new_arrival', true, 3,
--     'fixed_discount', 100.00, 'source',
--     'Buy 3 new arrivals, get ₹100 off'
-- );

COMMENT ON TABLE public.coupon_rules IS 'Advanced coupon rules for Buy X Get Y, category-based, and new arrival-based discounts';
COMMENT ON TABLE public.coupon_applications IS 'Tracks coupon usage and applied rules for analytics';
