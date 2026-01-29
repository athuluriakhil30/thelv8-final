-- Common SQL Queries for Advanced Coupon Rules System

-- ============================================
-- VIEWING & MONITORING
-- ============================================

-- 1. View all coupons with their rule count
SELECT 
    c.code,
    c.description,
    c.discount_type,
    c.discount_value,
    c.is_active,
    COUNT(cr.id) as rule_count,
    c.used_count,
    c.usage_limit
FROM coupons c
LEFT JOIN coupon_rules cr ON cr.coupon_id = c.id
GROUP BY c.id, c.code, c.description, c.discount_type, c.discount_value, c.is_active, c.used_count, c.usage_limit
ORDER BY c.created_at DESC;

-- 2. View all rules for a specific coupon
SELECT 
    cr.*,
    c.code as coupon_code,
    source_cat.name as source_category_name,
    target_cat.name as target_category_name
FROM coupon_rules cr
JOIN coupons c ON c.id = cr.coupon_id
LEFT JOIN categories source_cat ON source_cat.id = cr.source_category_id
LEFT JOIN categories target_cat ON target_cat.id = cr.target_category_id
WHERE c.code = 'YOUR_COUPON_CODE'
ORDER BY cr.rule_priority DESC;

-- 3. View recent coupon applications
SELECT 
    ca.applied_at,
    c.code as coupon_code,
    cr.rule_name,
    ca.discount_amount,
    ca.original_amount,
    ca.final_amount,
    ca.order_id
FROM coupon_applications ca
JOIN coupons c ON c.id = ca.coupon_id
LEFT JOIN coupon_rules cr ON cr.id = ca.rule_id
ORDER BY ca.applied_at DESC
LIMIT 50;

-- 4. Coupon performance metrics
SELECT 
    c.code,
    c.discount_type,
    COUNT(ca.id) as total_applications,
    SUM(ca.discount_amount) as total_discount_given,
    AVG(ca.discount_amount) as avg_discount,
    MIN(ca.discount_amount) as min_discount,
    MAX(ca.discount_amount) as max_discount
FROM coupons c
LEFT JOIN coupon_applications ca ON ca.coupon_id = c.id
GROUP BY c.id, c.code, c.discount_type
ORDER BY total_discount_given DESC;

-- 5. Rule performance breakdown
SELECT 
    cr.rule_name,
    cr.benefit_type,
    c.code as coupon_code,
    COUNT(ca.id) as times_applied,
    SUM(ca.discount_amount) as total_discount,
    AVG(ca.discount_amount) as avg_discount
FROM coupon_rules cr
JOIN coupons c ON c.id = cr.coupon_id
LEFT JOIN coupon_applications ca ON ca.rule_id = cr.id
GROUP BY cr.id, cr.rule_name, cr.benefit_type, c.code
ORDER BY total_discount DESC;

-- ============================================
-- EXAMPLE RULE INSERTIONS
-- ============================================

-- Example 1: Buy 1 Get 1 Free (T-Shirts)
-- Replace <coupon-id> and <category-id> with your actual IDs
INSERT INTO coupon_rules (
    coupon_id, 
    rule_name, 
    rule_priority,
    source_type, 
    source_category_id, 
    source_min_quantity,
    benefit_type, 
    target_category_id, 
    free_quantity, 
    free_item_selection,
    free_discount_percentage,
    description
) VALUES (
    '<coupon-id>', -- e.g., '41824b04-5fad-4d9c-b272-38265cdae81f'
    'Buy 1 Get 1 Free T-Shirts',
    10,
    'category',
    '<category-id>', -- e.g., '3392e16c-d4e8-4720-b4ee-41b2209578c1'
    1,
    'free_items',
    '<category-id>', -- Same category
    1,
    'cheapest',
    100.00,
    'Buy 1 T-Shirt, Get 1 Free (Cheapest Item)'
);

-- Example 2: Buy 2 from Category, Get 1 New Arrival Free
INSERT INTO coupon_rules (
    coupon_id,
    rule_name,
    rule_priority,
    source_type,
    source_category_id,
    source_min_quantity,
    benefit_type,
    target_new_arrival_required,
    free_quantity,
    free_item_selection,
    free_discount_percentage,
    description
) VALUES (
    '<coupon-id>',
    'Buy 2 Get New Arrival Free',
    10,
    'category',
    '<category-id>',
    2,
    'free_items',
    true,
    1,
    'cheapest',
    100.00,
    'Buy 2 items from category, get 1 new arrival free'
);

