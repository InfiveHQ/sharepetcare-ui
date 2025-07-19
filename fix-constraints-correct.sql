-- Fix the foreign key constraints with the correct names
-- Based on the error message, the constraint is named "fk_tasklogs_pet"

-- First, let's see what constraints currently exist
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('pet_tasks', 'task_logs')
    AND ccu.table_name = 'pets';

-- Now fix the constraints with CASCADE delete
-- For task_logs table (this is the one causing the error)
ALTER TABLE task_logs 
DROP CONSTRAINT IF EXISTS fk_tasklogs_pet;

ALTER TABLE task_logs 
ADD CONSTRAINT fk_tasklogs_pet 
FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE;

-- For pet_tasks table (check what the actual constraint name is)
-- Let's try the common naming patterns
ALTER TABLE pet_tasks 
DROP CONSTRAINT IF EXISTS pet_tasks_pet_id_fkey;

ALTER TABLE pet_tasks 
DROP CONSTRAINT IF EXISTS pet_tasks_pet_id_pets_id_fk;

ALTER TABLE pet_tasks 
DROP CONSTRAINT IF EXISTS fk_pettasks_pet;

-- Add the new constraint
ALTER TABLE pet_tasks 
ADD CONSTRAINT fk_pettasks_pet 
FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE; 