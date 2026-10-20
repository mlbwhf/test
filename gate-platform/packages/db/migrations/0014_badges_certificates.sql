-- Digital badge offered with a course (Credly, Accredible, Badgr, Certopus or any link),
-- and certificate kind (attendance or completion) with the hours attended.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS badge jsonb;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'completion' CHECK (kind IN ('attendance','completion'));
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS hours numeric;
