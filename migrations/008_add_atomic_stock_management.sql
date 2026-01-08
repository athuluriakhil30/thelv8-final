-- Migration: Atomic Stock Management
-- Date: 2025-12-27
-- Description: Adds database functions for atomic stock updates to prevent race conditions and overselling

-- 1. Function to atomically decrease product stock
CREATE OR REPLACE FUNCTION decrease_product_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    current_stock INTEGER,
    message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_total_stock INTEGER;
    v_current_size_stock INTEGER;
    v_stock_by_size JSONB;
    v_new_stock_by_size JSONB;
BEGIN
    -- Lock the product row for update (prevents concurrent modifications)
    SELECT stock, stock_by_size INTO v_current_total_stock, v_stock_by_size
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    -- Check if product exists
    IF v_current_total_stock IS NULL THEN
        RETURN QUERY SELECT false, 0, 'Product not found';
        RETURN;
    END IF;

    -- Handle stock-by-size logic
    IF p_size IS NOT NULL AND p_size != '' AND v_stock_by_size IS NOT NULL THEN
        -- Get current stock for the specific size
        v_current_size_stock := COALESCE((v_stock_by_size->>p_size)::INTEGER, 0);
        
        -- Check if enough stock for the size
        IF v_current_size_stock < p_quantity THEN
            RETURN QUERY SELECT false, v_current_size_stock, 
                CONCAT('Insufficient stock for size ', p_size, '. Available: ', v_current_size_stock);
            RETURN;
        END IF;

        -- Atomically update stock for the size
        v_new_stock_by_size := jsonb_set(
            v_stock_by_size,
            ARRAY[p_size],
            to_jsonb(v_current_size_stock - p_quantity)
        );

        -- Update both stock_by_size and total stock
        UPDATE products
        SET stock_by_size = v_new_stock_by_size,
            stock = stock - p_quantity,
            updated_at = NOW()
        WHERE id = p_product_id;

        RETURN QUERY SELECT true, v_current_size_stock - p_quantity, 
            CONCAT('Stock decreased successfully for size ', p_size);
    ELSE
        -- Handle products without size variants (use total stock only)
        IF v_current_total_stock < p_quantity THEN
            RETURN QUERY SELECT false, v_current_total_stock, 
                CONCAT('Insufficient stock. Available: ', v_current_total_stock);
            RETURN;
        END IF;

        -- Atomically update total stock
        UPDATE products
        SET stock = stock - p_quantity,
            updated_at = NOW()
        WHERE id = p_product_id;

        RETURN QUERY SELECT true, v_current_total_stock - p_quantity, 
            'Stock decreased successfully';
    END IF;
END;
$$;

-- 2. Function to atomically increase product stock (for cancellations/returns)
CREATE OR REPLACE FUNCTION increase_product_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    current_stock INTEGER,
    message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_total_stock INTEGER;
    v_current_size_stock INTEGER;
    v_stock_by_size JSONB;
    v_new_stock_by_size JSONB;
BEGIN
    -- Lock the product row for update
    SELECT stock, stock_by_size INTO v_current_total_stock, v_stock_by_size
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF v_current_total_stock IS NULL THEN
        RETURN QUERY SELECT false, 0, 'Product not found';
        RETURN;
    END IF;

    -- Handle stock-by-size logic
    IF p_size IS NOT NULL AND p_size != '' AND v_stock_by_size IS NOT NULL THEN
        v_current_size_stock := COALESCE((v_stock_by_size->>p_size)::INTEGER, 0);

        v_new_stock_by_size := jsonb_set(
            v_stock_by_size,
            ARRAY[p_size],
            to_jsonb(v_current_size_stock + p_quantity)
        );

        UPDATE products
        SET stock_by_size = v_new_stock_by_size,
            stock = stock + p_quantity,
            updated_at = NOW()
        WHERE id = p_product_id;

        RETURN QUERY SELECT true, v_current_size_stock + p_quantity,
            CONCAT('Stock increased successfully for size ', p_size);
    ELSE
        UPDATE products
        SET stock = stock + p_quantity,
            updated_at = NOW()
        WHERE id = p_product_id;

        RETURN QUERY SELECT true, v_current_total_stock + p_quantity,
            'Stock increased successfully';
    END IF;
END;
$$;

-- 3. Function to validate cart items have sufficient stock
CREATE OR REPLACE FUNCTION validate_cart_stock(
    p_cart_items JSONB
)
RETURNS TABLE (
    valid BOOLEAN,
    out_of_stock_items JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_item JSONB;
    v_product_id UUID;
    v_size TEXT;
    v_quantity INTEGER;
    v_current_stock INTEGER;
    v_stock_by_size JSONB;
    v_out_of_stock JSONB := '[]'::JSONB;
    v_is_valid BOOLEAN := true;
BEGIN
    -- Iterate through each cart item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_size := v_item->>'selected_size';
        v_quantity := (v_item->>'quantity')::INTEGER;

        -- Get current stock
        SELECT stock, stock_by_size INTO v_current_stock, v_stock_by_size
        FROM products
        WHERE id = v_product_id;

        -- Check stock availability
        IF v_size IS NOT NULL AND v_size != '' AND v_stock_by_size IS NOT NULL THEN
            -- Check size-specific stock
            v_current_stock := COALESCE((v_stock_by_size->>v_size)::INTEGER, 0);
            
            IF v_current_stock < v_quantity THEN
                v_is_valid := false;
                v_out_of_stock := v_out_of_stock || jsonb_build_object(
                    'product_id', v_product_id,
                    'size', v_size,
                    'requested', v_quantity,
                    'available', v_current_stock
                );
            END IF;
        ELSE
            -- Check total stock
            IF v_current_stock < v_quantity THEN
                v_is_valid := false;
                v_out_of_stock := v_out_of_stock || jsonb_build_object(
                    'product_id', v_product_id,
                    'requested', v_quantity,
                    'available', v_current_stock
                );
            END IF;
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_is_valid, v_out_of_stock;
END;
$$;

-- 4. Add index for faster stock lookups if not exists
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock) WHERE stock > 0;
CREATE INDEX IF NOT EXISTS idx_products_published_stock ON products(published, stock) WHERE published = true;

-- 5. Add comment to document the functions
COMMENT ON FUNCTION decrease_product_stock IS 'Atomically decreases product stock with row-level locking to prevent race conditions';
COMMENT ON FUNCTION increase_product_stock IS 'Atomically increases product stock for cancellations/returns';
COMMENT ON FUNCTION validate_cart_stock IS 'Validates that all cart items have sufficient stock before order creation';

-- Migration complete!
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Update product.service.ts to use these functions
-- 3. Update order.service.ts to validate stock before creating orders
-- 4. Test with concurrent order attempts
