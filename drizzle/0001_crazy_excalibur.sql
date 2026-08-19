CREATE TABLE `app_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bank_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_date` text NOT NULL,
	`month_key` text NOT NULL,
	`account` text DEFAULT 'Conta principal' NOT NULL,
	`description` text NOT NULL,
	`counterparty` text DEFAULT '' NOT NULL,
	`amount` real NOT NULL,
	`flow` text NOT NULL,
	`direction` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`document` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
