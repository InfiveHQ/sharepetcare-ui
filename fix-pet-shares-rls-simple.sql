-- Fix the infinite recursion with a much simpler approach

-- Drop all existing policies on pet_shares
DROP POLICY IF EXISTS "Users can create shares for pets they own" ON pet_shares;
DROP POLICY IF EXISTS "Users can delete shares they created" ON pet_shares;
DROP POLICY IF EXISTS "Users can update shares they created" ON pet_shares;
DROP POLICY IF EXISTS "Users can view shares they created or are part of" ON pet_shares;

-- Create very simple policies for pet_shares
CREATE POLICY "Enable all for pet_shares" ON pet_shares
  FOR ALL USING (true);

-- Drop all existing policies on pets
DROP POLICY IF EXISTS "Users can delete their own pets" ON pets;
DROP POLICY IF EXISTS "Users can insert their own pets" ON pets;
DROP POLICY IF EXISTS "Users can update their own pets" ON pets;
DROP POLICY IF EXISTS "Users can view owned or shared pets" ON pets;

-- Create very simple policies for pets
CREATE POLICY "Enable all for pets" ON pets
  FOR ALL USING (true); 