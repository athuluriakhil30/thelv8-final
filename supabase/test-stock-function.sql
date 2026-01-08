-- =============================================
-- TEST STOCK MANAGEMENT FUNCTION
-- =============================================

-- Test 1: Check the actual product
SELECT 
    'Product Info' as test,
    id,
    name,
    stock,
    stock_by_size
FROM products
WHERE id = 'd152da78-340f-41a1-8329-f3be8c66f57d';

-- Test 2: Try to decrease stock for size M (which has 0 stock)
SELECT * FROM decrease_product_stock(
    'd152da78-340f-41a1-8329-f3be8c66f57d'::UUID,
    'M',
    1
);

-- Test 3: Try to decrease stock for size L (which has 1 stock)
SELECT * FROM decrease_product_stock(
    'd152da78-340f-41a1-8329-f3be8c66f57d'::UUID,
    'L',
    1
);

-- Test 4: Try with NULL size
SELECT * FROM decrease_product_stock(
    'd152da78-340f-41a1-8329-f3be8c66f57d'::UUID,
    NULL,
    1
);

-- Test 5: Try with empty string size
SELECT * FROM decrease_product_stock(
    'd152da78-340f-41a1-8329-f3be8c66f57d'::UUID,
    '',
    1
);

-- Test 6: Check what's in the cart for this product
SELECT 
    'Cart Items' as info,
    c.id,
    c.product_id,
    c.selected_size,
    c.quantity,
    p.name,
    p.stock,
    p.stock_by_size
FROM cart c
JOIN products p ON c.product_id = p.id
WHERE c.product_id = 'd152da78-340f-41a1-8329-f3be8c66f57d';
