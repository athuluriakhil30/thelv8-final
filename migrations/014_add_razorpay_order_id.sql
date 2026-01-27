-- Migration: Add razorpay_order_id column for better webhook reconciliation
-- This provides a direct, indexed way to match Razorpay webhooks to orders
-- Eliminates the 3-fallback lookup complexity and improves reliability

-- Add the razorpay_order_id column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- Add index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id 
ON orders(razorpay_order_id) 
WHERE razorpay_order_id IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN orders.razorpay_order_id IS 
'Razorpay order ID returned from Razorpay API. Used for webhook reconciliation and payment tracking.';
