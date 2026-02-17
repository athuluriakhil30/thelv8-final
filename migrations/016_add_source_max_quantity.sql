-- Migration: Add source_max_quantity to coupon_rules
-- Date: 2026-02-17
-- Description: Adds maximum quantity limit for coupon source conditions to prevent abuse

-- Add source_max_quantity column
ALTER TABLE public.coupon_rules 
ADD COLUMN IF NOT EXISTS source_max_quantity INTEGER;

COMMENT ON COLUMN public.coupon_rules.source_max_quantity IS 'Maximum quantity allowed for source items (NULL = no limit)';

-- Example: For "3 items for ₹500" bundle, you might set source_max_quantity = 3
-- This prevents customers from buying 10 items and getting all for ₹500
