-- Sprint 1: courses, cohorts (sessions, time zone, format, instructors), seats, regional price lists.

CREATE TABLE IF NOT EXISTS courses (
  id                 text PRIMARY KEY,
  organization_id    text NOT NULL REFERENCES organizations (id),
  slug               text NOT NULL,
  name               text NOT NULL,
  description        text,
  certification_body text,
  duration_days      integer CHECK (duration_days IS NULL OR duration_days > 0),
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS course_id       text REFERENCES courses (id),
  ADD COLUMN IF NOT EXISTS ends_at         timestamptz,
  ADD COLUMN IF NOT EXISTS timezone        text NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS format          text NOT NULL DEFAULT 'live_virtual',
  ADD COLUMN IF NOT EXISTS sessions        jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instructor_ids  jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS min_enrollment  integer CHECK (min_enrollment IS NULL OR min_enrollment >= 0);
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_format_check;
ALTER TABLE events ADD CONSTRAINT events_format_check CHECK (format IN ('live_virtual','in_person','hybrid','self_paced'));
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('draft','live','ended','cancelled'));
CREATE INDEX IF NOT EXISTS events_course_idx ON events (course_id, starts_at);

ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS prices     jsonb,
  ADD COLUMN IF NOT EXISTS early_bird jsonb;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS attendees jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_kind_check;
ALTER TABLE parties ADD CONSTRAINT parties_kind_check CHECK (kind IN ('venue','vendor','promoter','tax_reserve','instructor'));

CREATE TABLE IF NOT EXISTS seats (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations (id),
  order_id        text NOT NULL REFERENCES orders (id),
  event_id        text NOT NULL REFERENCES events (id),
  ticket_type_id  text NOT NULL REFERENCES ticket_types (id),
  attendee        jsonb NOT NULL,
  status          text NOT NULL CHECK (status IN ('reserved','confirmed','cancelled','transferred')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  confirmed_at    timestamptz
);
CREATE INDEX IF NOT EXISTS seats_order_idx ON seats (order_id);
CREATE INDEX IF NOT EXISTS seats_event_idx ON seats (event_id);
