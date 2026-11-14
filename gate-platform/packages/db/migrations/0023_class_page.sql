-- Class page sections and content, instructor profiles, organizer accent colour,
-- and invoices learners ask for at checkout.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS page jsonb;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS accent_color text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS checkout_invoices boolean NOT NULL DEFAULT true;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS self_service boolean NOT NULL DEFAULT false;
