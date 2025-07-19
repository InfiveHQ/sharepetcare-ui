-- Create missing user record for partner
-- Replace 'PARTNER_AUTH_ID' with the actual auth ID from the console logs
-- Replace 'PARTNER_EMAIL' with the partner's email

INSERT INTO users (id, email, name)
VALUES (
    'PARTNER_AUTH_ID',  -- Replace with actual auth ID
    'PARTNER_EMAIL',    -- Replace with partner's email
    'Partner Name'      -- Replace with desired name
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email; 