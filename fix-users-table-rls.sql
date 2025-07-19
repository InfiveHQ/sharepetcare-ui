-- Fix users table RLS policy
-- This allows all authenticated users to see user names (needed for dashboard)

-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create new policy that allows viewing all user names
CREATE POLICY "Users can view all user names" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Keep the existing UPDATE policy for own profile
-- Keep the existing INSERT policy for user creation 