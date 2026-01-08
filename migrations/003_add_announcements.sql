-- Migration: Add Announcements/Popup System
-- Date: 2025-12-26
-- Description: Creates announcements table for managing site-wide popups and notifications

-- 1. Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    image_url TEXT,
    button_text TEXT DEFAULT 'Got it',
    button_link TEXT,
    is_active BOOLEAN DEFAULT false,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_valid_dates ON public.announcements(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for announcements

-- Anyone can view active announcements within valid date range
CREATE POLICY "Anyone can view active announcements" 
ON public.announcements FOR SELECT 
USING (
  is_active = true 
  AND valid_from <= NOW() 
  AND (valid_until IS NULL OR valid_until >= NOW())
);

-- Only admins can insert announcements
CREATE POLICY "Admins can insert announcements" 
ON public.announcements FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only admins can update announcements
CREATE POLICY "Admins can update announcements" 
ON public.announcements FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete announcements
CREATE POLICY "Admins can delete announcements" 
ON public.announcements FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Admins can view all announcements (including inactive ones)
CREATE POLICY "Admins can view all announcements" 
ON public.announcements FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- 7. Insert sample announcement (optional - can be removed)
-- INSERT INTO public.announcements (
--   title, 
--   description, 
--   content,
--   button_text,
--   is_active,
--   valid_from,
--   valid_until
-- ) VALUES (
--   '🎉 Welcome to thelv8!',
--   'Get 20% off on your first order',
--   'Use code WELCOME20 at checkout to get 20% discount on your first purchase. Valid for all products.',
--   'Shop Now',
--   false,  -- Set to true to activate
--   NOW(),
--   NOW() + INTERVAL '30 days'
-- );
