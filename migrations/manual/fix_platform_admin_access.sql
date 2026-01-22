-- ============================================
-- Fix Platform Admin Access
-- Link user to OWNER_OPEN_ID
-- ============================================

-- Update the admin user's openId to match OWNER_OPEN_ID
UPDATE `users` 
SET `openId` = 'platform-owner-tamer'
WHERE `email` = 'tamerb86@gmail.com';

-- Verify the update
SELECT 
    id,
    email,
    openId,
    role,
    tenantId,
    createdAt
FROM `users`
WHERE `email` = 'tamerb86@gmail.com';

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. The OWNER_OPEN_ID in your Railway environment is: platform-owner-tamer
-- 2. This user will now have full Platform Admin access
-- 3. They can manage all tenants, subscriptions, and system settings
-- 4. After running this script, refresh the /saas-admin/login page
-- ============================================

SELECT '✅ Platform Admin access fixed!' AS Status;
SELECT 'User tamerb86@gmail.com is now linked to platform-owner-tamer' AS Message;
SELECT 'Refresh /saas-admin/login and you should have access' AS NextStep;
