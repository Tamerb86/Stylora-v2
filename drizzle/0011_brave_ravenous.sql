ALTER TABLE `paymentProviders` MODIFY COLUMN `providerType` enum('stripe_terminal','vipps','nets','manual_card','cash','generic') NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentProviders` MODIFY COLUMN `accessToken` text;--> statement-breakpoint
ALTER TABLE `paymentProviders` MODIFY COLUMN `refreshToken` text;--> statement-breakpoint
ALTER TABLE `paymentProviders` MODIFY COLUMN `tokenExpiresAt` datetime(3);--> statement-breakpoint
ALTER TABLE `communicationSettings` ADD `useSystemEmailDefaults` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentSettings` DROP COLUMN `stripePublishableKey`;--> statement-breakpoint
ALTER TABLE `paymentSettings` DROP COLUMN `stripeSecretKey`;--> statement-breakpoint
ALTER TABLE `paymentSettings` DROP COLUMN `stripeTestMode`;--> statement-breakpoint
ALTER TABLE `paymentSettings` DROP COLUMN `stripeAccessToken`;--> statement-breakpoint
ALTER TABLE `paymentSettings` DROP COLUMN `stripeRefreshToken`;