-- Door check-in from the QR ticket or by hand.
ALTER TABLE seats ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
