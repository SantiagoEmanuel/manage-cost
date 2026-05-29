ALTER TABLE `settlements` ADD `payment_method` text DEFAULT 'cash' NOT NULL;--> statement-breakpoint
ALTER TABLE `settlements` ADD `reference` text;--> statement-breakpoint
ALTER TABLE `settlements` ADD `paid_at` text DEFAULT (current_timestamp) NOT NULL;