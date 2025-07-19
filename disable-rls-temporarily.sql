-- Temporarily disable RLS on users table for testing
-- This will bypass all RLS policies and allow any operation

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- This should allow any INSERT, UPDATE, DELETE, SELECT operations
-- Perfect for testing if RLS is the root cause 