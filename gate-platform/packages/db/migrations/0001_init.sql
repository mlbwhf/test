-- Gate platform schema. Money is bigint minor units. Ledger tables are append-only.

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id          text PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  currency    char(3) NOT NULL,
  tenant_id   text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ledger_accounts_tenant_idx ON ledger_accounts (tenant_id);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id              text PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  currency        char(3) NOT NULL,
  description     text NOT NULL,
  effective_at    timestamptz NOT NULL,
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  metadata        jsonb
);

CREATE TABLE IF NOT EXISTS ledger_postings (
  id         bigserial PRIMARY KEY,
  entry_id   text NOT NULL REFERENCES ledger_entries (id),
  account_id text NOT NULL REFERENCES ledger_accounts (id),
  amount     bigint NOT NULL CHECK (amount <> 0)
);
CREATE INDEX IF NOT EXISTS ledger_postings_account_idx ON ledger_postings (account_id);
CREATE INDEX IF NOT EXISTS ledger_postings_entry_idx ON ledger_postings (entry_id);

-- Every entry must balance to zero in its currency, checked at commit time.
CREATE OR REPLACE FUNCTION ledger_assert_entry_balanced() RETURNS trigger AS $$
DECLARE
  v_sum bigint;
  v_count int;
  v_bad int;
BEGIN
  SELECT COALESCE(SUM(p.amount), 0), COUNT(*) INTO v_sum, v_count
    FROM ledger_postings p WHERE p.entry_id = NEW.entry_id;
  IF v_sum <> 0 THEN
    RAISE EXCEPTION 'ledger entry % is unbalanced by %', NEW.entry_id, v_sum USING ERRCODE = 'check_violation';
  END IF;
  IF v_count < 2 THEN
    RAISE EXCEPTION 'ledger entry % needs at least two postings', NEW.entry_id USING ERRCODE = 'check_violation';
  END IF;
  SELECT COUNT(*) INTO v_bad
    FROM ledger_postings p JOIN ledger_accounts a ON a.id = p.account_id
    JOIN ledger_entries e ON e.id = p.entry_id
   WHERE p.entry_id = NEW.entry_id AND a.currency <> e.currency;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'ledger entry % posts across currencies', NEW.entry_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_postings_balanced ON ledger_postings;
CREATE CONSTRAINT TRIGGER ledger_postings_balanced
  AFTER INSERT ON ledger_postings
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ledger_assert_entry_balanced();

-- Append-only: journal rows can never be changed or removed.
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = 'insufficient_privilege';
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ledger_entries_append_only ON ledger_entries;
CREATE TRIGGER ledger_entries_append_only BEFORE UPDATE OR DELETE ON ledger_entries FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
DROP TRIGGER IF EXISTS ledger_postings_append_only ON ledger_postings;
CREATE TRIGGER ledger_postings_append_only BEFORE UPDATE OR DELETE ON ledger_postings FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

CREATE TABLE IF NOT EXISTS organizations (
  id                   text PRIMARY KEY,
  name                 text NOT NULL,
  country              char(2) NOT NULL,
  currency             char(3) NOT NULL,
  payout_destination   text NOT NULL CHECK (payout_destination IN ('gate_account','external_bank')),
  pass_fee_to_attendee boolean NOT NULL DEFAULT false,
  payments_account_ref text,
  split_rules          jsonb NOT NULL DEFAULT '[]'::jsonb,
  api_key_hash         text NOT NULL UNIQUE,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parties (
  id                   text PRIMARY KEY,
  organization_id      text NOT NULL REFERENCES organizations (id),
  name                 text NOT NULL,
  kind                 text NOT NULL CHECK (kind IN ('venue','vendor','promoter','tax_reserve')),
  payments_account_ref text,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS parties_org_idx ON parties (organization_id);

CREATE TABLE IF NOT EXISTS events (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations (id),
  name            text NOT NULL,
  starts_at       timestamptz NOT NULL,
  currency        char(3) NOT NULL,
  status          text NOT NULL CHECK (status IN ('draft','live','ended')),
  split_rules     jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_org_idx ON events (organization_id);

CREATE TABLE IF NOT EXISTS ticket_types (
  id              text PRIMARY KEY,
  event_id        text NOT NULL REFERENCES events (id),
  organization_id text NOT NULL REFERENCES organizations (id),
  name            text NOT NULL,
  price_minor     bigint NOT NULL CHECK (price_minor >= 0),
  quantity        integer NOT NULL CHECK (quantity > 0),
  sold            integer NOT NULL DEFAULT 0 CHECK (sold >= 0 AND sold <= quantity)
);
CREATE INDEX IF NOT EXISTS ticket_types_event_idx ON ticket_types (event_id);

CREATE TABLE IF NOT EXISTS orders (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations (id),
  event_id        text NOT NULL REFERENCES events (id),
  ticket_type_id  text NOT NULL REFERENCES ticket_types (id),
  quantity        integer NOT NULL CHECK (quantity > 0),
  buyer_email     text NOT NULL,
  currency        char(3) NOT NULL,
  status          text NOT NULL CHECK (status IN ('pending','paid','refunded','partially_refunded','failed')),
  pricing         jsonb NOT NULL,
  splits          jsonb NOT NULL,
  payment_ref     text UNIQUE,
  transfer_refs   jsonb NOT NULL DEFAULT '{}'::jsonb,
  refunded_minor  bigint NOT NULL DEFAULT 0,
  idempotency_key text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  paid_at         timestamptz,
  UNIQUE (organization_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS orders_org_created_idx ON orders (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS refunds (
  id                 text PRIMARY KEY,
  order_id           text NOT NULL REFERENCES orders (id),
  organization_id    text NOT NULL REFERENCES organizations (id),
  amount_minor       bigint NOT NULL CHECK (amount_minor > 0),
  reason             text NOT NULL,
  status             text NOT NULL CHECK (status IN ('pending','succeeded','failed')),
  payment_refund_ref text UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refunds_order_idx ON refunds (order_id);

CREATE TABLE IF NOT EXISTS processed_events (
  provider_event_id text PRIMARY KEY,
  processed_at      timestamptz NOT NULL DEFAULT now()
);

-- HTTP-level idempotency (Idempotency-Key header) for the API.
CREATE TABLE IF NOT EXISTS api_idempotency (
  organization_id text NOT NULL,
  key             text NOT NULL,
  request_hash    text NOT NULL,
  status_code     integer NOT NULL,
  response        jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, key)
);
