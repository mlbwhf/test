-- Verified badges issued outside classes: earners imported from Credly, Accredible, Badgr…, or issued directly.
CREATE TABLE IF NOT EXISTS badge_awards (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations (id),
  course_id       text NOT NULL REFERENCES courses (id),
  badge           jsonb NOT NULL,
  recipient_name  text NOT NULL,
  recipient_email text NOT NULL,
  issued_at       timestamptz NOT NULL,
  verify_code     text NOT NULL UNIQUE,
  revoked_at      timestamptz,
  source          text NOT NULL CHECK (source IN ('import','direct')),
  imported_from   text,
  billable        boolean NOT NULL DEFAULT false,
  notified_at     timestamptz,
  created_at      timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS badge_awards_course_idx ON badge_awards (course_id);
CREATE INDEX IF NOT EXISTS badge_awards_org_idx ON badge_awards (organization_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS badge_awards_course_email_key ON badge_awards (course_id, lower(recipient_email));
