-- Sprint 3: corporate accounts, invoices with partial payments, tax on orders.

CREATE TABLE IF NOT EXISTS corporate_accounts (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations (id),
  name            text NOT NULL,
  billing_email   text NOT NULL,
  address         jsonb NOT NULL,
  po_required     boolean NOT NULL DEFAULT false,
  net_terms_days  integer NOT NULL DEFAULT 30 CHECK (net_terms_days >= 0 AND net_terms_days <= 180),
  currency        char(3) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS corporate_accounts_org_idx ON corporate_accounts (organization_id, lower(billing_email));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method       text NOT NULL DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS corporate_account_id text REFERENCES corporate_accounts (id),
  ADD COLUMN IF NOT EXISTS billing_address      jsonb;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('card','invoice'));
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','paid','refunded','partially_refunded','failed','cancelled'));

CREATE TABLE IF NOT EXISTS invoices (
  id                   text PRIMARY KEY,
  organization_id      text NOT NULL REFERENCES organizations (id),
  order_id             text NOT NULL UNIQUE REFERENCES orders (id),
  corporate_account_id text REFERENCES corporate_accounts (id),
  number               text NOT NULL,
  po_number            text,
  currency             char(3) NOT NULL,
  subtotal_minor       bigint NOT NULL,
  tax_minor            bigint NOT NULL DEFAULT 0,
  total_minor          bigint NOT NULL,
  paid_minor           bigint NOT NULL DEFAULT 0,
  status               text NOT NULL CHECK (status IN ('issued','partially_paid','paid','void')),
  issued_at            timestamptz NOT NULL,
  due_at               timestamptz NOT NULL,
  payments             jsonb NOT NULL DEFAULT '[]'::jsonb,
  card_payment_ref     text UNIQUE,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, number)
);
CREATE INDEX IF NOT EXISTS invoices_org_status_idx ON invoices (organization_id, status, due_at);

CREATE TABLE IF NOT EXISTS invoice_sequences (
  organization_id text NOT NULL,
  year            integer NOT NULL,
  last_value      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, year)
);
