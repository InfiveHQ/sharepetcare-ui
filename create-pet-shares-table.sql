-- Create pet_shares table for sharing pets between users
CREATE TABLE pet_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_with_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view_and_log' CHECK (permission IN ('view_only', 'view_and_log', 'full_access')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pet_id, shared_with_id) -- Prevent duplicate shares
);

-- Add RLS policies for pet_shares
ALTER TABLE pet_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Pet owners can view their pet shares
CREATE POLICY "Pet owners can view their pet shares" ON pet_shares
  FOR SELECT USING (
    owner_id = auth.uid()
  );

-- Policy: Pet owners can insert pet shares
CREATE POLICY "Pet owners can insert pet shares" ON pet_shares
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
  );

-- Policy: Pet owners can update their pet shares
CREATE POLICY "Pet owners can update their pet shares" ON pet_shares
  FOR UPDATE USING (
    owner_id = auth.uid()
  );

-- Policy: Pet owners can delete their pet shares
CREATE POLICY "Pet owners can delete their pet shares" ON pet_shares
  FOR DELETE USING (
    owner_id = auth.uid()
  );

-- Policy: Shared users can view pet shares they're part of
CREATE POLICY "Shared users can view pet shares they're part of" ON pet_shares
  FOR SELECT USING (
    shared_with_id = auth.uid()
  );

-- Update pets table RLS to allow shared access
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own pets" ON pets;
DROP POLICY IF EXISTS "Users can insert their own pets" ON pets;
DROP POLICY IF EXISTS "Users can update their own pets" ON pets;
DROP POLICY IF EXISTS "Users can delete their own pets" ON pets;

-- Create new policies that include shared access
CREATE POLICY "Users can view their own pets or shared pets" ON pets
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT pet_id FROM pet_shares WHERE shared_with_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own pets" ON pets
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
  );

CREATE POLICY "Users can update their own pets" ON pets
  FOR UPDATE USING (
    owner_id = auth.uid()
  );

CREATE POLICY "Users can delete their own pets" ON pets
  FOR DELETE USING (
    owner_id = auth.uid()
  );

-- Update task_logs table RLS to allow shared access
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own logs" ON task_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON task_logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON task_logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON task_logs;

-- Create new policies that include shared access
CREATE POLICY "Users can view their own logs or shared pet logs" ON task_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    pet_id IN (
      SELECT pet_id FROM pet_shares WHERE shared_with_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for their pets or shared pets" ON task_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      pet_id IN (
        SELECT id FROM pets WHERE owner_id = auth.uid()
      ) OR
      pet_id IN (
        SELECT pet_id FROM pet_shares WHERE shared_with_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own logs" ON task_logs
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own logs" ON task_logs
  FOR DELETE USING (
    user_id = auth.uid()
  ); 