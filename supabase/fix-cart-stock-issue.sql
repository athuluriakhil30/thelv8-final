-- =============================================
-- FIX CART STOCK ISSUE
-- Remove cart items that have insufficient stock
-- =============================================

-- 1. Show cart items with stock issues
SELECT 
    'Cart Items with Stock Issues' as issue_type,
    c.id as cart_item_id,
    c.user_id,
    c.product_id,
    c.selected_size,
    c.quantity as requested_quantity,
    p.name as product_name,
    p.stock as total_stock,
    p.stock_by_size,
    CASE 
        WHEN c.selected_size IS NOT NULL AND c.selected_size != '' THEN
            COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0)
        ELSE
            p.stock
    END as available_stock,
    CASE 
        WHEN c.selected_size IS NOT NULL AND c.selected_size != '' THEN
            CASE 
                WHEN COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) < c.quantity 
                THEN '❌ INSUFFICIENT STOCK'
                ELSE '✅ OK'
            END
        ELSE
            CASE 
                WHEN p.stock < c.quantity 
                THEN '❌ INSUFFICIENT STOCK'
                ELSE '✅ OK'
            END
    END as status
FROM cart c
JOIN products p ON c.product_id = p.id
WHERE 
    -- Check if size-specific stock is insufficient
    (c.selected_size IS NOT NULL AND c.selected_size != '' 
     AND COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) < c.quantity)
    OR
    -- Check if total stock is insufficient (for products without sizes)
    (c.selected_size IS NULL OR c.selected_size = '' 
     AND p.stock < c.quantity);

-- 2. OPTION A: Delete cart items with insufficient stock
-- Uncomment to run:
/*
DELETE FROM cart
WHERE id IN (
    SELECT c.id
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE 
        (c.selected_size IS NOT NULL AND c.selected_size != '' 
         AND COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) < c.quantity)
        OR
        (c.selected_size IS NULL OR c.selected_size = '' 
         AND p.stock < c.quantity)
);
*/

-- 3. OPTION B: Update cart quantities to match available stock
-- Uncomment to run:
/*
UPDATE cart c
SET quantity = CASE 
    WHEN c.selected_size IS NOT NULL AND c.selected_size != '' THEN
        LEAST(c.quantity, COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0))
    ELSE
        LEAST(c.quantity, p.stock)
END
FROM products p
WHERE c.product_id = p.id
AND (
    (c.selected_size IS NOT NULL AND c.selected_size != '' 
     AND COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) < c.quantity)
    OR
    (c.selected_size IS NULL OR c.selected_size = '' 
     AND p.stock < c.quantity)
);
*/

-- 4. Show specific issue with LOCAL BUM PINK
SELECT 
    'LOCAL BUM PINK Cart Items' as info,
    c.id,
    c.user_id,
    c.selected_size,
    c.quantity,
    p.stock_by_size,
    COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) as size_stock
FROM cart c
JOIN products p ON c.product_id = p.id
WHERE p.id = 'd152da78-340f-41a1-8329-f3be8c66f57d';
