-- Sprint 5: meetings, attendance, certificates, message log, course delivery settings.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS prework    text,
  ADD COLUMN IF NOT EXISTS survey_url text;

ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting jsonb;
ALTER TABLE seats  ADD COLUMN IF NOT EXISTS attendance jsonb;

CREATE TABLE IF NOT EXISTS certificates (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations (id),
  seat_id         text NOT NULL UNIQUE REFERENCES seats (id),
  event_id        text NOT NULL REFERENCES events (id),
  course_name     text NOT NULL,
  attendee_name   text NOT NULL,
  attendee_email  text NOT NULL,
  issued_at       timestamptz NOT NULL,
  verify_code     text NOT NULL UNIQUE,
  revoked_at      timestamptz
);
CREATE INDEX IF NOT EXISTS certificates_event_idx ON certificates (event_id);

CREATE TABLE IF NOT EXISTS message_log (
  key             text PRIMARY KEY,
  step            text NOT NULL,
  organization_id text NOT NULL,
  event_id        text NOT NULL,
  seat_id         text,
  recipient       text NOT NULL,
  sent_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS message_log_event_idx ON message_log (event_id, sent_at);
