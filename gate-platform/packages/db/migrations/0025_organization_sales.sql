-- A timed sale on all of an organizer's classes (e.g. Black Friday): label, start and percentage steps.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sale jsonb;
