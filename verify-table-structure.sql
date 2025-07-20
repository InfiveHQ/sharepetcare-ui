-- Verify all existing table structures and relationships

-- 1. Check users table structure
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Check pets table structure
SELECT 
  'pets' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pets' 
ORDER BY ordinal_position;

-- 3. Check pet_shares table structure
SELECT 
  'pet_shares' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pet_shares' 
ORDER BY ordinal_position;

-- 4. Check tasks table structure
SELECT 
  'tasks' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 5. Check pet_tasks table structure
SELECT 
  'pet_tasks' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pet_tasks' 
ORDER BY ordinal_position;

-- 6. Check task_logs table structure
SELECT 
  'task_logs' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'task_logs' 
ORDER BY ordinal_position;

-- 7. Check foreign key constraints
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- 8. Check if pet_access table already exists
SELECT 
  'pet_access_exists' as check_type,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'pet_access'
  ) as table_exists;

-- 9. Sample data counts
SELECT 'users_count' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'pets_count', COUNT(*) FROM pets
UNION ALL
SELECT 'pet_shares_count', COUNT(*) FROM pet_shares
UNION ALL
SELECT 'tasks_count', COUNT(*) FROM tasks
UNION ALL
SELECT 'pet_tasks_count', COUNT(*) FROM pet_tasks
UNION ALL
SELECT 'task_logs_count', COUNT(*) FROM task_logs; 