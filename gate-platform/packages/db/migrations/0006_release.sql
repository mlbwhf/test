-- Sprint 6: delivery-linked release, instructor fees, payouts, cohort risk and cancellation.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS release_policy                text NOT NULL DEFAULT 'on_delivery',
  ADD COLUMN IF NOT EXISTS release_grace_hours           integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS min_enrollment_decision_days  integer NOT NULL DEFAULT 7;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_release_policy_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_release_policy_check CHECK (release_policy IN ('immediate','on_delivery'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS instructor_fees jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS at_risk_at      timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at    timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason   text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS held_minor   bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS funds_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS released_at  timestamptz;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_funds_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_funds_status_check CHECK (funds_status IN ('none','held','released'));

CREATE TABLE IF NOT EXISTS payouts (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations (id),
  party_id        text REFERENCES parties (id),
  currency        char(3) NOT NULL,
  amount_minor    bigint NOT NULL CHECK (amount_minor > 0),
  method          text NOT NULL CHECK (method IN ('bank_transfer','wire','other')),
  reference       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payouts_org_idx ON payouts (organization_id, created_at DESC);
