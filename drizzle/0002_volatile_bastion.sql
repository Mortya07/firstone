CREATE TABLE `crm_clients` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_crm_clients_owner` ON `crm_clients` (`owner`,`updated_at`);--> statement-breakpoint
CREATE TABLE `crm_deals` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`client_id` text NOT NULL,
	`title` text NOT NULL,
	`work_type` text NOT NULL,
	`stage` text NOT NULL,
	`budget` integer DEFAULT 0 NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_crm_deals_owner` ON `crm_deals` (`owner`,`updated_at`);--> statement-breakpoint
CREATE TABLE `crm_interests` (
	`owner` text PRIMARY KEY NOT NULL,
	`plan` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crm_subscriptions` (
	`owner` text PRIMARY KEY NOT NULL,
	`plan` text DEFAULT 'start' NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`active_until` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crm_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`deal_id` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_crm_tasks_owner` ON `crm_tasks` (`owner`,`updated_at`);