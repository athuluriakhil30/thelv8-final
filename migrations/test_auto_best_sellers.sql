-- Test the auto best sellers function directly
SELECT 
    p.name as product_name,
    abs.*
FROM get_auto_best_sellers(4) abs
LEFT JOIN products p ON p.id = abs.product_id
ORDER BY abs.total_quantity DESC;

-- Also check what orders exist with payment_status = 'paid'
SELECT 
    payment_status,
    status,
    COUNT(*) as count
FROM orders
GROUP BY payment_status, status
ORDER BY payment_status, status;

-- Check which products are actually in paid orders
SELECT 
    oi->>'product_name' AS product_name,
    SUM((oi->>'quantity')::INTEGER) AS total_quantity
FROM orders o,
jsonb_array_elements(o.items) AS oi
WHERE o.status NOT IN ('cancelled', 'refunded')
    AND o.payment_status = 'paid'
GROUP BY oi->>'product_name'
ORDER BY total_quantity DESC
LIMIT 10;
