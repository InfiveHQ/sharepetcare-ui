-- Add cascade delete for pet_tasks when a pet is deleted
ALTER TABLE pet_tasks 
DROP CONSTRAINT IF EXISTS pet_tasks_pet_id_fkey;

ALTER TABLE pet_tasks 
ADD CONSTRAINT pet_tasks_pet_id_fkey 
FOREIGN KEY (pet_id) 
REFERENCES pets(id) 
ON DELETE CASCADE;

-- Add cascade delete for task_logs when a pet is deleted
ALTER TABLE task_logs 
DROP CONSTRAINT IF EXISTS task_logs_pet_id_fkey;

ALTER TABLE task_logs 
ADD CONSTRAINT task_logs_pet_id_fkey 
FOREIGN KEY (pet_id) 
REFERENCES pets(id) 
ON DELETE CASCADE; 