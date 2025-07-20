-- Add shared_with_email column to pet_shares table
-- This will allow email-based sharing instead of user ID-based sharing

ALTER TABLE pet_shares 
ADD COLUMN shared_with_email TEXT;

-- Add an index on the email column for better performance
CREATE INDEX IF NOT EXISTS idx_pet_shares_shared_with_email 
ON pet_shares(shared_with_email);

-- Add a comment to explain the column
COMMENT ON COLUMN pet_shares.shared_with_email IS 'Email address of the user the pet is shared with. Used for email-based sharing instead of user ID.';

-- Optional: Add a constraint to ensure email format (basic validation)
-- ALTER TABLE pet_shares 
-- ADD CONSTRAINT check_email_format 
-- CHECK (shared_with_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'); 