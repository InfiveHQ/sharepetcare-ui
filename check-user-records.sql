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

-- Check pet_shares to see what user IDs are referenced
SELECT 
    ps.id,
    ps.pet_id,
    ps.owner_id,
    ps.shared_with_id,
    ps.access_level,
    u_owner.email as owner_email,
    u_shared_with.email as shared_with_email
FROM pet_shares ps
LEFT JOIN users u_owner ON ps.owner_id = u_owner.id
LEFT JOIN users u_shared_with ON ps.shared_with_id = u_shared_with.id; 