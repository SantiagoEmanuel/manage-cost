ALTER TABLE `users` ADD `monthly_income` real DEFAULT 0 NOT NULL;

CREATE TABLE `fixed_expenses` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `description` text NOT NULL,
  `amount` real NOT NULL,
  `currency` text DEFAULT 'USD' NOT NULL,
  `category` text DEFAULT 'general' NOT NULL,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` text DEFAULT (current_timestamp) NOT NULL,
  `updated_at` text DEFAULT (current_timestamp) NOT NULL
);
