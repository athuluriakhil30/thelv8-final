-- Migration: Add function to increase/restore stock for color+size combinations
-- Used for order cancellations, refunds, and rollback scenarios

-- Function to increase stock for color+size combination
CREATE OR REPLACE FUNCTION increase_stock_color_size(
  p_product_id UUID,
  p_color TEXT,
  p_size TEXT,
  p_quantity INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
  v_current_stock INTEGER;
  v_new_stock_by_color_size JSONB;
BEGIN
  -- Get product with row lock
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product not found'
    );
  END IF;

  -- Initialize stock_by_color_size if null
  IF v_product.stock_by_color_size IS NULL THEN
    v_product.stock_by_color_size := '{}'::jsonb;
  END IF;

  -- Get current stock for this color+size combination
  v_current_stock := COALESCE(
    ((v_product.stock_by_color_size->p_color)->>p_size)::INTEGER,
    0
  );

  -- Ensure color exists in the structure
  IF v_product.stock_by_color_size->p_color IS NULL THEN
    v_new_stock_by_color_size := jsonb_set(
      v_product.stock_by_color_size,
      ARRAY[p_color],
      '{}'::jsonb
    );
  ELSE
    v_new_stock_by_color_size := v_product.stock_by_color_size;
  END IF;

  -- Increase stock
  v_new_stock_by_color_size := jsonb_set(
    v_new_stock_by_color_size,
    ARRAY[p_color, p_size],
    to_jsonb(v_current_stock + p_quantity)
  );

  -- Update product
  UPDATE products
  SET stock_by_color_size = v_new_stock_by_color_size
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_stock', v_current_stock + p_quantity,
    'previous_stock', v_current_stock
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increase_stock_color_size(UUID, TEXT, TEXT, INTEGER) TO authenticated, service_role;

-- Add helpful comment
COMMENT ON FUNCTION increase_stock_color_size IS 'Atomically increase stock for a specific color+size combination (for cancellations/refunds)';
