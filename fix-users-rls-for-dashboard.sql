-- Fix users RLS policy to allow viewing user names for dashboard
-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create new SELECT policy that allows viewing all user names (for dashboard)
CREATE POLICY "Users can view all user names" ON users
    FOR SELECT USING (auth.role() = 'authenticated'); 