-- Example 3: Buy 3 New Arrivals, Get ₹100 Off
INSERT INTO coupon_rules (
    coupon_id,
    rule_name,
    rule_priority,
    source_type,
    source_new_arrival_required,
    source_min_quantity,
    benefit_type,
    discount_amount,
    discount_target_type,
    description
) VALUES (
    '<coupon-id>',
    'New Arrival Bundle Discount',
    10,
    'new_arrival',
    true,
    3,
    'fixed_discount',
    100.00,
    'source',
    'Buy 3 new arrivals, get ₹100 off'
);

-- Example 4: Buy 2 from Category, Get 10% Off
INSERT INTO coupon_rules (
    coupon_id,
    rule_name,
    rule_priority,
    source_type,
    source_category_id,
    source_min_quantity,
    benefit_type,
    discount_percentage,
    discount_target_type,
    description
) VALUES (
    '<coupon-id>',
    'Category 10% Discount',
    10,
    'category',
    '<category-id>',
    2,
    'percentage_discount',
    10.00,
    'source',
    'Buy 2 from category, get 10% off'
);

-- Example 5: Bundle 3 Items for ₹999
INSERT INTO coupon_rules (
    coupon_id,
    rule_name,
    rule_priority,
    source_type,
    source_min_quantity,
    benefit_type,
    bundle_fixed_price,
    description
) VALUES (
    '<coupon-id>',
    'Bundle Deal - 3 for ₹999',
    10,
    'any',
    3,
    'bundle_price',
    999.00,
    'Buy any 3 items for ₹999'
);

-- ============================================
-- MAINTENANCE & CLEANUP
-- ============================================

-- 1. Disable expired rules
UPDATE coupon_rules
SET is_active = false
WHERE coupon_id IN (
    SELECT id FROM coupons 
    WHERE valid_until < NOW() OR is_active = false
);

-- 2. Archive old coupon applications (older than 1 year)
-- Note: Consider creating an archive table first
DELETE FROM coupon_applications
WHERE applied_at < NOW() - INTERVAL '1 year';

-- 3. Find unused coupons (no applications)
SELECT c.*
FROM coupons c
LEFT JOIN coupon_applications ca ON ca.coupon_id = c.id
WHERE ca.id IS NULL
AND c.created_at < NOW() - INTERVAL '3 months';

-- 4. Find rules that never applied
SELECT cr.*, c.code
FROM coupon_rules cr
JOIN coupons c ON c.id = cr.coupon_id
LEFT JOIN coupon_applications ca ON ca.rule_id = cr.id
WHERE ca.id IS NULL
AND cr.created_at < NOW() - INTERVAL '1 month';

-- ============================================
-- ANALYTICS QUERIES
-- ============================================

-- 1. Daily coupon usage
SELECT 
    DATE(applied_at) as date,
    COUNT(*) as applications,
    COUNT(DISTINCT coupon_id) as unique_coupons,
    SUM(discount_amount) as total_discount,
    AVG(discount_amount) as avg_discount
FROM coupon_applications
WHERE applied_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(applied_at)
ORDER BY date DESC;

-- 2. Top performing rules
SELECT 
    cr.rule_name,
    c.code as coupon_code,
    COUNT(*) as applications,
    SUM(ca.discount_amount) as total_savings,
    AVG(ca.discount_amount) as avg_savings
FROM coupon_applications ca
JOIN coupon_rules cr ON cr.id = ca.rule_id
JOIN coupons c ON c.id = ca.coupon_id
GROUP BY cr.rule_name, c.code
ORDER BY total_savings DESC
LIMIT 10;

-- 3. Benefit type effectiveness
SELECT 
    cr.benefit_type,
    COUNT(*) as applications,
    AVG(ca.discount_amount) as avg_discount,
    SUM(ca.discount_amount) as total_discount
