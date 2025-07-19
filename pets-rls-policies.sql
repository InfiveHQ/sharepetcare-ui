-- Enable RLS on pets table
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own pets
CREATE POLICY "Users can view their own pets" ON pets
    FOR SELECT USING (auth.uid() = owner_id);

-- Policy to allow users to insert their own pets
CREATE POLICY "Users can insert their own pets" ON pets
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Policy to allow users to update their own pets
CREATE POLICY "Users can update their own pets" ON pets
    FOR UPDATE USING (auth.uid() = owner_id);

-- Policy to allow users to delete their own pets
CREATE POLICY "Users can delete their own pets" ON pets
    FOR DELETE USING (auth.uid() = owner_id); 