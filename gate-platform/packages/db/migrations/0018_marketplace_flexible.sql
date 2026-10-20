-- Listing in EnrollClass's class finder (bookings through it carry the referral fee), and the
-- flexible-ticket upgrade organizers can offer learners.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS marketplace_listing boolean NOT NULL DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS flexible_tickets boolean NOT NULL DEFAULT false;
