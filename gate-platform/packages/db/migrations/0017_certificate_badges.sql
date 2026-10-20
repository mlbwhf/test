-- EnrollClass verified badge (Open Badges 3.0) frozen on each certificate when it is issued.
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS badge jsonb;
