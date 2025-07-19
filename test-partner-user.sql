-- Test to see if partner's user record exists
-- Replace 'PARTNER_EMAIL' with the actual partner's email

SELECT id, name, email, created_at 
FROM users 
WHERE email = 'PARTNER_EMAIL';

-- Also check all users to see what's in the table
SELECT id, name, email, created_at 
FROM users 
ORDER BY created_at DESC; 