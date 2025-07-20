-- Fix the infinite recursion in pet_shares RLS policy

-- Drop the problematic policy
DROP POLICY "Users can view shares they created or are part of" ON pet_shares;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Users can view shares they created or are part of" ON pet_shares
  FOR SELECT USING (
    (owner_id = auth.uid()) OR 
    (shared_with_id = auth.uid()) OR
    (shared_with_email = (SELECT email FROM users WHERE id = auth.uid()))
  );

-- Also fix the pets table policy to avoid recursion
DROP POLICY "Users can view owned or shared pets" ON pets;

-- Create a simpler policy for pets
CREATE POLICY "Users can view owned or shared pets" ON pets
  FOR SELECT USING (
    (owner_id = auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM pet_shares 
      WHERE pet_shares.pet_id = pets.id 
      AND (pet_shares.shared_with_id = auth.uid() OR pet_shares.shared_with_email = (SELECT email FROM users WHERE id = auth.uid()))
    )
  ); 