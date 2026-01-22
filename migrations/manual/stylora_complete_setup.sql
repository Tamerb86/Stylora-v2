-- ============================================
-- Stylora Database Complete Setup Script
-- ============================================
-- This script will:
-- 1. Create all database tables
-- 2. Create SaaS Admin account (tamerb86@gmail.com)
-- 3. Create Timo Test salon with account (tamerb86@outlook.com)
-- ============================================

-- Drop existing tables if they exist (optional - uncomment if needed)
-- DROP TABLE IF EXISTS walkInQueue;
-- DROP TABLE IF EXISTS users;
-- ... (add all tables if needed)

-- ============================================
-- CREATE ALL TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS `appointmentServices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`serviceId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	CONSTRAINT `appointmentServices_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`employeeId` int NOT NULL,
	`appointmentDate` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`status` enum('pending','confirmed','completed','canceled','no_show') DEFAULT 'pending',
	`cancellationReason` text,
	`canceledBy` enum('customer','staff','system'),
	`canceledAt` timestamp,
	`isLateCancellation` boolean DEFAULT false,
	`notes` text,
	`recurrenceRuleId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`beforeValue` json,
	`afterValue` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `bulkCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('sms','email') NOT NULL,
	`templateId` int,
	`subject` varchar(255),
	`content` text NOT NULL,
	`status` enum('draft','scheduled','sending','completed','failed') DEFAULT 'draft',
	`recipientCount` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`deliveredCount` int DEFAULT 0,
	`failedCount` int DEFAULT 0,
	`openedCount` int DEFAULT 0,
	`clickedCount` int DEFAULT 0,
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulkCampaigns_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `businessHours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`dayOfWeek` int NOT NULL,
	`isOpen` boolean NOT NULL DEFAULT true,
	`openTime` time,
	`closeTime` time,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessHours_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_tenant_day` UNIQUE(`tenantId`,`dayOfWeek`)
);

CREATE TABLE IF NOT EXISTS `campaignRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`customerId` int NOT NULL,
	`recipientContact` varchar(320) NOT NULL,
	`status` enum('pending','sent','delivered','failed','opened','clicked') DEFAULT 'pending',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignRecipients_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `communicationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`smsProvider` varchar(50),
	`smsApiKey` text,
	`smsApiSecret` text,
	`smsSenderName` varchar(11),
	`smsEnabled` boolean DEFAULT false,
	`emailProvider` varchar(50),
	`emailApiKey` text,
	`emailFromAddress` varchar(320),
	`emailFromName` varchar(255),
	`emailEnabled` boolean DEFAULT false,
	`appointmentReminderEnabled` boolean DEFAULT true,
	`appointmentReminderHours` int DEFAULT 24,
	`appointmentConfirmationEnabled` boolean DEFAULT true,
	`marketingEnabled` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communicationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `communicationSettings_tenantId_unique` UNIQUE(`tenantId`)
);

CREATE TABLE IF NOT EXISTS `communicationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('sms','email') NOT NULL,
	`category` varchar(50) NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communicationTemplates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `contactMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`company` varchar(255),
	`message` text NOT NULL,
	`status` enum('new','read','replied','archived') DEFAULT 'new',
	`source` varchar(50) DEFAULT 'website',
	`ipAddress` varchar(45),
	`userAgent` text,
	`repliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contactMessages_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`dateOfBirth` date,
	`gender` enum('male','female','other'),
	`address` text,
	`notes` text,
	`tags` json,
	`noShowCount` int DEFAULT 0,
	`lateCancellationCount` int DEFAULT 0,
	`requirePrepayment` boolean DEFAULT false,
	`totalSpent` decimal(10,2) DEFAULT '0.00',
	`totalVisits` int DEFAULT 0,
	`lastVisitDate` date,
	`preferredEmployeeId` int,
	`marketingConsent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `dataImports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`type` enum('customers','services','products','appointments') NOT NULL,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text,
	`totalRows` int DEFAULT 0,
	`processedRows` int DEFAULT 0,
	`successRows` int DEFAULT 0,
	`failedRows` int DEFAULT 0,
	`errorLog` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `dataImports_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `databaseBackups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` bigint NOT NULL,
	`fileUrl` text,
	`status` enum('pending','completed','failed') DEFAULT 'pending',
	`type` enum('manual','scheduled') DEFAULT 'scheduled',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `databaseBackups_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlContent` text NOT NULL,
	`textContent` text,
	`category` varchar(50),
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `emailVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailVerifications_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `employeeLeaves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`employeeId` int NOT NULL,
	`leaveType` enum('vacation','sick','personal','other') NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`startTime` time,
	`endTime` time,
	`isFullDay` boolean DEFAULT true,
	`reason` text,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeLeaves_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `employeeSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`employeeId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeSchedules_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`expenseDate` date NOT NULL,
	`receiptUrl` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `fikenCustomerMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`fikenCustomerId` int NOT NULL,
	`fikenCustomerNumber` varchar(50),
	`lastSyncedAt` timestamp,
	`syncStatus` enum('pending','synced','failed') DEFAULT 'pending',
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fikenCustomerMapping_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `fikenInvoiceMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`orderId` int NOT NULL,
	`fikenInvoiceId` int NOT NULL,
	`fikenInvoiceNumber` varchar(50),
	`fikenDraftId` int,
	`fikenSaleId` int,
	`invoiceStatus` varchar(50),
	`lastSyncedAt` timestamp,
	`syncStatus` enum('pending','synced','failed') DEFAULT 'pending',
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fikenInvoiceMapping_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `fikenProductMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`productId` int NOT NULL,
	`fikenProductId` int NOT NULL,
	`fikenProductNumber` varchar(50),
	`lastSyncedAt` timestamp,
	`syncStatus` enum('pending','synced','failed') DEFAULT 'pending',
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fikenProductMapping_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `fikenSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`companySlug` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`enabled` boolean DEFAULT false,
	`autoSyncCustomers` boolean DEFAULT true,
	`autoSyncInvoices` boolean DEFAULT true,
	`autoSyncProducts` boolean DEFAULT false,
	`defaultVatCode` varchar(10) DEFAULT '3',
	`defaultIncomeAccount` varchar(20) DEFAULT '3000',
	`defaultProductAccount` varchar(20) DEFAULT '3400',
	`lastCustomerSync` timestamp,
	`lastInvoiceSync` timestamp,
	`lastProductSync` timestamp,
	`syncErrors` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fikenSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `fikenSettings_tenantId_unique` UNIQUE(`tenantId`)
);

CREATE TABLE IF NOT EXISTS `fikenSyncLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`syncType` enum('customer','invoice','product') NOT NULL,
	`entityId` int NOT NULL,
	`fikenEntityId` int,
	`status` enum('success','failed') NOT NULL,
	`errorMessage` text,
	`requestPayload` json,
	`responsePayload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fikenSyncLog_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `loyaltyPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`points` int DEFAULT 0,
	`lifetimePoints` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyaltyPoints_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `loyaltyRedemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`rewardId` int NOT NULL,
	`orderId` int,
	`pointsUsed` int NOT NULL,
	`discountAmount` decimal(10,2),
	`status` enum('pending','redeemed','expired','canceled') DEFAULT 'pending',
	`redeemedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyaltyRedemptions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `loyaltyRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`pointsCost` int NOT NULL,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyaltyRewards_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `loyaltyTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`orderId` int,
	`type` enum('earned','redeemed','expired','adjusted') NOT NULL,
	`points` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyaltyTransactions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`userId` int,
	`customerId` int,
	`type` enum('sms','email','push','in_app') NOT NULL,
	`category` enum('appointment_reminder','appointment_confirmation','marketing','system') NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`status` enum('pending','sent','delivered','failed') DEFAULT 'pending',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`failedAt` timestamp,
	`errorMessage` text,
	`retryCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`type` enum('service','product') NOT NULL,
	`itemId` int NOT NULL,
	`name` text NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`price` decimal(10,2) NOT NULL,
	`discount` decimal(10,2) DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int,
	`employeeId` int NOT NULL,
	`appointmentId` int,
	`orderNumber` varchar(50) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`discount` decimal(10,2) DEFAULT '0.00',
	`tax` decimal(10,2) DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`status` enum('pending','completed','refunded','canceled') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `paymentProviders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`provider` enum('stripe','vipps','izettle','cash') NOT NULL,
	`enabled` boolean DEFAULT false,
	`isDefault` boolean DEFAULT false,
	`displayName` varchar(100),
	`apiKey` text,
	`apiSecret` text,
	`webhookSecret` text,
	`merchantId` varchar(255),
	`terminalId` varchar(255),
	`testMode` boolean DEFAULT true,
	`configuration` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentProviders_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `paymentSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`stripeEnabled` boolean DEFAULT false,
	`stripePublishableKey` text,
	`stripeSecretKey` text,
	`stripeWebhookSecret` text,
	`vippsEnabled` boolean DEFAULT false,
	`vippsClientId` text,
	`vippsClientSecret` text,
	`vippsMerchantSerialNumber` text,
	`vippsSubscriptionKey` text,
	`iZettleEnabled` boolean DEFAULT false,
	`iZettleApiKey` text,
	`cashEnabled` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentSettings_tenantId_unique` UNIQUE(`tenantId`)
);

