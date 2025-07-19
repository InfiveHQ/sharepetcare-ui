-- Fix RLS policies for users table to allow user creation for sharing (ULTRA SAFE VERSION)
-- This allows creating placeholder users for pet sharing

-- Function to safely create policies
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  policy_name TEXT,
  table_name TEXT,
  policy_definition TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = policy_name 
    AND tablename = table_name
  ) THEN
    EXECUTE policy_definition;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create users table policies safely
SELECT create_policy_if_not_exists(
  'Users can view their own profile',
  'users',
  'CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Users can update their own profile',
  'users',
  'CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = auth.uid())'
);

-- Allow inserting users (for sharing functionality)
SELECT create_policy_if_not_exists(
  'Allow user creation for sharing',
  'users',
  'CREATE POLICY "Allow user creation for sharing" ON users FOR INSERT WITH CHECK (true)'
);

-- Clean up the helper function
DROP FUNCTION IF EXISTS create_policy_if_not_exists(TEXT, TEXT, TEXT); 