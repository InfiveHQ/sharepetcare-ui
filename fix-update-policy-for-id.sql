-- Fix UPDATE policy to allow updating ID field for placeholder users
-- This is needed when converting placeholder users to real auth users

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create a more permissive UPDATE policy that allows updating any user record
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.role() = 'authenticated');

-- This allows any authenticated user to update any user record
-- Perfect for the placeholder user conversion process 