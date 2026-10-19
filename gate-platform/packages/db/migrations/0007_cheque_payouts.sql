-- Payouts can be settled by a mailed cheque; the reference holds the cheque number.
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_method_check;
ALTER TABLE payouts ADD CONSTRAINT payouts_method_check CHECK (method IN ('bank_transfer','wire','cheque','other'));
