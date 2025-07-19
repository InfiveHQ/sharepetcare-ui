-- Complete fix for users table RLS policies
-- This allows user creation during signup AND sharing functionality

-- First, let's see what policies currently exist
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Drop ALL existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow user creation for sharing" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;

-- Create comprehensive policies that allow:
-- 1. User creation during signup (no auth required)
-- 2. Users to view/update their own profile
-- 3. Sharing functionality to work

-- Allow inserting users (for signup and sharing)
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" ON users
  FOR DELETE USING (id = auth.uid());

-- Also allow viewing users for sharing functionality
CREATE POLICY "Allow viewing users for sharing" ON users
  FOR SELECT USING (true); 