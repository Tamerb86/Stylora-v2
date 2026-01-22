-- ============================================
-- Stylora Database Indexes Script
-- ============================================
-- This script creates all indexes for better performance
-- Run this AFTER the main setup script
-- ============================================

-- Appointments indexes
CREATE INDEX `tenantId_idx` ON `appointments` (`tenantId`);
CREATE INDEX `customerId_idx` ON `appointments` (`customerId`);
CREATE INDEX `appointmentDate_idx` ON `appointments` (`appointmentDate`);

-- Audit Logs indexes
CREATE INDEX `tenantId_idx` ON `auditLogs` (`tenantId`);
CREATE INDEX `userId_idx` ON `auditLogs` (`userId`);

-- Bulk Campaigns indexes
CREATE INDEX `tenantId_idx` ON `bulkCampaigns` (`tenantId`);

-- Business Hours indexes
CREATE INDEX `tenantId_idx` ON `businessHours` (`tenantId`);

-- Campaign Recipients indexes
CREATE INDEX `campaignId_idx` ON `campaignRecipients` (`campaignId`);
CREATE INDEX `customerId_idx` ON `campaignRecipients` (`customerId`);

-- Communication Templates indexes
CREATE INDEX `tenantId_idx` ON `communicationTemplates` (`tenantId`);

-- Contact Messages indexes
CREATE INDEX `email_idx` ON `contactMessages` (`email`);
CREATE INDEX `status_idx` ON `contactMessages` (`status`);
CREATE INDEX `createdAt_idx` ON `contactMessages` (`createdAt`);

-- Customers indexes
CREATE INDEX `tenantId_idx` ON `customers` (`tenantId`);
CREATE INDEX `email_idx` ON `customers` (`email`);
CREATE INDEX `phone_idx` ON `customers` (`phone`);

-- Data Imports indexes
CREATE INDEX `tenantId_idx` ON `dataImports` (`tenantId`);
CREATE INDEX `status_idx` ON `dataImports` (`status`);
CREATE INDEX `createdBy_idx` ON `dataImports` (`createdBy`);

-- Database Backups indexes
CREATE INDEX `tenantId_idx` ON `databaseBackups` (`tenantId`);

-- Email Templates indexes
CREATE INDEX `tenantId_idx` ON `emailTemplates` (`tenantId`);

-- Email Verifications indexes
CREATE INDEX `tenantId_idx` ON `emailVerifications` (`tenantId`);
CREATE INDEX `token_idx` ON `emailVerifications` (`token`);

-- Employee Leaves indexes
CREATE INDEX `tenantId_idx` ON `employeeLeaves` (`tenantId`);
CREATE INDEX `employeeId_idx` ON `employeeLeaves` (`employeeId`);

-- Employee Schedules indexes
CREATE INDEX `tenantId_idx` ON `employeeSchedules` (`tenantId`);

-- Expenses indexes
CREATE INDEX `tenantId_idx` ON `expenses` (`tenantId`);
CREATE INDEX `expenseDate_idx` ON `expenses` (`expenseDate`);
CREATE INDEX `createdBy_idx` ON `expenses` (`createdBy`);

-- Fiken Customer Mapping indexes
CREATE INDEX `tenantId_idx` ON `fikenCustomerMapping` (`tenantId`);
CREATE INDEX `customerId_idx` ON `fikenCustomerMapping` (`customerId`);
CREATE INDEX `fikenCustomerId_idx` ON `fikenCustomerMapping` (`fikenCustomerId`);

-- Fiken Invoice Mapping indexes
CREATE INDEX `tenantId_idx` ON `fikenInvoiceMapping` (`tenantId`);
CREATE INDEX `orderId_idx` ON `fikenInvoiceMapping` (`orderId`);
CREATE INDEX `fikenInvoiceId_idx` ON `fikenInvoiceMapping` (`fikenInvoiceId`);

-- Fiken Product Mapping indexes
CREATE INDEX `tenantId_idx` ON `fikenProductMapping` (`tenantId`);
CREATE INDEX `productId_idx` ON `fikenProductMapping` (`productId`);
CREATE INDEX `fikenProductId_idx` ON `fikenProductMapping` (`fikenProductId`);

-- Fiken Settings indexes
CREATE INDEX `tenantId_idx` ON `fikenSettings` (`tenantId`);

-- Fiken Sync Log indexes
CREATE INDEX `tenantId_idx` ON `fikenSyncLog` (`tenantId`);
CREATE INDEX `syncType_idx` ON `fikenSyncLog` (`syncType`);
CREATE INDEX `entityId_idx` ON `fikenSyncLog` (`entityId`);

-- Loyalty Points indexes
CREATE INDEX `tenantId_idx` ON `loyaltyPoints` (`tenantId`);
CREATE INDEX `customerId_idx` ON `loyaltyPoints` (`customerId`);

-- Loyalty Redemptions indexes
CREATE INDEX `tenantId_idx` ON `loyaltyRedemptions` (`tenantId`);
CREATE INDEX `customerId_idx` ON `loyaltyRedemptions` (`customerId`);
CREATE INDEX `rewardId_idx` ON `loyaltyRedemptions` (`rewardId`);

-- Loyalty Rewards indexes
CREATE INDEX `tenantId_idx` ON `loyaltyRewards` (`tenantId`);

