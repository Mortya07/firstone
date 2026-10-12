ALTER TABLE `images` ADD `bytes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `images` ADD `state` text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_images_owner` ON `images` (`owner`);--> statement-breakpoint
CREATE INDEX `idx_images_cleanup` ON `images` (`state`,`created_at`);--> statement-breakpoint
ALTER TABLE `rate_limits` ADD `expires_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_rate_limits_expiry` ON `rate_limits` (`expires_at`);