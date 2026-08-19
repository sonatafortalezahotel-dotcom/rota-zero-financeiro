ALTER TABLE `bank_entries` ADD `destination_account` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `bank_entries` ADD `context` text DEFAULT 'review' NOT NULL;
