CREATE TABLE `fixed_expense_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`fixed_expense_id` text NOT NULL,
	`user_id` text NOT NULL,
	`applied_month` text NOT NULL,
	`expense_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);