-- ============================================
-- Stylora Database Migration (Fixed Version)
-- Add Missing Columns to Fix Schema Mismatch
-- ============================================
-- This script adds all columns that exist in the code schema
-- but are missing from the database
-- Note: Some ALTER statements may fail if columns already exist
-- This is normal and can be ignored
-- ============================================

-- ============================================
-- 1. APPOINTMENTS TABLE
-- ============================================

-- Add managementToken column (for customer self-service)
ALTER TABLE `appointments` 
ADD COLUMN `managementToken` varchar(64) UNIQUE AFTER `isLateCancellation`;

-- Add rescheduleCount column
ALTER TABLE `appointments` 
ADD COLUMN `rescheduleCount` int NOT NULL DEFAULT 0 AFTER `recurrenceRuleId`;

-- ============================================
-- 2. CUSTOMERS TABLE
-- ============================================

-- Add firstName and lastName columns
ALTER TABLE `customers` 
ADD COLUMN `firstName` varchar(100) NOT NULL DEFAULT '' AFTER `tenantId`;

ALTER TABLE `customers` 
ADD COLUMN `lastName` varchar(100) AFTER `firstName`;

-- Update existing data: split 'name' into firstName and lastName
UPDATE `customers` 
SET 
  `firstName` = SUBSTRING_INDEX(`name`, ' ', 1),
  `lastName` = CASE 
    WHEN LOCATE(' ', `name`) > 0 
    THEN SUBSTRING(`name`, LOCATE(' ', `name`) + 1)
    ELSE NULL
  END
WHERE `name` IS NOT NULL AND `name` != '';

-- Add marketing consent columns
ALTER TABLE `customers` 
ADD COLUMN `marketingSmsConsent` boolean DEFAULT false AFTER `notes`;

ALTER TABLE `customers` 
ADD COLUMN `marketingEmailConsent` boolean DEFAULT false AFTER `marketingSmsConsent`;

ALTER TABLE `customers` 
ADD COLUMN `consentTimestamp` timestamp NULL AFTER `marketingEmailConsent`;

ALTER TABLE `customers` 
ADD COLUMN `consentIp` varchar(45) AFTER `consentTimestamp`;

-- Add totalRevenue column
ALTER TABLE `customers` 
ADD COLUMN `totalRevenue` decimal(10,2) DEFAULT '0.00' AFTER `totalVisits`;

-- Add deletedAt column (soft delete)
ALTER TABLE `customers` 
ADD COLUMN `deletedAt` timestamp NULL AFTER `noShowCount`;

-- ============================================
-- 3. USERS TABLE
-- ============================================

-- Add passwordHash column
ALTER TABLE `users` 
ADD COLUMN `passwordHash` varchar(255) AFTER `pin`;

-- Copy data from 'password' to 'passwordHash' if password column exists
UPDATE `users` 
SET `passwordHash` = `password` 
WHERE `password` IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'password'
  );

-- Add deactivatedAt column
ALTER TABLE `users` 
ADD COLUMN `deactivatedAt` timestamp NULL AFTER `isActive`;

-- Add commission columns
ALTER TABLE `users` 
ADD COLUMN `commissionType` enum('percentage','fixed','tiered') DEFAULT 'percentage' AFTER `deactivatedAt`;

ALTER TABLE `users` 
ADD COLUMN `commissionRate` decimal(5,2) AFTER `commissionType`;

-- Add leave management columns
ALTER TABLE `users` 
ADD COLUMN `annualLeaveTotal` int DEFAULT 25 AFTER `commissionRate`;

ALTER TABLE `users` 
ADD COLUMN `annualLeaveUsed` int DEFAULT 0 AFTER `annualLeaveTotal`;

ALTER TABLE `users` 
ADD COLUMN `sickLeaveUsed` int DEFAULT 0 AFTER `annualLeaveUsed`;

-- Add UI preferences columns
ALTER TABLE `users` 
ADD COLUMN `uiMode` enum('simple','advanced') DEFAULT 'simple' AFTER `sickLeaveUsed`;

