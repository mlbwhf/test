-- Payment modes. Protected (default): EnrollClass charges learners and holds the money until
-- delivery. Direct: learners pay the organizer's own Stripe account (a separate connected
-- account) and EnrollClass takes an application fee.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'protected' CHECK (payment_mode IN ('protected','direct'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS direct_account_ref text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS direct_status jsonb;
-- Orders and seat-change fees charged on the organizer's own account.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS settlement text CHECK (settlement IN ('direct'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS charge_account_ref text;
ALTER TABLE seat_transfers ADD COLUMN IF NOT EXISTS charge_account_ref text;
