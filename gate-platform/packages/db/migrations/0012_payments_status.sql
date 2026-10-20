-- Last known state of the organizer's payments account (charges and payouts enabled,
-- outstanding requirements). Refreshed from the provider; never inferred from the
-- mere existence of an account.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS payments_status jsonb;
