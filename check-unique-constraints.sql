-- Check for unique constraints on users table
-- This will show us if there are any constraints that might be causing INSERT failures

SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_name = 'users' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- Also check the table structure
\d users; 