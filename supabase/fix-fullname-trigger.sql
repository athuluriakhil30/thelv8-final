-- Fix: Update handle_new_user trigger to include full_name from metadata
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test: This will apply to all new signups automatically
-- Existing users: If you have existing users without full_name, run this to update:
-- UPDATE profiles 
-- SET full_name = (
--   SELECT raw_user_meta_data->>'full_name' 
--   FROM auth.users 
--   WHERE auth.users.id = profiles.id
-- )
-- WHERE full_name IS NULL OR full_name = '';
