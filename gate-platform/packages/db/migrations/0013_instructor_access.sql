-- What instructors see (only their classes, or all) and whether classes they create go live
-- straight away or wait for an owner or admin to approve them. NULL means the defaults.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS instructor_access jsonb;
