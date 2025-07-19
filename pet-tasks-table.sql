-- Create pet_tasks table for pet-specific task assignments
CREATE TABLE pet_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expected_time TIME,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for pet_tasks
ALTER TABLE pet_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view pet_tasks for pets they own
CREATE POLICY "Users can view pet_tasks for their pets" ON pet_tasks
  FOR SELECT USING (
    pet_id IN (
      SELECT id FROM pets WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can insert pet_tasks for pets they own
CREATE POLICY "Users can insert pet_tasks for their pets" ON pet_tasks
  FOR INSERT WITH CHECK (
    pet_id IN (
      SELECT id FROM pets WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can update pet_tasks for pets they own
CREATE POLICY "Users can update pet_tasks for their pets" ON pet_tasks
  FOR UPDATE USING (
    pet_id IN (
      SELECT id FROM pets WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can delete pet_tasks for pets they own
CREATE POLICY "Users can delete pet_tasks for their pets" ON pet_tasks
  FOR DELETE USING (
    pet_id IN (
      SELECT id FROM pets WHERE owner_id = auth.uid()
    )
  );

-- Create unique constraint to prevent duplicate pet-task assignments
CREATE UNIQUE INDEX pet_tasks_unique ON pet_tasks(pet_id, task_id); 