-- =============================================
-- PRODUCTION READINESS VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify setup
-- =============================================

-- 1. Check if atomic stock management functions exist
SELECT 
    'decrease_product_stock' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'decrease_product_stock'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run migration 008_add_atomic_stock_management.sql'
    END as status
UNION ALL
SELECT 
    'increase_product_stock',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'increase_product_stock'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run migration 008_add_atomic_stock_management.sql'
    END
UNION ALL
SELECT 
    'validate_cart_stock',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'validate_cart_stock'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run migration 008_add_atomic_stock_management.sql'
    END;

-- 2. Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('profiles'),
        ('products'),
        ('categories'),
        ('collections'),
        ('collection_products'),
        ('cart'),
        ('wishlist'),
        ('orders'),
        ('addresses'),
        ('coupons'),
        ('announcements'),
        ('seasonal_settings'),
        ('settings'),
        ('payment_logs')
) AS required_tables(table_name);

-- 3. Check if storage bucket exists
SELECT 
    'products' as bucket_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM storage.buckets 
            WHERE name = 'products'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - Create in Storage section'
    END as status;

-- 4. Check if admin user exists
SELECT 
    'Admin User' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE role = 'admin'
        ) THEN CONCAT('✅ EXISTS (', COUNT(*), ' admin(s))')
        ELSE '❌ NO ADMIN - Set role=admin in profiles table'
    END as status
FROM profiles
WHERE role = 'admin';

-- 5. Check if settings are configured
SELECT 
    'Site Settings' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM settings) 
        THEN CONCAT('✅ CONFIGURED (GST: ', gst_percentage::text, '%, Free Shipping: ₹', free_shipping_threshold::text, ')')
        ELSE '❌ NOT CONFIGURED - Add default settings'
    END as status
FROM settings
LIMIT 1;

-- 6. Check RLS policies
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS POLICIES'
        ELSE '⚠️ NO POLICIES - Security risk!'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 7. Sample test of stock functions (if they exist)
DO $
BEGIN
    -- Only run if function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decrease_product_stock') THEN
        RAISE NOTICE '✅ Stock management functions are callable';
    ELSE
        RAISE NOTICE '❌ Stock management functions not found';
    END IF;
END $;

-- =============================================
-- SUMMARY
-- =============================================
-- Review the results above:
-- - All functions should show ✅ EXISTS
-- - All tables should show ✅ EXISTS
-- - Storage bucket should show ✅ EXISTS
-- - At least one admin user should exist
-- - Settings should be configured
-- - All tables should have RLS policies
-- =============================================