CREATE TABLE IF NOT EXISTS `paymentSplits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`paymentId` int NOT NULL,
	`orderId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('cash','card','vipps','invoice','other') NOT NULL,
	`transactionId` varchar(255),
	`status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
	`metadata` json,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentSplits_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`orderId` int NOT NULL,
	`customerId` int,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'NOK',
	`paymentMethod` enum('cash','card','vipps','invoice','other') NOT NULL,
	`status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
	`transactionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`vippsOrderId` varchar(255),
	`iZettlePaymentId` varchar(255),
	`metadata` json,
	`receiptUrl` text,
	`receiptNumber` varchar(50),
	`paidAt` timestamp,
	`refundedAt` timestamp,
	`refundAmount` decimal(10,2),
	`refundReason` text,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `productCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productCategories_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sku` varchar(100),
	`barcode` varchar(100),
	`categoryId` int,
	`price` decimal(10,2) NOT NULL,
	`cost` decimal(10,2),
	`stock` int DEFAULT 0,
	`lowStockThreshold` int DEFAULT 5,
	`imageUrl` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `recurrenceRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`employeeId` int NOT NULL,
	`frequency` enum('weekly','biweekly','monthly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurrenceRules_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `refreshTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`isRevoked` boolean DEFAULT false,
	`revokedAt` timestamp,
	`revokedReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refreshTokens_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `refunds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`paymentId` int NOT NULL,
	`orderId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reason` text,
	`status` enum('pending','completed','failed') DEFAULT 'pending',
	`stripeRefundId` varchar(255),
	`vippsRefundId` varchar(255),
	`processedAt` timestamp,
	`failureReason` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `salonHolidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`isRecurring` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salonHolidays_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `salonSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`bookingWindowDays` int DEFAULT 30,
	`slotDuration` int DEFAULT 15,
	`bufferTime` int DEFAULT 5,
	`maxAdvanceBookingDays` int DEFAULT 60,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salonSettings_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `serviceCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `serviceCategories_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`categoryId` int,
	`duration` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`billingPeriod` enum('monthly','yearly') NOT NULL,
	`features` json,
	`maxEmployees` int,
	`maxLocations` int,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `tenantSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`planId` int NOT NULL,
	`status` enum('trial','active','canceled','expired') DEFAULT 'trial',
	`startDate` date NOT NULL,
	`endDate` date,
	`canceledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenantSubscriptions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `tenants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(63) NOT NULL,
	`orgNumber` varchar(9),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`logoUrl` text,
	`primaryColor` varchar(7),
	`timezone` varchar(50) DEFAULT 'Europe/Oslo',
	`currency` varchar(3) DEFAULT 'NOK',
	`vatRate` decimal(5,2) DEFAULT '25.00',
	`status` enum('trial','active','suspended','canceled') DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`emailVerified` boolean DEFAULT false NOT NULL,
	`emailVerifiedAt` timestamp,
	`onboardingCompleted` boolean DEFAULT false NOT NULL,
	`onboardingStep` enum('welcome','service','employee','hours','complete') DEFAULT 'welcome',
	`onboardingCompletedAt` timestamp,
	`wizardDraftData` json,
	`cancellationWindowHours` int DEFAULT 24,
	`noShowThresholdForPrepayment` int DEFAULT 2,
	`requirePrepayment` boolean DEFAULT false NOT NULL,
	`smsPhoneNumber` varchar(20),
	`smsProvider` enum('mock','pswincom','linkmobility','twilio'),
	`smsApiKey` varchar(255),
	`smsApiSecret` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_subdomain_unique` UNIQUE(`subdomain`)
);

