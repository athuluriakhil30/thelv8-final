-- Fix: Update get_auto_best_sellers function
-- Date: 2026-02-17
-- Description: Fix type casting for product_id and remove product_name

DROP FUNCTION IF EXISTS get_auto_best_sellers(INTEGER);

CREATE OR REPLACE FUNCTION get_auto_best_sellers(limit_count INTEGER DEFAULT 8)
RETURNS TABLE (
    product_id UUID,
    total_quantity BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (oi->>'product_id')::UUID AS product_id,
        SUM((oi->>'quantity')::INTEGER) AS total_quantity,
        SUM((oi->>'price')::NUMERIC * (oi->>'quantity')::INTEGER) AS total_revenue
    FROM orders o,
    jsonb_array_elements(o.items) AS oi
    WHERE o.status NOT IN ('cancelled', 'refunded')
        AND o.payment_status = 'paid'
    GROUP BY (oi->>'product_id')::UUID
    ORDER BY total_quantity DESC, total_revenue DESC, product_id ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_auto_best_sellers IS 'Calculates top selling products based on order data';
