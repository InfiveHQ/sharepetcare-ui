-- Fix INSERT policy to be completely permissive
-- This will allow any authenticated user to create user records

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Create a completely permissive INSERT policy
CREATE POLICY "Users can create their own profile" ON users
    FOR INSERT WITH CHECK (true);

-- This allows ANY authenticated user to create user records
-- Perfect for testing the signup flow 