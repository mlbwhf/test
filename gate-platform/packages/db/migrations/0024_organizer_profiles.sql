-- Public organizer profiles at /o/<slug>: the address, and what the profile shows.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_key ON organizations (slug) WHERE slug IS NOT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS profile jsonb;
