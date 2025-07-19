-- Fix RLS policies for users table
-- This handles both INSERT and UPDATE operations

-- First, enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Policy for INSERT - allow authenticated users to create user records
CREATE POLICY "Users can create their own profile" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for UPDATE - allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy for SELECT - allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- This should fix both the INSERT and UPDATE operations during signup 