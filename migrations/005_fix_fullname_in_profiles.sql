-- Migration: Fix Full Name in Profile
-- Date: 2025-12-27
-- Issue: Full name from signup not being saved to profiles table
-- Solution: Update trigger to copy full_name from auth.users metadata

-- Step 1: Update the trigger function to include full_name
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

-- Step 2: Backfill existing users who are missing full_name
-- This will update all existing profiles with their full_name from auth.users metadata
UPDATE public.profiles 
SET full_name = COALESCE(
  (
    SELECT raw_user_meta_data->>'full_name' 
    FROM auth.users 
    WHERE auth.users.id = profiles.id
  ),
  full_name,
  ''
)
WHERE full_name IS NULL OR full_name = '';

-- Step 3: Verify the fix
-- Run this to check if profiles now have full_name:
-- SELECT id, email, full_name, role FROM public.profiles LIMIT 10;

-- Step 4: Test with new signup
-- Create a test user and verify full_name appears in profiles table
