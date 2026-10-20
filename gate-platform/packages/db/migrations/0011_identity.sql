-- Self-serve accounts: users, their sign-in identities, organization memberships with
-- roles, invitations, sessions and one-time tokens. Secrets are stored only as SHA-256.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS kind text CHECK (kind IS NULL OR kind IN ('company', 'individual'));

CREATE TABLE IF NOT EXISTS users (
  id             text PRIMARY KEY,
  email          text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  name           text,
  avatar_url     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_login_at  timestamptz
);

CREATE TABLE IF NOT EXISTS identities (
  provider   text NOT NULL,
  subject    text NOT NULL,
  user_id    text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, subject)
);
CREATE INDEX IF NOT EXISTS identities_user ON identities (user_id);

CREATE TABLE IF NOT EXISTS memberships (
  organization_id text NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  user_id         text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('owner', 'admin', 'instructor', 'finance')),
  party_id        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS memberships_user ON memberships (user_id);

CREATE TABLE IF NOT EXISTS invitations (
  id                  text PRIMARY KEY,
  organization_id     text NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  email               text NOT NULL,
  role                text NOT NULL CHECK (role IN ('owner', 'admin', 'instructor', 'finance')),
  token_hash          text NOT NULL UNIQUE,
  invited_by_user_id  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz NOT NULL,
  accepted_at         timestamptz,
  accepted_by_user_id text,
  revoked_at          timestamptz
);
CREATE INDEX IF NOT EXISTS invitations_org ON invitations (organization_id);
CREATE INDEX IF NOT EXISTS invitations_email ON invitations (email) WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id              text PRIMARY KEY,
  token_hash      text NOT NULL UNIQUE,
  user_id         text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  organization_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  last_seen_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_sessions_user ON auth_sessions (user_id);

CREATE TABLE IF NOT EXISTS auth_tokens (
  hash       text PRIMARY KEY,
  kind       text NOT NULL CHECK (kind IN ('oauth_state', 'login_code', 'email_link')),
  payload    jsonb NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_tokens_expiry ON auth_tokens (expires_at);
