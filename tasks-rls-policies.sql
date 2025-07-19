-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to select all tasks
CREATE POLICY "Authenticated users can view all tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert tasks
CREATE POLICY "Authenticated users can insert tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update tasks
CREATE POLICY "Authenticated users can update tasks" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to delete tasks
CREATE POLICY "Authenticated users can delete tasks" ON tasks
    FOR DELETE USING (auth.role() = 'authenticated'); 