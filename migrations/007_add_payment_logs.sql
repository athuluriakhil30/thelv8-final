-- Migration: Add Payment Logs Table
-- Date: 2025-12-27
-- Description: Creates payment_logs table for Razorpay webhook event tracking and payment reconciliation

-- 1. Create payment_logs table
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id TEXT NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT,
    error_code TEXT,
    error_description TEXT,
    webhook_signature TEXT,
    webhook_payload JSONB NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON public.payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_razorpay_order_id ON public.payment_logs(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON public.payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON public.payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON public.payment_logs(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for payment_logs

-- Only admins can view payment logs
CREATE POLICY "Admins can view payment logs" 
ON public.payment_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- System can insert payment logs (no auth required for webhooks)
CREATE POLICY "System can insert payment logs" 
ON public.payment_logs FOR INSERT 
WITH CHECK (true);

-- Only admins can update payment logs
CREATE POLICY "Admins can update payment logs" 
ON public.payment_logs FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete payment logs
CREATE POLICY "Admins can delete payment logs" 
ON public.payment_logs FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Grant necessary permissions
GRANT SELECT ON public.payment_logs TO authenticated;
GRANT INSERT ON public.payment_logs TO anon, authenticated;
GRANT UPDATE, DELETE ON public.payment_logs TO authenticated;

-- 6. Add comment to table
COMMENT ON TABLE public.payment_logs IS 'Stores all payment events from Razorpay webhooks for reconciliation and audit trail';

-- Migration complete!
-- Next steps:
-- 1. Run this migration in your Supabase SQL Editor
-- 2. Configure Razorpay webhook URL in Razorpay Dashboard
-- 3. Add RAZORPAY_WEBHOOK_SECRET to environment variables
-- 4. Test webhook with Razorpay test events
