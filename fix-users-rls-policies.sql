-- Fix RLS policies for users table to allow user creation
-- This will allow authenticated users to create their own user records

-- First, let's see what policies currently exist
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;

-- Create new policies that allow user creation and management

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
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'users'; 