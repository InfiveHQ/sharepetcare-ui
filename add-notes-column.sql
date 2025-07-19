-- Add instructions column to pet_tasks table
-- Run this in your Supabase SQL Editor

ALTER TABLE pet_tasks 
ADD COLUMN instructions TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN pet_tasks.instructions IS 'Special instructions for the pet task assignment'; 