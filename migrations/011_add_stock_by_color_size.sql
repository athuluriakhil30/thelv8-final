-- Migration: Add stock_by_color_size field for proper color+size inventory tracking
-- This allows tracking stock at the color+size combination level
-- Format: { "blue": { "M": 10, "L": 5 }, "white": { "M": 8, "L": 3 } }

-- Add the new column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_by_color_size JSONB DEFAULT '{}';

-- Add comment to explain the structure
COMMENT ON COLUMN products.stock_by_color_size IS 'Stock tracking per color and size combination. Format: {"color": {"size": quantity}}';

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_products_stock_by_color_size ON products USING gin(stock_by_color_size);

-- Function to calculate total stock from stock_by_color_size
CREATE OR REPLACE FUNCTION calculate_total_stock_from_color_size(color_size_stock JSONB)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER := 0;
  color_key TEXT;
  size_key TEXT;
  color_obj JSONB;
BEGIN
  -- If empty or null, return 0
  IF color_size_stock IS NULL OR color_size_stock = '{}'::jsonb THEN
    RETURN 0;
  END IF;

  -- Loop through each color
  FOR color_key IN SELECT jsonb_object_keys(color_size_stock)
  LOOP
    color_obj := color_size_stock->color_key;
    
    -- Loop through each size in this color
    FOR size_key IN SELECT jsonb_object_keys(color_obj)
    LOOP
      total := total + COALESCE((color_obj->>size_key)::INTEGER, 0);
    END LOOP;
  END LOOP;

  RETURN total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update stock and stock_by_size when stock_by_color_size changes
CREATE OR REPLACE FUNCTION sync_stock_from_color_size()
RETURNS TRIGGER AS $$
DECLARE
  size_key TEXT;
  color_key TEXT;
  size_totals JSONB := '{}'::jsonb;
  size_total INTEGER;
BEGIN
  -- Only sync if stock_by_color_size has data
  IF NEW.stock_by_color_size IS NOT NULL AND NEW.stock_by_color_size != '{}'::jsonb THEN
    
    -- Calculate total stock
    NEW.stock := calculate_total_stock_from_color_size(NEW.stock_by_color_size);
    
    -- Calculate stock_by_size (sum across all colors for each size)
    FOR size_key IN 
      SELECT DISTINCT jsonb_object_keys(color_obj)
      FROM jsonb_each(NEW.stock_by_color_size) AS colors(color_key, color_obj)
    LOOP
      size_total := 0;
      
      -- Sum this size across all colors
      FOR color_key IN SELECT jsonb_object_keys(NEW.stock_by_color_size)
      LOOP
        size_total := size_total + COALESCE(
          ((NEW.stock_by_color_size->color_key)->>size_key)::INTEGER, 
          0
        );
      END LOOP;
      
      size_totals := size_totals || jsonb_build_object(size_key, size_total);
    END LOOP;
    
    NEW.stock_by_size := size_totals;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync stock fields
DROP TRIGGER IF EXISTS sync_stock_trigger ON products;
CREATE TRIGGER sync_stock_trigger
  BEFORE INSERT OR UPDATE OF stock_by_color_size
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_from_color_size();

-- Function to check and deduct stock for color+size combination
CREATE OR REPLACE FUNCTION check_and_deduct_stock_color_size(
  p_product_id UUID,
  p_color TEXT,
  p_size TEXT,
  p_quantity INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
  v_available_stock INTEGER;
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

  -- Check if color exists in stock_by_color_size
  IF v_product.stock_by_color_size IS NULL OR 
     v_product.stock_by_color_size->p_color IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Color not available'
    );
  END IF;

  -- Get available stock for this color+size combination
  v_available_stock := COALESCE(
    ((v_product.stock_by_color_size->p_color)->>p_size)::INTEGER,
    0
  );

  -- Check if enough stock
  IF v_available_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available', v_available_stock,
      'requested', p_quantity
    );
  END IF;

  -- Deduct stock
  v_new_stock_by_color_size := jsonb_set(
    v_product.stock_by_color_size,
    ARRAY[p_color, p_size],
    to_jsonb(v_available_stock - p_quantity)
  );

  -- Update product
  UPDATE products
  SET stock_by_color_size = v_new_stock_by_color_size
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'remaining_stock', v_available_stock - p_quantity
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_total_stock_from_color_size(JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_and_deduct_stock_color_size(UUID, TEXT, TEXT, INTEGER) TO authenticated, service_role;

-- Add helpful comment
COMMENT ON FUNCTION check_and_deduct_stock_color_size IS 'Atomically check and deduct stock for a specific color+size combination';
