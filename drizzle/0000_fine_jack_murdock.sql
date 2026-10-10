CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mime` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`specialty` text NOT NULL,
	`price` integer NOT NULL,
	`experience` integer NOT NULL,
	`team` integer NOT NULL,
	`description` text NOT NULL,
	`phone` text NOT NULL,
	`projects` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_owner_unique` ON `profiles` (`owner`);--> statement-breakpoint
CREATE INDEX `idx_profiles_updated` ON `profiles` (`updated_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
