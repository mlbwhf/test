-- Integrations: organizer-managed API keys (only a hash is stored) and outgoing webhooks
-- with their recent deliveries.
CREATE TABLE IF NOT EXISTS api_keys (
  id                 text PRIMARY KEY,
  organization_id    text NOT NULL REFERENCES organizations(id),
  name               text NOT NULL,
  prefix             text NOT NULL,
  hash               text NOT NULL UNIQUE,
  access             text NOT NULL CHECK (access IN ('full','read')),
  created_at         timestamptz NOT NULL,
  created_by_user_id text,
  last_used_at       timestamptz,
  revoked_at         timestamptz
);
CREATE INDEX IF NOT EXISTS api_keys_org ON api_keys (organization_id);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id              text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  url             text NOT NULL,
  secret          text NOT NULL,
  events          jsonb NOT NULL,
  description     text,
  created_at      timestamptz NOT NULL,
  disabled_at     timestamptz
);
CREATE INDEX IF NOT EXISTS webhook_endpoints_org ON webhook_endpoints (organization_id);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              text PRIMARY KEY,
  endpoint_id     text NOT NULL REFERENCES webhook_endpoints(id),
  organization_id text NOT NULL,
  type            text NOT NULL,
  body            text NOT NULL,
  status          text NOT NULL CHECK (status IN ('pending','succeeded','failed')),
  attempts        integer NOT NULL,
  response_status integer,
  error           text,
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS webhook_deliveries_endpoint ON webhook_deliveries (endpoint_id, created_at DESC);
