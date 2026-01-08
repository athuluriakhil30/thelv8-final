-- =============================================
-- DIAGNOSE CART & ORDER ISSUE
-- Run this to find the problem
-- =============================================

-- 1. Check the specific product that's failing
SELECT 
    'Product Check' as check_type,
    id,
    name,
    stock,
    stock_by_size,
    published,
    CASE 
        WHEN id = 'd152da78-340f-41a1-8329-f3be8c66f57d' THEN '⚠️ THIS IS THE FAILING PRODUCT'
        ELSE '✅ Different product'
    END as status
FROM products
WHERE id = 'd152da78-340f-41a1-8329-f3be8c66f57d';

-- 2. If product not found, check all products
SELECT 
    'All Products' as info,
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE published = true) as published_products,
    COUNT(*) FILTER (WHERE stock > 0) as in_stock_products
FROM products;

-- 3. Check cart items for all users
SELECT 
    'Cart Items' as info,
    c.id as cart_item_id,
    c.product_id,
    c.selected_size,
    c.quantity,
    p.name as product_name,
    p.stock as product_stock,
    p.stock_by_size,
    CASE 
        WHEN p.id IS NULL THEN '❌ PRODUCT NOT FOUND'
        WHEN p.stock < c.quantity THEN '⚠️ INSUFFICIENT STOCK'
        ELSE '✅ OK'
    END as status
FROM cart c
LEFT JOIN products p ON c.product_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 4. Check if the product exists but with different ID format
SELECT 
    'Product ID Format Check' as info,
    id,
    name,
    stock
FROM products
WHERE name ILIKE '%' -- Shows all products
ORDER BY created_at DESC
LIMIT 5;

-- 5. Test the decrease_product_stock function with a real product
DO $
DECLARE
    v_test_product_id UUID;
    v_result RECORD;
BEGIN
    -- Get first available product
    SELECT id INTO v_test_product_id 
    FROM products 
    WHERE stock > 0 
    LIMIT 1;
    
    IF v_test_product_id IS NOT NULL THEN
        -- Test the function (won't actually decrease, just check if it works)
        SELECT * INTO v_result
        FROM decrease_product_stock(v_test_product_id, NULL, 0);
        
        RAISE NOTICE '✅ Function works! Test result: %', v_result;
    ELSE
        RAISE NOTICE '❌ No products with stock > 0 found';
    END IF;
END $;

-- 6. Check for orphaned cart items (products that were deleted)
SELECT 
    'Orphaned Cart Items' as issue,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️ FOUND - These need to be cleaned up'
        ELSE '✅ NONE'
    END as status
FROM cart c
LEFT JOIN products p ON c.product_id = p.id
WHERE p.id IS NULL;

-- 7. Show orphaned cart items details if any
SELECT 
    'Orphaned Cart Details' as info,
    c.id as cart_item_id,
    c.product_id as missing_product_id,
    c.user_id,
    c.created_at
FROM cart c
LEFT JOIN products p ON c.product_id = p.id
WHERE p.id IS NULL;

-- =============================================
-- CLEANUP SCRIPT (Run if orphaned items found)
-- =============================================
-- Uncomment and run this if you have orphaned cart items:
-- DELETE FROM cart 
-- WHERE product_id NOT IN (SELECT id FROM products);
-- =============================================
