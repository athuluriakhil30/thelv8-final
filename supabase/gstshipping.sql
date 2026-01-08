-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  shipping_charge DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  free_shipping_threshold DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (gst_percentage, shipping_charge, free_shipping_threshold)
VALUES (18.00, 50.00, 500.00)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and update settings
CREATE POLICY "Admins can view settings"
ON settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id::uuid = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update settings"
ON settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id::uuid = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert settings"
ON settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id::uuid = auth.uid()
    AND profiles.role = 'admin'
  )
);