-- Fix pet_shares references to point to correct auth user IDs
-- This script will update pet_shares to reference the real auth user IDs instead of placeholder IDs

-- First, let's see what we have in pet_shares
SELECT 
    ps.id,
    ps.pet_id,
    ps.shared_by_id,
    ps.shared_with_id,
    ps.access_level,
    ps.created_at,
    u_shared_by.email as shared_by_email,
    u_shared_with.email as shared_with_email
FROM pet_shares ps
LEFT JOIN users u_shared_by ON ps.shared_by_id = u_shared_by.id
LEFT JOIN users u_shared_with ON ps.shared_with_id = u_shared_with.id;

-- Now let's see all users to understand the mapping
SELECT id, email, name FROM users ORDER BY created_at;

-- To fix this, you'll need to manually update the pet_shares table
-- Replace the placeholder user ID with the real auth user ID
-- Example:
-- UPDATE pet_shares 
-- SET shared_with_id = 'real-auth-user-id-here' 
-- WHERE shared_with_id = 'placeholder-user-id-here'; 