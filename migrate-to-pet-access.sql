-- Migration script to populate pet_access from existing data

-- Step 1: Add owner access for all existing pets
INSERT INTO pet_access (pet_id, user_id, access_level, permissions, status, access_period, created_by)
SELECT 
  p.id as pet_id,
  p.owner_id as user_id,
  'owner' as access_level,
  '{"can_edit_pet": true, "can_assign_tasks": true, "can_view_logs": true, "can_add_logs": true, "can_share_pet": true, "can_delete_pet": true}' as permissions,
  'active' as status,
  '{"start_date": null, "end_date": null, "view_historical": true, "view_future": true, "can_view_before_period": true, "can_view_after_period": true}' as access_period,
  p.owner_id as created_by
FROM pets p
WHERE p.owner_id IS NOT NULL
ON CONFLICT (pet_id, user_id) DO NOTHING;

-- Step 2: Add shared access for all existing pet_shares
INSERT INTO pet_access (pet_id, user_id, access_level, permissions, status, access_period, created_by)
SELECT 
  ps.pet_id,
  u.id as user_id,
  'shared' as access_level,
  '{"can_edit_pet": false, "can_assign_tasks": true, "can_view_logs": true, "can_add_logs": true, "can_share_pet": false, "can_delete_pet": false}' as permissions,
  'active' as status,
  '{"start_date": null, "end_date": null, "view_historical": true, "view_future": true, "can_view_before_period": true, "can_view_after_period": true}' as access_period,
  ps.shared_by_id as created_by
FROM pet_shares ps
JOIN users u ON u.email = ps.shared_with_email
ON CONFLICT (pet_id, user_id) DO NOTHING;

-- Step 3: Verify the migration
SELECT 
  'Owner records created:' as info,
  COUNT(*) as count
FROM pet_access 
WHERE access_level = 'owner'
UNION ALL
SELECT 
  'Shared records created:' as info,
  COUNT(*) as count
FROM pet_access 
WHERE access_level = 'shared'; 