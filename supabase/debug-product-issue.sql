-- =============================================
-- DEBUG PRODUCT NOT FOUND ISSUE
-- =============================================

-- 1. Check if the product exists
SELECT 
    'Product Exists?' as check_type,
    id,
    name,
    stock,
    stock_by_size,
    published
FROM products
WHERE id = '5b0411e3-2750-47bf-a476-bfe7942402d1';

-- 2. Test the function directly
SELECT * FROM decrease_product_stock(
    '5b0411e3-2750-47bf-a476-bfe7942402d1'::UUID,
    'M',
    1
);

-- 3. Test with size L
SELECT * FROM decrease_product_stock(
    '5b0411e3-2750-47bf-a476-bfe7942402d1'::UUID,
    'L',
    2
);

-- 4. Check cart items
SELECT 
    c.id,
    c.product_id,
    c.selected_size,
    c.quantity,
    p.name,
    p.stock_by_size
FROM cart c
LEFT JOIN products p ON c.product_id = p.id
WHERE c.product_id = '5b0411e3-2750-47bf-a476-bfe7942402d1';

-- 5. Check if there's a type mismatch
SELECT 
    'Type Check' as info,
    pg_typeof(id) as id_type,
    id::text as id_as_text
FROM products
WHERE id = '5b0411e3-2750-47bf-a476-bfe7942402d1';

-- 6. Try calling function with explicit cast
SELECT * FROM decrease_product_stock(
    CAST('5b0411e3-2750-47bf-a476-bfe7942402d1' AS UUID),
    'M',
    1
);

-- 7. Check if function can see the product at all
DO $$
DECLARE
    v_stock INTEGER;
    v_stock_by_size JSONB;
BEGIN
    SELECT stock, stock_by_size INTO v_stock, v_stock_by_size
    FROM products
    WHERE id = '5b0411e3-2750-47bf-a476-bfe7942402d1';
    
    IF v_stock IS NULL THEN
        RAISE NOTICE '❌ Product NOT found in function context';
    ELSE
        RAISE NOTICE '✅ Product found! Stock: %, Stock by size: %', v_stock, v_stock_by_size;
    END IF;
END $$;
