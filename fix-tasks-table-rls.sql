-- Fix tasks table RLS policy
-- This ensures all authenticated users can see all tasks

-- The tasks table should already have the correct policies, but let's make sure
-- Drop any existing policies first
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

-- Create comprehensive policies
CREATE POLICY "Authenticated users can view all tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tasks" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tasks" ON tasks
    FOR DELETE USING (auth.role() = 'authenticated'); 