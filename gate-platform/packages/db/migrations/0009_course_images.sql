-- Course cover images (served from the API media store or an external URL).
ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url text;
