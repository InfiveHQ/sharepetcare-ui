-- Create pet_shares table for sharing pets between users (SAFE VERSION)
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

-- Policy: Pet owners can view their pet shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pet_shares' AND policyname = 'Pet owners can view their pet shares'
  ) THEN
    CREATE POLICY "Pet owners can view their pet shares" ON pet_shares
      FOR SELECT USING (owner_id = auth.uid());
  END IF;
END $$;

-- Policy: Pet owners can insert pet shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pet_shares' AND policyname = 'Pet owners can insert pet shares'
  ) THEN
    CREATE POLICY "Pet owners can insert pet shares" ON pet_shares
      FOR INSERT WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

-- Policy: Pet owners can update their pet shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pet_shares' AND policyname = 'Pet owners can update their pet shares'
  ) THEN
    CREATE POLICY "Pet owners can update their pet shares" ON pet_shares
      FOR UPDATE USING (owner_id = auth.uid());
  END IF;
END $$;

-- Policy: Pet owners can delete their pet shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pet_shares' AND policyname = 'Pet owners can delete their pet shares'
  ) THEN
    CREATE POLICY "Pet owners can delete their pet shares" ON pet_shares
      FOR DELETE USING (owner_id = auth.uid());
  END IF;
END $$;

-- Policy: Shared users can view pet shares they're part of
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pet_shares' AND policyname = 'Shared users can view pet shares they are part of'
  ) THEN
    CREATE POLICY "Shared users can view pet shares they're part of" ON pet_shares
      FOR SELECT USING (shared_with_id = auth.uid());
  END IF;
END $$;

-- Update pets table RLS to allow shared access (SAFE - only add if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pets' AND policyname = 'Users can view their own pets or shared pets'
  ) THEN
    CREATE POLICY "Users can view their own pets or shared pets" ON pets
      FOR SELECT USING (
        owner_id = auth.uid() OR
        id IN (
          SELECT pet_id FROM pet_shares WHERE shared_with_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Only create other pet policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pets' AND policyname = 'Users can insert their own pets'
  ) THEN
    CREATE POLICY "Users can insert their own pets" ON pets
      FOR INSERT WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pets' AND policyname = 'Users can update their own pets'
  ) THEN
    CREATE POLICY "Users can update their own pets" ON pets
      FOR UPDATE USING (owner_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pets' AND policyname = 'Users can delete their own pets'
  ) THEN
    CREATE POLICY "Users can delete their own pets" ON pets
      FOR DELETE USING (owner_id = auth.uid());
  END IF;
END $$;

-- Update task_logs table RLS to allow shared access (SAFE - only add if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_logs' AND policyname = 'Users can view their own logs or shared pet logs'
  ) THEN
    CREATE POLICY "Users can view their own logs or shared pet logs" ON task_logs
      FOR SELECT USING (
        user_id = auth.uid() OR
        pet_id IN (
          SELECT pet_id FROM pet_shares WHERE shared_with_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_logs' AND policyname = 'Users can insert logs for their pets or shared pets'
  ) THEN
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
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_logs' AND policyname = 'Users can update their own logs'
  ) THEN
    CREATE POLICY "Users can update their own logs" ON task_logs
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_logs' AND policyname = 'Users can delete their own logs'
  ) THEN
    CREATE POLICY "Users can delete their own logs" ON task_logs
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$; 