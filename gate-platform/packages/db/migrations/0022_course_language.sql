-- Teaching language of a course (ISO 639-1), for filtering courses and classes.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language text;
