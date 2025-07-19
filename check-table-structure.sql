-- Check the structure of pet_shares table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pet_shares';

-- Check all user records in the database
SELECT 
    id,
    email,
    name,
    updated_at
FROM users 
ORDER BY updated_at DESC;

-- Check if there are any duplicate emails
SELECT 
    email,
    COUNT(*) as count
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1; 