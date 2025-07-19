-- Clear all task_logs to start fresh
DELETE FROM task_logs;

-- Verify the table is empty
SELECT COUNT(*) as remaining_logs FROM task_logs;

-- Check the table structure to make sure we understand the relationships
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_logs' 
ORDER BY ordinal_position;

-- Check the foreign key constraints
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'task_logs' 
    AND tc.constraint_type = 'FOREIGN KEY'; 