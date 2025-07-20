-- Create the enhanced pet_access table
CREATE TABLE pet_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_level TEXT DEFAULT 'shared' CHECK (access_level IN ('owner', 'shared', 'sitter', 'viewer')),
  permissions JSONB DEFAULT '{"can_edit_pet": false, "can_assign_tasks": false, "can_view_logs": true, "can_add_logs": false, "can_share_pet": false, "can_delete_pet": false}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  access_period JSONB DEFAULT '{"start_date": null, "end_date": null, "view_historical": false, "view_future": false, "can_view_before_period": false, "can_view_after_period": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  notes TEXT,
  UNIQUE(pet_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_pet_access_pet_id ON pet_access(pet_id);
CREATE INDEX idx_pet_access_user_id ON pet_access(user_id);
CREATE INDEX idx_pet_access_status ON pet_access(status);
CREATE INDEX idx_pet_access_level ON pet_access(access_level);

-- Add RLS policies for pet_access table
ALTER TABLE pet_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view pet_access records for pets they have access to
CREATE POLICY "Users can view pet_access for their pets" ON pet_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pet_access pa2 
      WHERE pa2.pet_id = pet_access.pet_id 
      AND pa2.user_id = auth.uid()
    )
  );

-- Policy: Users can insert pet_access records for pets they own
CREATE POLICY "Users can insert pet_access for owned pets" ON pet_access
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = pet_access.pet_id 
      AND pets.owner_id = auth.uid()
    )
  );

-- Policy: Users can update pet_access records for pets they own
CREATE POLICY "Users can update pet_access for owned pets" ON pet_access
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = pet_access.pet_id 
      AND pets.owner_id = auth.uid()
    )
  );

-- Policy: Users can delete pet_access records for pets they own
CREATE POLICY "Users can delete pet_access for owned pets" ON pet_access
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = pet_access.pet_id 
      AND pets.owner_id = auth.uid()
    )
  ); 