CREATE TABLE IF NOT EXISTS `timesheets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`employeeId` int NOT NULL,
	`clockInTime` timestamp NOT NULL,
	`clockOutTime` timestamp,
	`breakDuration` int DEFAULT 0,
	`totalHours` decimal(5,2),
	`notes` text,
	`status` enum('clocked_in','clocked_out','approved','rejected') DEFAULT 'clocked_in',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timesheets_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `unimicroCustomerMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`unimicroCustomerId` varchar(50) NOT NULL,
	`lastSyncedAt` timestamp,
	`syncStatus` enum('pending','synced','failed') DEFAULT 'pending',
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unimicroCustomerMapping_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `unimicroInvoiceMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`orderId` int NOT NULL,
	`unimicroInvoiceId` varchar(50) NOT NULL,
	`invoiceStatus` varchar(50),
	`lastSyncedAt` timestamp,
	`syncStatus` enum('pending','synced','failed') DEFAULT 'pending',
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unimicroInvoiceMapping_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `unimicroSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`companyId` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`enabled` boolean DEFAULT false,
	`autoSyncCustomers` boolean DEFAULT true,
	`autoSyncInvoices` boolean DEFAULT true,
	`autoSyncProducts` boolean DEFAULT false,
	`defaultVatCode` varchar(10) DEFAULT '3',
	`defaultIncomeAccount` varchar(20) DEFAULT '3000',
	`defaultProductAccount` varchar(20) DEFAULT '3400',
	`lastCustomerSync` timestamp,
	`lastInvoiceSync` timestamp,
	`lastProductSync` timestamp,
	`syncErrors` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unimicroSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `unimicroSettings_tenantId_unique` UNIQUE(`tenantId`)
);

