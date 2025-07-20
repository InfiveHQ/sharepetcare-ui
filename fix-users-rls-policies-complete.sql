-- Comprehensive fix for users table RLS policies
-- This script will ensure users can create, read, update, and delete their own records

-- First, let's see what policies currently exist
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Drop all existing policies for the users table
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can delete their own record" ON users;
DROP POLICY IF EXISTS "Enable all for users" ON users;
DROP POLICY IF EXISTS "Users can view all records" ON users;
DROP POLICY IF EXISTS "Users can insert all records" ON users;
DROP POLICY IF EXISTS "Users can update all records" ON users;
DROP POLICY IF EXISTS "Users can delete all records" ON users;

-- Option 1: Create permissive policies that allow users to manage their own records
-- Policy 1: Allow users to view their own record
CREATE POLICY "Users can view their own record" ON users
FOR SELECT USING (auth.uid() = id);

-- Policy 2: Allow users to insert their own record (for signup)
CREATE POLICY "Users can insert their own record" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own record
CREATE POLICY "Users can update their own record" ON users
FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Allow users to delete their own record (optional)
CREATE POLICY "Users can delete their own record" ON users
FOR DELETE USING (auth.uid() = id);

-- Enable RLS on the users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Test the policies by checking if we can query the table
-- This should work for authenticated users
SELECT COUNT(*) as user_count FROM users;

-- If the above policies don't work, try Option 2: Disable RLS temporarily
-- Uncomment the following lines if Option 1 doesn't work:

-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Then re-enable with a simple policy:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable all for users" ON users FOR ALL USING (true) WITH CHECK (true); 