-- Migration: Fix Settings RLS Policy - Allow Everyone to View Settings
-- Description: The settings table currently only allows admins to view settings,
-- but cart and checkout pages need to read GST and shipping settings as regular users

-- Drop existing view policy
DROP POLICY IF EXISTS "Admins can view settings" ON settings;

-- Create new policy that allows everyone (including anonymous users) to view settings
CREATE POLICY "Anyone can view settings"
ON settings FOR SELECT
TO public
USING (true);

-- Keep admin-only policies for update and insert (already exist, but recreating for clarity)
DROP POLICY IF EXISTS "Admins can update settings" ON settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON settings;

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
