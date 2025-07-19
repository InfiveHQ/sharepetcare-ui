-- Add sort_order column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Update existing tasks with sequential sort_order values using CTE
WITH numbered_tasks AS (
  SELECT id, row_number() OVER (ORDER BY id) as rn
  FROM tasks
  WHERE sort_order IS NULL
)
UPDATE tasks 
SET sort_order = numbered_tasks.rn
FROM numbered_tasks
WHERE tasks.id = numbered_tasks.id;

-- Make sort_order NOT NULL after setting default values
ALTER TABLE tasks ALTER COLUMN sort_order SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order); 