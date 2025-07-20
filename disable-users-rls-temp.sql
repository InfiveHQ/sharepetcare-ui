-- Temporary fix: Disable RLS on users table to allow user creation
-- This is a temporary solution until proper RLS policies are configured

-- Disable RLS on the users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- This will allow all authenticated users to create, read, update, and delete user records
-- WARNING: This removes security restrictions on the users table
-- Only use this as a temporary solution while setting up proper RLS policies

-- To re-enable RLS later with proper policies, run:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Then create appropriate policies based on your security requirements 