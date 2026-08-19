CREATE TABLE `debts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`original` real NOT NULL,
	`balance` real NOT NULL,
	`installment` real NOT NULL,
	`due_day` integer NOT NULL,
	`total_installments` integer NOT NULL,
	`paid_installments` integer DEFAULT 0 NOT NULL,
	`late_amount` real DEFAULT 0 NOT NULL,
	`late_count` integer DEFAULT 0 NOT NULL,
	`color` text DEFAULT '#b8f23d' NOT NULL,
	`entry_pending` real DEFAULT 0 NOT NULL,
	`starts` text DEFAULT '' NOT NULL,
	`payment_history` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`target` real NOT NULL,
	`current` real DEFAULT 0 NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'save' NOT NULL,
	`color` text DEFAULT '#b8f23d' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`due_day` integer,
	`month_key` text,
	`recurring` integer DEFAULT false NOT NULL,
	`status_months` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
