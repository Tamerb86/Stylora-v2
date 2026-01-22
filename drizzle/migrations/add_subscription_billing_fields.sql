-- Migration: Add subscription billing fields
-- Date: 2026-01-22
-- Description: Add fields to subscriptionPlans and tenantSubscriptions for Stripe Billing integration

-- Add fields to subscriptionPlans table
ALTER TABLE `subscriptionPlans` 
  ADD COLUMN `displayNameEn` VARCHAR(100) NULL AFTER `displayNameNo`,
  ADD COLUMN `displayNameAr` VARCHAR(100) NULL AFTER `displayNameEn`,
  ADD COLUMN `priceYearly` DECIMAL(10, 2) NULL AFTER `priceMonthly`,
  ADD COLUMN `stripePriceId` VARCHAR(255) NULL AFTER `priceYearly`;

-- Add fields to tenantSubscriptions table
ALTER TABLE `tenantSubscriptions`
  ADD COLUMN `stripeCustomerId` VARCHAR(255) NULL AFTER `stripeSubscriptionId`,
  ADD COLUMN `cancelAtPeriodEnd` BOOLEAN DEFAULT FALSE AFTER `stripeCustomerId`,
  ADD COLUMN `canceledAt` TIMESTAMP NULL AFTER `cancelAtPeriodEnd`;

-- Update existing plans with display names (optional - can be done manually via admin panel)
-- UPDATE `subscriptionPlans` SET 
--   `displayNameEn` = 'Start',
--   `displayNameAr` = 'ابدأ'
-- WHERE `name` = 'Start';

-- UPDATE `subscriptionPlans` SET 
--   `displayNameEn` = 'Professional',
--   `displayNameAr` = 'احترافي'
-- WHERE `name` = 'Pro';

-- UPDATE `subscriptionPlans` SET 
--   `displayNameEn` = 'Premium',
--   `displayNameAr` = 'بريميوم'
-- WHERE `name` = 'Premium';
