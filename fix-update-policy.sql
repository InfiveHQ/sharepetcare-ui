-- Make UPDATE policy more permissive for users table
-- This allows any authenticated user to update user records

-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create a more permissive UPDATE policy
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.role() = 'authenticated');

-- This allows any authenticated user to update any user record
-- Perfect for the sharing workflow where placeholder users need to be updated 