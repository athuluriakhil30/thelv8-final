-- Migration: Add per-size stock management
-- Date: December 25, 2025

-- Add stock_by_size column to products table
ALTER TABLE products 
ADD COLUMN stock_by_size JSONB DEFAULT '{}';

-- Update the column comment
COMMENT ON COLUMN products.stock_by_size IS 'Stock quantity per size: {"S": 10, "M": 15, "L": 20, "XL": 5}';

-- Keep the existing stock column for backward compatibility and total count
-- The stock column will now represent the total stock across all sizes
