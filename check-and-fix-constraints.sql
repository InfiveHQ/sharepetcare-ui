-- First, let's see what constraints currently exist
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('pet_tasks', 'task_logs')
    AND ccu.table_name = 'pets';

-- Now let's drop and recreate the constraints with CASCADE
-- For pet_tasks table
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pet_tasks_pet_id_fkey' 
        AND table_name = 'pet_tasks'
    ) THEN
        ALTER TABLE pet_tasks DROP CONSTRAINT pet_tasks_pet_id_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pet_tasks_pet_id_pets_id_fk' 
        AND table_name = 'pet_tasks'
    ) THEN
        ALTER TABLE pet_tasks DROP CONSTRAINT pet_tasks_pet_id_pets_id_fk;
    END IF;
    
    -- Add new constraint with CASCADE
    ALTER TABLE pet_tasks 
    ADD CONSTRAINT pet_tasks_pet_id_fkey 
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'pet_tasks constraint updated successfully';
END $$;

-- For task_logs table
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_logs_pet_id_fkey' 
        AND table_name = 'task_logs'
    ) THEN
        ALTER TABLE task_logs DROP CONSTRAINT task_logs_pet_id_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_logs_pet_id_pets_id_fk' 
        AND table_name = 'task_logs'
    ) THEN
        ALTER TABLE task_logs DROP CONSTRAINT task_logs_pet_id_pets_id_fk;
    END IF;
    
    -- Add new constraint with CASCADE
    ALTER TABLE task_logs 
    ADD CONSTRAINT task_logs_pet_id_fkey 
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'task_logs constraint updated successfully';
END $$; 