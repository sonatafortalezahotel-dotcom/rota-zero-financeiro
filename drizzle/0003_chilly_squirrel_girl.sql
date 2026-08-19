ALTER TABLE `goals` ADD `monthly_plans` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `records` ADD `month_adjustments` text DEFAULT '[]' NOT NULL;