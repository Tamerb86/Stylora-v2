-- ============================================
-- Fix Notifications Table Schema
-- Add Missing Columns
-- ============================================

-- Add recipientType
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'recipientType');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `recipientType` enum("customer","employee","owner") NOT NULL AFTER `tenantId`', 
  'SELECT "Column recipientType already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add recipientId
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'recipientId');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `recipientId` int NOT NULL AFTER `recipientType`', 
  'SELECT "Column recipientId already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add notificationType
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'notificationType');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `notificationType` enum("sms","email") NOT NULL AFTER `recipientId`', 
  'SELECT "Column notificationType already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add template
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'template');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `template` varchar(100) AFTER `notificationType`', 
  'SELECT "Column template already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add recipientContact
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'recipientContact');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `recipientContact` varchar(320) NOT NULL AFTER `template`', 
  'SELECT "Column recipientContact already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add subject
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'subject');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `subject` varchar(255) AFTER `recipientContact`', 
  'SELECT "Column subject already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add content
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'content');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `content` text NOT NULL AFTER `subject`', 
  'SELECT "Column content already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add status (if missing)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'status');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `status` enum("pending","sent","delivered","failed") DEFAULT "pending" AFTER `content`', 
  'SELECT "Column status already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add attempts
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'attempts');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `attempts` int DEFAULT 0 AFTER `status`', 
  'SELECT "Column attempts already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add maxAttempts
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'maxAttempts');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `maxAttempts` int DEFAULT 3 AFTER `attempts`', 
  'SELECT "Column maxAttempts already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add errorMessage
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'errorMessage');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `errorMessage` text AFTER `maxAttempts`', 
  'SELECT "Column errorMessage already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add scheduledAt
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'scheduledAt');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `scheduledAt` timestamp NOT NULL AFTER `errorMessage`', 
  'SELECT "Column scheduledAt already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add sentAt
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'sentAt');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `notifications` ADD COLUMN `sentAt` timestamp NULL AFTER `scheduledAt`', 
  'SELECT "Column sentAt already exists" AS message');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================
-- Add Indexes for Performance
-- ============================================

-- These may fail if indexes already exist - this is normal
CREATE INDEX `tenant_notifications_idx` ON `notifications` (`tenantId`, `status`, `scheduledAt`);
CREATE INDEX `pending_idx` ON `notifications` (`status`, `scheduledAt`);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT '✅ Notifications table fixed successfully!' AS Status;
SELECT 'All missing columns have been added.' AS Message;
SELECT 'The application should now work properly.' AS NextStep;
-- ============================================