FROM coupon_applications ca
JOIN coupon_rules cr ON cr.id = ca.rule_id
GROUP BY cr.benefit_type
ORDER BY total_discount DESC;

-- 4. Category-based coupon performance
SELECT 
    cat.name as category,
    COUNT(DISTINCT cr.coupon_id) as active_coupons,
    COUNT(ca.id) as applications,
    SUM(ca.discount_amount) as total_discount
FROM coupon_rules cr
JOIN categories cat ON cat.id = cr.source_category_id
LEFT JOIN coupon_applications ca ON ca.rule_id = cr.id
WHERE cr.is_active = true
GROUP BY cat.name
ORDER BY total_discount DESC;

-- ============================================
-- DEBUGGING QUERIES
-- ============================================

-- 1. Check coupon rule configuration
SELECT 
    c.code,
    cr.rule_name,
    cr.source_type,
    cr.source_min_quantity,
    cr.benefit_type,
    CASE 
        WHEN cr.benefit_type = 'free_items' THEN 
            CONCAT('Get ', cr.free_quantity, ' free (', cr.free_item_selection, ')')
        WHEN cr.benefit_type = 'fixed_discount' THEN 
            CONCAT('₹', cr.discount_amount, ' off')
        WHEN cr.benefit_type = 'percentage_discount' THEN 
            CONCAT(cr.discount_percentage, '% off')
        WHEN cr.benefit_type = 'bundle_price' THEN 
            CONCAT('Bundle: ₹', cr.bundle_fixed_price)
    END as benefit_description,
    cr.is_active
FROM coupon_rules cr
JOIN coupons c ON c.id = cr.coupon_id
ORDER BY c.code, cr.rule_priority DESC;

-- 2. Find coupons with multiple active rules
SELECT 
    c.code,
    COUNT(cr.id) as active_rule_count,
    STRING_AGG(cr.rule_name, ', ') as rule_names
FROM coupons c
JOIN coupon_rules cr ON cr.coupon_id = c.id
WHERE cr.is_active = true AND c.is_active = true
GROUP BY c.code
HAVING COUNT(cr.id) > 1;

-- 3. Check for conflicting rules (same priority)
SELECT 
    c.code,
    cr.rule_priority,
    COUNT(*) as rules_at_priority,
    STRING_AGG(cr.rule_name, ', ') as conflicting_rules
FROM coupon_rules cr
JOIN coupons c ON c.id = cr.coupon_id
WHERE cr.is_active = true
GROUP BY c.code, cr.rule_priority
HAVING COUNT(*) > 1;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- 1. Get all active coupons with rules
SELECT 
    c.*,
    (
        SELECT json_agg(cr.*)
        FROM coupon_rules cr
        WHERE cr.coupon_id = c.id AND cr.is_active = true
    ) as rules
FROM coupons c
WHERE c.is_active = true
AND c.valid_until > NOW();

-- 2. Simulate rule matching (requires specific cart)
-- Replace values with your test data
SELECT 
    cr.rule_name,
    cr.source_type,
    cr.source_category_id,
    cr.source_min_quantity,
    CASE 
        WHEN cr.source_type = 'category' AND '<test-category-id>' = cr.source_category_id THEN 'MATCH'
        WHEN cr.source_type = 'new_arrival' AND <test-new-arrival-bool> = cr.source_new_arrival_required THEN 'MATCH'
        WHEN cr.source_type = 'any' THEN 'MATCH'
        ELSE 'NO MATCH'
    END as would_match
FROM coupon_rules cr
WHERE cr.coupon_id = '<test-coupon-id>'
AND cr.is_active = true;

-- ============================================
-- RESET & CLEANUP (USE WITH CAUTION)
-- ============================================

-- Delete all rules for a specific coupon
-- DELETE FROM coupon_rules WHERE coupon_id = '<coupon-id>';

-- Delete all applications for a specific coupon
-- DELETE FROM coupon_applications WHERE coupon_id = '<coupon-id>';

-- Reset usage count for a coupon
-- UPDATE coupons SET used_count = 0 WHERE code = 'YOUR_COUPON_CODE';

-- Disable all rules (for testing)
-- UPDATE coupon_rules SET is_active = false;

-- Re-enable all rules
-- UPDATE coupon_rules SET is_active = true;
