-- Fix pets RLS policies to allow viewing shared pets
-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own pets" ON pets;

-- Create new SELECT policy that allows viewing owned pets OR shared pets
CREATE POLICY "Users can view their own pets or shared pets" ON pets
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        id IN (
            SELECT pet_id 
            FROM pet_shares 
            WHERE shared_with_id = auth.uid()
        )
    ); 