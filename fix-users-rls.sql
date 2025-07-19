-- Fix RLS policies for users table to allow user creation for sharing
-- This allows creating placeholder users for pet sharing

-- First, let's see what policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create new policies that allow user creation for sharing
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Allow inserting users (for sharing functionality)
CREATE POLICY "Allow user creation for sharing" ON users
  FOR INSERT WITH CHECK (true);

-- Alternative: If you want to be more restrictive, only allow authenticated users to create users
-- CREATE POLICY "Allow authenticated users to create users" ON users
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); 