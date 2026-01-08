-- Migration: Add Seasonal Animation Settings
-- Date: 2025-12-26
-- Description: Creates seasonal_settings table for managing season-based animations

-- 1. Create seasonal_settings table
CREATE TABLE IF NOT EXISTS public.seasonal_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    season TEXT NOT NULL CHECK (season IN ('winter', 'spring', 'summer', 'autumn')),
    is_active BOOLEAN DEFAULT false,
    animation_type TEXT NOT NULL CHECK (animation_type IN ('snow', 'rain', 'leaves', 'petals', 'stars', 'none')),
    animation_intensity TEXT DEFAULT 'medium' CHECK (animation_intensity IN ('light', 'medium', 'heavy')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(season)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seasonal_settings_is_active ON public.seasonal_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_seasonal_settings_season ON public.seasonal_settings(season);
CREATE INDEX IF NOT EXISTS idx_seasonal_settings_dates ON public.seasonal_settings(start_date, end_date);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.seasonal_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for seasonal_settings

-- Anyone can view active seasonal settings
CREATE POLICY "Anyone can view seasonal settings" 
ON public.seasonal_settings FOR SELECT 
USING (true);

-- Only admins can insert seasonal settings
CREATE POLICY "Admins can insert seasonal settings" 
ON public.seasonal_settings FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only admins can update seasonal settings
CREATE POLICY "Admins can update seasonal settings" 
ON public.seasonal_settings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete seasonal settings
CREATE POLICY "Admins can delete seasonal settings" 
ON public.seasonal_settings FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_seasonal_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_seasonal_settings_updated_at
  BEFORE UPDATE ON public.seasonal_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_seasonal_settings_updated_at();

-- 7. Insert default seasonal settings
INSERT INTO public.seasonal_settings (season, animation_type, animation_intensity, is_active, start_date, end_date) VALUES
  ('winter', 'snow', 'medium', true, '2025-12-01', '2026-02-28'),
  ('spring', 'petals', 'light', false, '2026-03-01', '2026-05-31'),
  ('summer', 'none', 'light', false, '2026-06-01', '2026-08-31'),
  ('autumn', 'leaves', 'medium', false, '2026-09-01', '2026-11-30')
ON CONFLICT (season) DO NOTHING;
