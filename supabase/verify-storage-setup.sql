-- Verification script for Image Upload Feature
-- Run this in Supabase SQL Editor to verify setup

-- 1. Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'products';
-- Expected: One row with id='products', name='products', public=true

-- 2. Check storage policies
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%product%';
-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 3. Test admin permissions (replace with your admin user ID)
-- SELECT auth.uid(); -- Get your user ID first
-- Then check if you're an admin:
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- 4. Verify bucket is public
SELECT public FROM storage.buckets WHERE id = 'products';
-- Expected: true

-- If storage bucket is missing, run this:
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('products', 'products', true)
-- ON CONFLICT (id) DO NOTHING;

-- If policies are missing, run the schema.sql storage section
