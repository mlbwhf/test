-- Sprint 4: change policy, seat transfers, substitutions, waitlist.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS change_policy jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS change_policy jsonb;

ALTER TABLE seats
  ADD COLUMN IF NOT EXISTS transferred_from_seat_id text,
  ADD COLUMN IF NOT EXISTS transferred_to_seat_id   text,
  ADD COLUMN IF NOT EXISTS substitutions            jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cancelled_at             timestamptz;

CREATE TABLE IF NOT EXISTS seat_transfers (
  id                text PRIMARY KEY,
  organization_id   text NOT NULL REFERENCES organizations (id),
  from_seat_id      text NOT NULL REFERENCES seats (id),
  to_event_id       text NOT NULL REFERENCES events (id),
  to_ticket_type_id text NOT NULL REFERENCES ticket_types (id),
  fee_minor         bigint NOT NULL DEFAULT 0,
  currency          char(3) NOT NULL,
  status            text NOT NULL CHECK (status IN ('pending_payment','completed','failed')),
  payment_ref       text UNIQUE,
  to_seat_id        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);
CREATE INDEX IF NOT EXISTS seat_transfers_seat_idx ON seat_transfers (from_seat_id);

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id                 text PRIMARY KEY,
  organization_id    text NOT NULL REFERENCES organizations (id),
  event_id           text NOT NULL REFERENCES events (id),
  ticket_type_id     text NOT NULL REFERENCES ticket_types (id),
  email              text NOT NULL,
  name               text,
  quantity           integer NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  status             text NOT NULL CHECK (status IN ('waiting','offered','converted','expired','cancelled')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  offered_at         timestamptz,
  offer_expires_at   timestamptz,
  converted_order_id text
);
CREATE INDEX IF NOT EXISTS waitlist_event_open_idx ON waitlist_entries (event_id, created_at) WHERE status IN ('waiting','offered');
CREATE INDEX IF NOT EXISTS waitlist_offered_idx ON waitlist_entries (offer_expires_at) WHERE status = 'offered';
