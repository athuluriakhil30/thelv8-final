-- Migration: Add display order fields for products
-- Date: 2026-01-27
-- Description: Adds shop_display_order and new_arrival_display_order fields to control product positioning

-- Add display order columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shop_display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS new_arrival_display_order INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_shop_display_order ON products(shop_display_order);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival_display_order ON products(new_arrival_display_order, new_arrival);

-- Add comment for documentation
COMMENT ON COLUMN products.shop_display_order IS 'Controls the display order in shop page. Lower numbers appear first. 0 = default chronological order';
COMMENT ON COLUMN products.new_arrival_display_order IS 'Controls the display order in new arrivals page. Lower numbers appear first. 0 = default chronological order';