CREATE TABLE IF NOT EXISTS `unimicroSyncLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`syncType` enum('customer','invoice','product') NOT NULL,
	`entityId` int NOT NULL,
	`unimicroEntityId` varchar(50),
	`status` enum('success','failed') NOT NULL,
	`errorMessage` text,
	`requestPayload` json,
	`responsePayload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unimicroSyncLog_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`openId` varchar(64) NOT NULL,
	`email` varchar(320),
	`name` text,
	`phone` varchar(20),
	`loginMethod` varchar(64),
	`password` text,
	`role` enum('owner','admin','employee','customer') DEFAULT 'customer',
	`pin` varchar(6),
	`hourlyRate` decimal(10,2),
	`commissionRate` decimal(5,2),
	`isActive` boolean DEFAULT true,
	`avatarUrl` text,
	`dateOfBirth` date,
	`hireDate` date,
	`terminationDate` date,
	`emergencyContact` text,
	`notes` text,
	`permissions` json,
	`lastLoginAt` timestamp,
	`sidebarState` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

CREATE TABLE IF NOT EXISTS `walkInQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(20),
	`customerId` int,
	`serviceId` int,
	`preferredEmployeeId` int,
	`partySize` int DEFAULT 1,
	`estimatedWaitTime` int,
	`status` enum('waiting','in_service','completed','canceled','no_show') DEFAULT 'waiting',
	`notes` text,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`calledAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walkInQueue_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `appointmentHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`action` enum('created','updated','canceled','completed','no_show') NOT NULL,
	`oldStatus` enum('pending','confirmed','completed','canceled','no_show'),
	`newStatus` enum('pending','confirmed','completed','canceled','no_show'),
	`oldDate` date,
	`newDate` date,
	`oldStartTime` time,
	`newStartTime` time,
	`changedBy` int,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appointmentHistory_id` PRIMARY KEY(`id`)
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `appointments` (`tenantId`);
CREATE INDEX IF NOT EXISTS `customerId_idx` ON `appointments` (`customerId`);
CREATE INDEX IF NOT EXISTS `appointmentDate_idx` ON `appointments` (`appointmentDate`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `auditLogs` (`tenantId`);
CREATE INDEX IF NOT EXISTS `userId_idx` ON `auditLogs` (`userId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `bulkCampaigns` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `businessHours` (`tenantId`);

CREATE INDEX IF NOT EXISTS `campaignId_idx` ON `campaignRecipients` (`campaignId`);
CREATE INDEX IF NOT EXISTS `customerId_idx` ON `campaignRecipients` (`customerId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `communicationTemplates` (`tenantId`);

CREATE INDEX IF NOT EXISTS `email_idx` ON `contactMessages` (`email`);
CREATE INDEX IF NOT EXISTS `status_idx` ON `contactMessages` (`status`);
CREATE INDEX IF NOT EXISTS `createdAt_idx` ON `contactMessages` (`createdAt`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `customers` (`tenantId`);
CREATE INDEX IF NOT EXISTS `email_idx` ON `customers` (`email`);
CREATE INDEX IF NOT EXISTS `phone_idx` ON `customers` (`phone`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `dataImports` (`tenantId`);
CREATE INDEX IF NOT EXISTS `status_idx` ON `dataImports` (`status`);
CREATE INDEX IF NOT EXISTS `createdBy_idx` ON `dataImports` (`createdBy`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `databaseBackups` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `emailTemplates` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `emailVerifications` (`tenantId`);
CREATE INDEX IF NOT EXISTS `token_idx` ON `emailVerifications` (`token`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `employeeLeaves` (`tenantId`);
CREATE INDEX IF NOT EXISTS `employeeId_idx` ON `employeeLeaves` (`employeeId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `employeeSchedules` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `expenses` (`tenantId`);
CREATE INDEX IF NOT EXISTS `expenseDate_idx` ON `expenses` (`expenseDate`);
CREATE INDEX IF NOT EXISTS `createdBy_idx` ON `expenses` (`createdBy`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `fikenCustomerMapping` (`tenantId`);
CREATE INDEX IF NOT EXISTS `customerId_idx` ON `fikenCustomerMapping` (`customerId`);
CREATE INDEX IF NOT EXISTS `fikenCustomerId_idx` ON `fikenCustomerMapping` (`fikenCustomerId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `fikenInvoiceMapping` (`tenantId`);
CREATE INDEX IF NOT EXISTS `orderId_idx` ON `fikenInvoiceMapping` (`orderId`);
CREATE INDEX IF NOT EXISTS `fikenInvoiceId_idx` ON `fikenInvoiceMapping` (`fikenInvoiceId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `fikenProductMapping` (`tenantId`);
CREATE INDEX IF NOT EXISTS `productId_idx` ON `fikenProductMapping` (`productId`);
CREATE INDEX IF NOT EXISTS `fikenProductId_idx` ON `fikenProductMapping` (`fikenProductId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `fikenSettings` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `fikenSyncLog` (`tenantId`);
CREATE INDEX IF NOT EXISTS `syncType_idx` ON `fikenSyncLog` (`syncType`);
CREATE INDEX IF NOT EXISTS `entityId_idx` ON `fikenSyncLog` (`entityId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `loyaltyPoints` (`tenantId`);
CREATE INDEX IF NOT EXISTS `customerId_idx` ON `loyaltyPoints` (`customerId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `loyaltyRedemptions` (`tenantId`);
CREATE INDEX IF NOT EXISTS `customerId_idx` ON `loyaltyRedemptions` (`customerId`);
CREATE INDEX IF NOT EXISTS `rewardId_idx` ON `loyaltyRedemptions` (`rewardId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `loyaltyRewards` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `loyaltyTransactions` (`tenantId`);
CREATE INDEX IF NOT EXISTS `customerId_idx` ON `loyaltyTransactions` (`customerId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `notifications` (`tenantId`);
CREATE INDEX IF NOT EXISTS `status_idx` ON `notifications` (`status`);

CREATE INDEX IF NOT EXISTS `orderId_idx` ON `orderItems` (`orderId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `orders` (`tenantId`);
CREATE INDEX IF NOT EXISTS `customerId_idx` ON `orders` (`customerId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `paymentProviders` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `paymentSplits` (`tenantId`);
CREATE INDEX IF NOT EXISTS `paymentId_idx` ON `paymentSplits` (`paymentId`);
CREATE INDEX IF NOT EXISTS `orderId_idx` ON `paymentSplits` (`orderId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `payments` (`tenantId`);
CREATE INDEX IF NOT EXISTS `orderId_idx` ON `payments` (`orderId`);
CREATE INDEX IF NOT EXISTS `customerId_idx` ON `payments` (`customerId`);
CREATE INDEX IF NOT EXISTS `status_idx` ON `payments` (`status`);
CREATE INDEX IF NOT EXISTS `transactionId_idx` ON `payments` (`transactionId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `productCategories` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `products` (`tenantId`);
CREATE INDEX IF NOT EXISTS `categoryId_idx` ON `products` (`categoryId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `recurrenceRules` (`tenantId`);

CREATE INDEX IF NOT EXISTS `token_idx` ON `refreshTokens` (`token`);
CREATE INDEX IF NOT EXISTS `userId_idx` ON `refreshTokens` (`userId`);
CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `refreshTokens` (`tenantId`);
CREATE INDEX IF NOT EXISTS `expiresAt_idx` ON `refreshTokens` (`expiresAt`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `refunds` (`tenantId`);
CREATE INDEX IF NOT EXISTS `paymentId_idx` ON `refunds` (`paymentId`);
CREATE INDEX IF NOT EXISTS `orderId_idx` ON `refunds` (`orderId`);
CREATE INDEX IF NOT EXISTS `createdBy_idx` ON `refunds` (`createdBy`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `salonHolidays` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `salonSettings` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `serviceCategories` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `services` (`tenantId`);

CREATE INDEX IF NOT EXISTS `subdomain_idx` ON `tenants` (`subdomain`);
CREATE INDEX IF NOT EXISTS `status_idx` ON `tenants` (`status`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `timesheets` (`tenantId`);
CREATE INDEX IF NOT EXISTS `employeeId_idx` ON `timesheets` (`employeeId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `unimicroCustomerMapping` (`tenantId`);
CREATE INDEX IF NOT EXISTS `customerId_idx` ON `unimicroCustomerMapping` (`customerId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `unimicroInvoiceMapping` (`tenantId`);
CREATE INDEX IF NOT EXISTS `orderId_idx` ON `unimicroInvoiceMapping` (`orderId`);
CREATE INDEX IF NOT EXISTS `unimicroInvoiceId_idx` ON `unimicroInvoiceMapping` (`unimicroInvoiceId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `unimicroSettings` (`tenantId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `unimicroSyncLog` (`tenantId`);
CREATE INDEX IF NOT EXISTS `syncType_idx` ON `unimicroSyncLog` (`syncType`);
CREATE INDEX IF NOT EXISTS `entityId_idx` ON `unimicroSyncLog` (`entityId`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `users` (`tenantId`);
CREATE INDEX IF NOT EXISTS `email_idx` ON `users` (`email`);

CREATE INDEX IF NOT EXISTS `tenantId_idx` ON `walkInQueue` (`tenantId`);
CREATE INDEX IF NOT EXISTS `status_idx` ON `walkInQueue` (`status`);

CREATE INDEX IF NOT EXISTS `appointmentId_idx` ON `appointmentHistory` (`appointmentId`);
CREATE INDEX IF NOT EXISTS `action_idx` ON `appointmentHistory` (`action`);
CREATE INDEX IF NOT EXISTS `changedBy_idx` ON `appointmentHistory` (`changedBy`);
CREATE INDEX IF NOT EXISTS `createdAt_idx` ON `appointmentHistory` (`createdAt`);

-- ============================================
-- INSERT INITIAL DATA
-- ============================================

-- 1. Create Timo Test Salon (Tenant)
INSERT INTO `tenants` (
    `id`,
    `name`,
    `subdomain`,
    `email`,
    `phone`,
    `timezone`,
    `currency`,
    `vatRate`,
    `status`,
    `emailVerified`,
    `emailVerifiedAt`,
    `onboardingCompleted`,
    `onboardingStep`,
    `createdAt`,
    `updatedAt`
) VALUES (
    '4c832fcf-7525-46e1-83f4-65dc7cf29562',
    'Timo Test',
    'test',
    'tamerb86@outlook.com',
    NULL,
    'Europe/Oslo',
    'NOK',
    25.00,
    'active',
    true,
    NOW(),
    true,
    'complete',
    NOW(),
    NOW()
);

-- 2. Create SaaS Admin User (Platform Owner)
INSERT INTO `users` (
    `tenantId`,
    `openId`,
    `email`,
    `name`,
    `password`,
    `role`,
    `isActive`,
    `createdAt`,
    `updatedAt`
) VALUES (
    '4c832fcf-7525-46e1-83f4-65dc7cf29562',
    'tamerb86@gmail.com',
    'tamerb86@gmail.com',
    'Platform Admin',
    '$2b$10$nc3YXG5mcD12wd3CjVU4qOU59cxxJRmVNEw./wyHZJd9i95aN7TE6',
    'owner',
    true,
    NOW(),
    NOW()
);

-- 3. Create Salon Owner User
INSERT INTO `users` (
    `tenantId`,
    `openId`,
    `email`,
    `name`,
    `password`,
    `role`,
    `isActive`,
    `createdAt`,
    `updatedAt`
) VALUES (
    '4c832fcf-7525-46e1-83f4-65dc7cf29562',
    'tamerb86@outlook.com',
    'tamerb86@outlook.com',
    'Timo Test Owner',
    '$2b$10$RgERRyFIBwE0evpbJse1k.8MipsiKl4C/71XyNYiFBNUH2/Zf3PLy',
    'owner',
    true,
    NOW(),
    NOW()
);

-- 4. Create default business hours (Monday-Friday 9:00-17:00)
INSERT INTO `businessHours` (`tenantId`, `dayOfWeek`, `isOpen`, `openTime`, `closeTime`, `createdAt`, `updatedAt`)
VALUES
    ('4c832fcf-7525-46e1-83f4-65dc7cf29562', 1, true, '09:00:00', '17:00:00', NOW(), NOW()),
    ('4c832fcf-7525-46e1-83f4-65dc7cf29562', 2, true, '09:00:00', '17:00:00', NOW(), NOW()),
    ('4c832fcf-7525-46e1-83f4-65dc7cf29562', 3, true, '09:00:00', '17:00:00', NOW(), NOW()),
    ('4c832fcf-7525-46e1-83f4-65dc7cf29562', 4, true, '09:00:00', '17:00:00', NOW(), NOW()),
    ('4c832fcf-7525-46e1-83f4-65dc7cf29562', 5, true, '09:00:00', '17:00:00', NOW(), NOW()),
    ('4c832fcf-7525-46e1-83f4-65dc7cf29562', 6, false, NULL, NULL, NOW(), NOW()),
    ('4c832fcf-7525-46e1-83f4-65dc7cf29562', 0, false, NULL, NULL, NOW(), NOW());

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Database tables created successfully!
-- 
-- Accounts created:
-- 1. SaaS Admin: tamerb86@gmail.com / admin12345
-- 2. Salon Owner: tamerb86@outlook.com / admin123456
-- 
-- Salon Details:
-- - Name: Timo Test
-- - Subdomain: test.stylora.no
-- - Status: Active
-- - Email Verified: Yes
-- - Onboarding: Complete
-- ============================================