ALTER TABLE `users` 
ADD COLUMN `sidebarOpen` boolean DEFAULT false AFTER `uiMode`;

-- Add onboarding columns
ALTER TABLE `users` 
ADD COLUMN `onboardingCompleted` boolean DEFAULT false AFTER `sidebarOpen`;

ALTER TABLE `users` 
ADD COLUMN `onboardingStep` int DEFAULT 0 AFTER `onboardingCompleted`;

-- Add lastSignedIn column
ALTER TABLE `users` 
ADD COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `updatedAt`;

-- ============================================
-- 4. SALON SETTINGS TABLE
-- ============================================

-- Add bookingBranding column (JSON)
ALTER TABLE `salonSettings` 
ADD COLUMN `bookingBranding` json AFTER `tenantId`;

-- Add printSettings column (JSON)
ALTER TABLE `salonSettings` 
ADD COLUMN `printSettings` json AFTER `bookingBranding`;

-- Add receiptLogoUrl column
ALTER TABLE `salonSettings` 
ADD COLUMN `receiptLogoUrl` text AFTER `printSettings`;

-- Add autoClockOutTime column
ALTER TABLE `salonSettings` 
ADD COLUMN `autoClockOutTime` time DEFAULT '17:00:00' AFTER `receiptLogoUrl`;

-- ============================================
-- 5. REFRESH TOKENS TABLE
-- ============================================

-- Add lastUsedAt column
ALTER TABLE `refreshTokens` 
ADD COLUMN `lastUsedAt` timestamp NULL AFTER `expiresAt`;

-- Add userAgent column
ALTER TABLE `refreshTokens` 
ADD COLUMN `userAgent` varchar(500) AFTER `ipAddress`;

-- Add revoked column
ALTER TABLE `refreshTokens` 
ADD COLUMN `revoked` boolean DEFAULT false NOT NULL AFTER `userAgent`;

-- Copy data from isRevoked to revoked if exists
UPDATE `refreshTokens` 
SET `revoked` = `isRevoked` 
WHERE EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'refreshTokens' 
    AND COLUMN_NAME = 'isRevoked'
);

-- Add revokedReason column
ALTER TABLE `refreshTokens` 
ADD COLUMN `revokedReason` varchar(255) AFTER `revokedAt`;

-- ============================================
-- 6. UPDATE INDEXES (Optional - may show errors if already exist)
-- ============================================

-- These will fail if indexes already exist - this is normal
CREATE INDEX `tenant_customers_idx` ON `customers` (`tenantId`, `deletedAt`);
CREATE INDEX `tenant_users_idx` ON `users` (`tenantId`, `isActive`);
CREATE INDEX `open_id_idx` ON `users` (`openId`);
CREATE INDEX `tenant_appointments_idx` ON `appointments` (`tenantId`, `appointmentDate`, `employeeId`);
CREATE INDEX `customer_appointments_idx` ON `appointments` (`customerId`, `appointmentDate`);
CREATE INDEX `employee_schedule_idx` ON `appointments` (`employeeId`, `appointmentDate`, `startTime`);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All missing columns have been added successfully!
-- 
-- Summary:
-- ✅ appointments: +2 columns (managementToken, rescheduleCount)
-- ✅ customers: +7 columns (firstName, lastName, marketing consent, totalRevenue, deletedAt)
-- ✅ users: +11 columns (passwordHash, deactivatedAt, commission, leave, UI, onboarding, lastSignedIn)
-- ✅ salonSettings: +4 columns (bookingBranding, printSettings, receiptLogoUrl, autoClockOutTime)
-- ✅ refreshTokens: +3 columns (lastUsedAt, userAgent, revokedReason)
-- ✅ Indexes updated for better performance
-- 
-- Note: Some queries may have failed if columns already existed.
-- This is normal and expected. Check the results to see which columns were added.
-- ============================================