-- Loyalty Transactions indexes
CREATE INDEX `tenantId_idx` ON `loyaltyTransactions` (`tenantId`);
CREATE INDEX `customerId_idx` ON `loyaltyTransactions` (`customerId`);

-- Notifications indexes
CREATE INDEX `tenantId_idx` ON `notifications` (`tenantId`);
CREATE INDEX `status_idx` ON `notifications` (`status`);

-- Order Items indexes
CREATE INDEX `orderId_idx` ON `orderItems` (`orderId`);

-- Orders indexes
CREATE INDEX `tenantId_idx` ON `orders` (`tenantId`);
CREATE INDEX `customerId_idx` ON `orders` (`customerId`);

-- Payment Providers indexes
CREATE INDEX `tenantId_idx` ON `paymentProviders` (`tenantId`);

-- Payment Splits indexes
CREATE INDEX `tenantId_idx` ON `paymentSplits` (`tenantId`);
CREATE INDEX `paymentId_idx` ON `paymentSplits` (`paymentId`);
CREATE INDEX `orderId_idx` ON `paymentSplits` (`orderId`);

-- Payments indexes
CREATE INDEX `tenantId_idx` ON `payments` (`tenantId`);
CREATE INDEX `orderId_idx` ON `payments` (`orderId`);
CREATE INDEX `customerId_idx` ON `payments` (`customerId`);
CREATE INDEX `status_idx` ON `payments` (`status`);
CREATE INDEX `transactionId_idx` ON `payments` (`transactionId`);

-- Product Categories indexes
CREATE INDEX `tenantId_idx` ON `productCategories` (`tenantId`);

-- Products indexes
CREATE INDEX `tenantId_idx` ON `products` (`tenantId`);
CREATE INDEX `categoryId_idx` ON `products` (`categoryId`);

-- Recurrence Rules indexes
CREATE INDEX `tenantId_idx` ON `recurrenceRules` (`tenantId`);

-- Refresh Tokens indexes
CREATE INDEX `token_idx` ON `refreshTokens` (`token`);
CREATE INDEX `userId_idx` ON `refreshTokens` (`userId`);
CREATE INDEX `tenantId_idx` ON `refreshTokens` (`tenantId`);
CREATE INDEX `expiresAt_idx` ON `refreshTokens` (`expiresAt`);

-- Refunds indexes
CREATE INDEX `tenantId_idx` ON `refunds` (`tenantId`);
CREATE INDEX `paymentId_idx` ON `refunds` (`paymentId`);
CREATE INDEX `orderId_idx` ON `refunds` (`orderId`);
CREATE INDEX `createdBy_idx` ON `refunds` (`createdBy`);

-- Salon Holidays indexes
CREATE INDEX `tenantId_idx` ON `salonHolidays` (`tenantId`);

-- Salon Settings indexes
CREATE INDEX `tenantId_idx` ON `salonSettings` (`tenantId`);

-- Service Categories indexes
CREATE INDEX `tenantId_idx` ON `serviceCategories` (`tenantId`);

-- Services indexes
CREATE INDEX `tenantId_idx` ON `services` (`tenantId`);

-- Tenants indexes
CREATE INDEX `subdomain_idx` ON `tenants` (`subdomain`);
CREATE INDEX `status_idx` ON `tenants` (`status`);

-- Timesheets indexes
CREATE INDEX `tenantId_idx` ON `timesheets` (`tenantId`);
CREATE INDEX `employeeId_idx` ON `timesheets` (`employeeId`);

-- Unimicro Customer Mapping indexes
CREATE INDEX `tenantId_idx` ON `unimicroCustomerMapping` (`tenantId`);
CREATE INDEX `customerId_idx` ON `unimicroCustomerMapping` (`customerId`);

-- Unimicro Invoice Mapping indexes
CREATE INDEX `tenantId_idx` ON `unimicroInvoiceMapping` (`tenantId`);
CREATE INDEX `orderId_idx` ON `unimicroInvoiceMapping` (`orderId`);
CREATE INDEX `unimicroInvoiceId_idx` ON `unimicroInvoiceMapping` (`unimicroInvoiceId`);

-- Unimicro Settings indexes
CREATE INDEX `tenantId_idx` ON `unimicroSettings` (`tenantId`);

-- Unimicro Sync Log indexes
CREATE INDEX `tenantId_idx` ON `unimicroSyncLog` (`tenantId`);
CREATE INDEX `syncType_idx` ON `unimicroSyncLog` (`syncType`);
CREATE INDEX `entityId_idx` ON `unimicroSyncLog` (`entityId`);

-- Users indexes
CREATE INDEX `tenantId_idx` ON `users` (`tenantId`);
CREATE INDEX `email_idx` ON `users` (`email`);

-- Walk-In Queue indexes
CREATE INDEX `tenantId_idx` ON `walkInQueue` (`tenantId`);
CREATE INDEX `status_idx` ON `walkInQueue` (`status`);

-- Appointment History indexes
CREATE INDEX `appointmentId_idx` ON `appointmentHistory` (`appointmentId`);
CREATE INDEX `action_idx` ON `appointmentHistory` (`action`);
CREATE INDEX `changedBy_idx` ON `appointmentHistory` (`changedBy`);
CREATE INDEX `createdAt_idx` ON `appointmentHistory` (`createdAt`);

-- ============================================
-- INDEXES CREATED SUCCESSFULLY
-- ============================================
-- All indexes have been created to improve query performance
-- ============================================
