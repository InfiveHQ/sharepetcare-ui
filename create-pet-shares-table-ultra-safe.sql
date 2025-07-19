-- Create pet_shares table for sharing pets between users (ULTRA SAFE VERSION)
-- Only creates if it doesn't exist
CREATE TABLE IF NOT EXISTS pet_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_with_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view_and_log' CHECK (permission IN ('view_only', 'view_and_log', 'full_access')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pet_id, shared_with_id) -- Prevent duplicate shares
);

-- Add RLS policies for pet_shares (only if not exists)
ALTER TABLE pet_shares ENABLE ROW LEVEL SECURITY;

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

-- Create pet_shares policies safely
SELECT create_policy_if_not_exists(
  'Pet owners can view their pet shares',
  'pet_shares',
  'CREATE POLICY "Pet owners can view their pet shares" ON pet_shares FOR SELECT USING (owner_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Pet owners can insert pet shares',
  'pet_shares',
  'CREATE POLICY "Pet owners can insert pet shares" ON pet_shares FOR INSERT WITH CHECK (owner_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Pet owners can update their pet shares',
  'pet_shares',
  'CREATE POLICY "Pet owners can update their pet shares" ON pet_shares FOR UPDATE USING (owner_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Pet owners can delete their pet shares',
  'pet_shares',
  'CREATE POLICY "Pet owners can delete their pet shares" ON pet_shares FOR DELETE USING (owner_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Shared users can view pet shares they are part of',
  'pet_shares',
  'CREATE POLICY "Shared users can view pet shares they are part of" ON pet_shares FOR SELECT USING (shared_with_id = auth.uid())'
);

-- Update pets table RLS to allow shared access (SAFE - only add if not exists)
SELECT create_policy_if_not_exists(
  'Users can view their own pets or shared pets',
  'pets',
  'CREATE POLICY "Users can view their own pets or shared pets" ON pets FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT pet_id FROM pet_shares WHERE shared_with_id = auth.uid()
    )
  )'
);

-- Only create other pet policies if they don''t exist
SELECT create_policy_if_not_exists(
  'Users can insert their own pets',
  'pets',
  'CREATE POLICY "Users can insert their own pets" ON pets FOR INSERT WITH CHECK (owner_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Users can update their own pets',
  'pets',
  'CREATE POLICY "Users can update their own pets" ON pets FOR UPDATE USING (owner_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own pets',
  'pets',
  'CREATE POLICY "Users can delete their own pets" ON pets FOR DELETE USING (owner_id = auth.uid())'
);

-- Update task_logs table RLS to allow shared access (SAFE - only add if not exists)
SELECT create_policy_if_not_exists(
  'Users can view their own logs or shared pet logs',
  'task_logs',
  'CREATE POLICY "Users can view their own logs or shared pet logs" ON task_logs FOR SELECT USING (
    user_id = auth.uid() OR
    pet_id IN (
      SELECT pet_id FROM pet_shares WHERE shared_with_id = auth.uid()
    )
  )'
);

SELECT create_policy_if_not_exists(
  'Users can insert logs for their pets or shared pets',
  'task_logs',
  'CREATE POLICY "Users can insert logs for their pets or shared pets" ON task_logs FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      pet_id IN (
        SELECT id FROM pets WHERE owner_id = auth.uid()
      ) OR
      pet_id IN (
        SELECT pet_id FROM pet_shares WHERE shared_with_id = auth.uid()
      )
    )
  )'
);

SELECT create_policy_if_not_exists(
  'Users can update their own logs',
  'task_logs',
  'CREATE POLICY "Users can update their own logs" ON task_logs FOR UPDATE USING (user_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own logs',
  'task_logs',
  'CREATE POLICY "Users can delete their own logs" ON task_logs FOR DELETE USING (user_id = auth.uid())'
);

-- Clean up the helper function
DROP FUNCTION IF EXISTS create_policy_if_not_exists(TEXT, TEXT, TEXT); 