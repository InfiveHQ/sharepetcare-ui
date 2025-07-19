-- Fix task_logs table RLS policy
-- This allows users to see logs for pets they own OR pets shared with them

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own task logs" ON task_logs;
DROP POLICY IF EXISTS "Users can insert their own task logs" ON task_logs;
DROP POLICY IF EXISTS "Users can update their own task logs" ON task_logs;
DROP POLICY IF EXISTS "Users can delete their own task logs" ON task_logs;

-- Create comprehensive policies
CREATE POLICY "Users can view logs for owned or shared pets" ON task_logs
    FOR SELECT USING (
        pet_id IN (
            SELECT id FROM pets 
            WHERE owner_id = auth.uid() 
            OR id IN (
                SELECT pet_id 
                FROM pet_shares 
                WHERE shared_with_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert logs for owned or shared pets" ON task_logs
    FOR INSERT WITH CHECK (
        pet_id IN (
            SELECT id FROM pets 
            WHERE owner_id = auth.uid() 
            OR id IN (
                SELECT pet_id 
                FROM pet_shares 
                WHERE shared_with_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update logs for owned or shared pets" ON task_logs
    FOR UPDATE USING (
        pet_id IN (
            SELECT id FROM pets 
            WHERE owner_id = auth.uid() 
            OR id IN (
                SELECT pet_id 
                FROM pet_shares 
                WHERE shared_with_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete logs for owned or shared pets" ON task_logs
    FOR DELETE USING (
        pet_id IN (
            SELECT id FROM pets 
            WHERE owner_id = auth.uid() 
            OR id IN (
                SELECT pet_id 
                FROM pet_shares 
                WHERE shared_with_id = auth.uid()
            )
        )
    ); 