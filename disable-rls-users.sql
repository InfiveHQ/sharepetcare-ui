-- Temporarily disable RLS on users table for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- This will allow all operations on the users table without RLS restrictions
-- Run this in your Supabase SQL editor to test the signup flow 