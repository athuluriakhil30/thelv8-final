-- Migration: Add RLS policy for users to update payment status on their own orders
-- This allows users to update payment_status and payment_id after successful payment

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can update payment status on own orders" ON orders;

-- Create policy to allow users to update payment-related fields on their own orders
CREATE POLICY "Users can update payment status on own orders" 
ON orders FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
