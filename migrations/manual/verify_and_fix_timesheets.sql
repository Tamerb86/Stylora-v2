-- ============================================
-- Verify and Fix Timesheets Table
-- ============================================

-- Check if timesheets table exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Table exists'
        ELSE '❌ Table does NOT exist'
    END AS Status
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'timesheets';

-- List all columns in timesheets table (if it exists)
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'timesheets'
ORDER BY ORDINAL_POSITION;

-- ============================================
-- Create timesheets table if it doesn't exist
-- ============================================

CREATE TABLE IF NOT EXISTS `timesheets` (
    `id` int AUTO_INCREMENT NOT NULL,
    `tenantId` varchar(36) NOT NULL,
    `employeeId` int NOT NULL,
    `clockIn` timestamp NOT NULL,
    `clockOut` timestamp,
    `totalHours` decimal(5,2),
    `workDate` date NOT NULL,
    `notes` text,
    `editReason` text,
    `editedBy` int,
    `editedAt` timestamp,
    `createdAt` timestamp NOT NULL DEFAULT (now()),
    `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `timesheets_id` PRIMARY KEY(`id`)
);

-- ============================================
-- Create indexes for performance
-- ============================================

-- Check and create tenant_employee_timesheet_idx
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'timesheets' 
    AND INDEX_NAME = 'tenant_employee_timesheet_idx'
);

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX `tenant_employee_timesheet_idx` ON `timesheets` (`tenantId`, `employeeId`, `workDate`)', 
    'SELECT "Index tenant_employee_timesheet_idx already exists" AS message'
);
PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt;

-- Check and create timesheet_work_date_idx
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'timesheets' 
    AND INDEX_NAME = 'timesheet_work_date_idx'
);

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX `timesheet_work_date_idx` ON `timesheets` (`workDate`)', 
    'SELECT "Index timesheet_work_date_idx already exists" AS message'
);
PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt;

-- ============================================
-- Verify the fix
-- ============================================

SELECT '✅ Timesheets table is ready!' AS Status;
SELECT 'You can now use the Time Clock feature' AS Message;

-- Show table structure
SHOW CREATE TABLE `timesheets`;
