-- Check if there are any records in best_sellers table
SELECT 
    bs.id,
    bs.product_id,
    bs.display_order,
    bs.is_active,
    p.name as product_name,
    bs.created_at
FROM best_sellers bs
LEFT JOIN products p ON bs.product_id = p.id
ORDER BY bs.display_order;

-- Clear all manual best sellers to use auto-calculation instead
DELETE FROM best_sellers;

-- Verify it's empty
SELECT COUNT(*) FROM best_sellers;
