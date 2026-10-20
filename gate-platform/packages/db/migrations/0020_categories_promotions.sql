-- Class finder: course topics and paid placements.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category text;

CREATE TABLE IF NOT EXISTS promotions (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  course_id text NOT NULL REFERENCES courses(id),
  placement text NOT NULL CHECK (placement IN ('category', 'top')),
  weeks integer NOT NULL CHECK (weeks > 0),
  amount_minor bigint NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,
  payment_ref text UNIQUE,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS promotions_active ON promotions (status, ends_at);
CREATE INDEX IF NOT EXISTS promotions_org ON promotions (organization_id, created_at);
