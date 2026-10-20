-- Payment reminders EnrollClass has emailed for an open invoice.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminders jsonb NOT NULL DEFAULT '[]';
