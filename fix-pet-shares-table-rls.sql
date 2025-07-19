-- Fix pet_shares table RLS policies
-- This allows users to see shares they created OR shares they're part of

-- Drop any existing policies first
DROP POLICY IF EXISTS "Users can view their own shares" ON pet_shares;
DROP POLICY IF EXISTS "Users can create shares" ON pet_shares;
DROP POLICY IF EXISTS "Users can update their shares" ON pet_shares;
DROP POLICY IF EXISTS "Users can delete their shares" ON pet_shares;
DROP POLICY IF EXISTS "Shared users can view pet shares they're part of" ON pet_shares;

-- Create comprehensive policies
CREATE POLICY "Users can view shares they created or are part of" ON pet_shares
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        shared_with_id = auth.uid()
    );

CREATE POLICY "Users can create shares for pets they own" ON pet_shares
    FOR INSERT WITH CHECK (
        owner_id = auth.uid() AND
        pet_id IN (
            SELECT id FROM pets WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update shares they created" ON pet_shares
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete shares they created" ON pet_shares
    FOR DELETE USING (owner_id = auth.uid()); 