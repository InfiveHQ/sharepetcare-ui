-- Fix pets table RLS policy
-- This allows users to see pets they own OR pets shared with them

-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own pets" ON pets;

-- Create new policy that allows viewing owned pets OR shared pets
CREATE POLICY "Users can view owned or shared pets" ON pets
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        id IN (
            SELECT pet_id 
            FROM pet_shares 
            WHERE shared_with_id = auth.uid()
        )
    );

-- Keep the existing INSERT, UPDATE, DELETE policies for owned pets only
-- (These should already exist and be correct) 